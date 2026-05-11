import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateKey = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return toLocalDateString(new Date(value));
};

const getTodayDateValue = () => {
  return toLocalDateString(new Date());
};

const formatCalendarDetails = (dateKey) => {
  if (!dateKey) {
    return "";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AttendancePage = () => {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role.includes("admin");
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [form, setForm] = useState(() => ({
    employeeId: "",
    status: "present",
  }));
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState(() => isAdmin ? getTodayDateValue() : "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const syncCalendarToDate = (dateKey) => {
    const [year, month] = dateKey.split("-").map(Number);
    setSelectedDateKey(dateKey);
    setSelectedMonth(month - 1);
    setSelectedYear(year);
  };

  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    const { data } = await api.get("/employees");
    const employeeList = Array.isArray(data) ? data : data.data || [];
    setEmployees(employeeList);
    if (employeeList.length && !form.employeeId) {
      setForm((prev) => ({ ...prev, employeeId: employeeList[0]._id }));
    }
  };

  const loadRecords = async () => {
    try {
      const { data } = await api.get("/attendance/records?limit=100");
      setRecords(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError("Failed to load attendance records");
    }
  };

  const loadApprovedLeaves = async () => {
    if (isAdmin) return;
    try {
      const { data } = await api.get("/leaves?status=approved&limit=100");
      setApprovedLeaves(Array.isArray(data) ? data : data.data || []);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    loadEmployees();
    loadRecords();
    loadApprovedLeaves();
  }, [isAdmin]);

  useEffect(() => {
    const todayKey = getTodayDateValue();

    const scheduleNextDaySync = () => {
      const current = new Date();
      const nextMidnight = new Date(current);
      nextMidnight.setHours(24, 0, 0, 0);

      return window.setTimeout(() => {
        const latestTodayKey = getTodayDateValue();
        syncCalendarToDate(latestTodayKey);
      }, nextMidnight.getTime() - current.getTime());
    };

    if (!selectedDateKey) {
      syncCalendarToDate(todayKey);
    }

    const timerId = scheduleNextDaySync();

    return () => window.clearTimeout(timerId);
  }, [selectedDateKey]);

  const doMarkAttendance = async () => {
    try {
      const payload = { status: form.status };
      if (isAdmin) {
        payload.employeeId = form.employeeId;
      }
      const { data } = await api.post("/attendance/mark", payload);
      const markedDateKey = getDateKey(data?.attendance?.date || getTodayDateValue());
      setMessage("Attendance marked successfully");
      syncCalendarToDate(markedDateKey);
      loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isAdmin) {
      const todayKey = getTodayDateValue();
      const existingRecord = records.find(
        (r) => getDateKey(r.date) === todayKey && r.employee?._id === form.employeeId
      );

      if (existingRecord && existingRecord.status !== form.status) {
        const employeeObj = employees.find((emp) => emp._id === form.employeeId);
        setConfirmDialog({
          employeeName: employeeObj?.user?.name || "Employee",
          currentStatus: existingRecord.status,
          newStatus: form.status,
        });
        return;
      }
    }

    await doMarkAttendance();
  };

  const visibleRecords =
    statusFilter === "all"
      ? records
      : records.filter((record) => record.status === statusFilter);

  const visibleRecordsByDate = visibleRecords.reduce((acc, record) => {
    const key = getDateKey(record.date);
    if (!key) {
      return acc;
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(record);
    return acc;
  }, {});

  const attendanceByDate = records.reduce((acc, record) => {
    const key = getDateKey(record.date);
    if (key) {
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
    }
    return acc;
  }, {});

  // Build a set of leave dates from approved leaves (for employee calendar overlay)
  const leaveDateSet = new Set();
  if (!isAdmin) {
    approvedLeaves.forEach((leave) => {
      const current = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");
        leaveDateSet.add(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }
    });
  }

  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const startingWeekday = firstDayOfMonth.getDay();
  const calendarCells = [];

  for (let i = 0; i < startingWeekday; i += 1) {
    calendarCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(new Date(selectedYear, selectedMonth, day));
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y += 1) {
    yearOptions.push(y);
  }

  const stats = visibleRecords
    .filter((record) => {
      const key = getDateKey(record.date);
      if (!key) return false;
      const [year, month] = key.split("-").map(Number);
      return year === selectedYear && month - 1 === selectedMonth;
    })
    .reduce(
    (acc, record) => {
      acc.total += 1;
      if (record.status === "present") {
        acc.present += 1;
      }
      if (record.status === "absent") {
        acc.absent += 1;
      }
      if (record.status === "half-day") {
        acc.halfDay += 1;
      }
      if (record.status === "leave") {
        acc.leave += 1;
      }
      return acc;
    },
    { total: 0, present: 0, absent: 0, halfDay: 0, leave: 0 }
  );

  const statusClassName = (status) => {
    if (status === "present") {
      return "pill pill-approved";
    }
    if (status === "absent") {
      return "pill pill-rejected";
    }
    if (status === "leave") {
      return "pill pill-leave";
    }
    return "pill pill-pending";
  };

  const selectedDateRecords = visibleRecordsByDate[selectedDateKey] || [];
  const selectedDateLabel = formatCalendarDetails(selectedDateKey);
  const tableRecords = selectedDateRecords;

  const getAdminDaySummary = (dayRecords) => {
    const summary = dayRecords.reduce(
      (acc, record) => {
        acc.total += 1;
        if (record.status === "present") {
          acc.present += 1;
        }
        if (record.status === "absent") {
          acc.absent += 1;
        }
        if (record.status === "half-day") {
          acc.halfDay += 1;
        }
        return acc;
      },
      { total: 0, present: 0, absent: 0, halfDay: 0 }
    );

    return `${summary.total} marked`;
  };

  return (
    <div className="page-stack">
      <div className="section-header">
        <h2>Attendance Management</h2>
        <p>
          {isAdmin
            ? "Mark today attendance and review day-by-day records on the calendar."
            : "View your personal attendance history and monthly consistency."}
        </p>
      </div>

      {!isAdmin && (
        <div className="card-grid">
          <article className="stat-card accent-a">
            <h3>Total Records</h3>
            <p className="metric-value">{stats.total}</p>
          </article>
          <article className="stat-card accent-b">
            <h3>Present Days</h3>
            <p className="metric-value">{stats.present}</p>
          </article>
          <article className="stat-card accent-c">
            <h3>Absent / Half-Day / Leave</h3>
            <p className="metric-line">Absent: {stats.absent}</p>
            <p className="metric-line">Half-Day: {stats.halfDay}</p>
            <p className="metric-line">Leave: {stats.leave}</p>
          </article>
        </div>
      )}

      {isAdmin && (
      <form className="panel form-grid columns-3" onSubmit={submitAttendance}>
        {isAdmin && (
          <label>
            Employee
            <select
              value={form.employeeId}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
              required
            >
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.user.name} ({employee.employeeId})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="today-lock-card">
          <span className="today-lock-label">Marking Date</span>
          <strong>{getTodayDateValue()}</strong>
          <span className="today-lock-note">Locked to today based on server date</span>
        </div>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half-Day</option>
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Mark Attendance
          </button>
        </div>
      </form>
      )}

      <section className="panel calendar-panel">
        <div className="calendar-head">
          <h3>{isAdmin ? "Attendance Calendar" : "Attendance Calendar"}</h3>
          <div className="calendar-controls">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-legend">
          {isAdmin ? (
            <>
              <span className="legend-item marked">Marked</span>
              <span className="legend-item no-record">No Record</span>
            </>
          ) : (
            <>
              <span className="legend-item present">Present</span>
              <span className="legend-item absent">Absent</span>
              <span className="legend-item half-day">Half-Day</span>
              <span className="legend-item leave">Leave</span>
              <span className="legend-item week-off">Week Off</span>
              <span className="legend-item no-record">No Record</span>
            </>
          )}
        </div>

        <div className="calendar-grid header">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day} className="calendar-weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="calendar-grid days">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="calendar-day empty" />;
            }

            const dateKey = getDateKey(cell);
            const dayRecords = attendanceByDate[dateKey] || [];
            const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;

            let stateClass = "no-record";
            let stateLabel = "No Record";

            if (isAdmin) {
              if (dayRecords.length) {
                stateClass = "marked";
                stateLabel = getAdminDaySummary(dayRecords);
              }
            } else {
              const status = dayRecords[0]?.status;
              const isLeaveDay = !status && leaveDateSet.has(dateKey);
              stateClass = status
                ? status === "present"
                  ? "present"
                  : status === "absent"
                    ? "absent"
                    : status === "leave"
                      ? "leave"
                      : "half-day"
                : isLeaveDay
                  ? "leave"
                  : isWeekend
                    ? "week-off"
                    : "no-record";
              stateLabel = status
                ? status
                : isLeaveDay
                  ? "Leave"
                  : isWeekend
                    ? "Week Off"
                    : "No Record";
            }

            return (
              <button
                key={dateKey}
                type="button"
                className={`calendar-day ${stateClass} ${selectedDateKey === dateKey ? "selected" : ""} ${dateKey === getTodayDateValue() ? "today" : ""}`}
                onClick={() => setSelectedDateKey(dateKey)}
              >
                <span className="date-number">{cell.getDate()}</span>
                <span className="date-status">{stateLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {isAdmin && (
      <div className="filter-row">
        <button
          type="button"
          className={`btn ${statusFilter === "all" ? "btn-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`btn ${statusFilter === "present" ? "btn-primary" : ""}`}
          onClick={() => setStatusFilter("present")}
        >
          Present
        </button>
        <button
          type="button"
          className={`btn ${statusFilter === "absent" ? "btn-primary" : ""}`}
          onClick={() => setStatusFilter("absent")}
        >
          Absent
        </button>
        <button
          type="button"
          className={`btn ${statusFilter === "half-day" ? "btn-primary" : ""}`}
          onClick={() => setStatusFilter("half-day")}
        >
          Half-Day
        </button>
      </div>
      )}

      {isAdmin && (
      <div className="panel table-wrap">
        <div className="calendar-head">
          <h3>Selected Day Records</h3>
          <p className="selected-day-label">{selectedDateLabel}</p>
        </div>
        {tableRecords.length === 0 ? (
          <p className="empty-state">No attendance records found for the selected day.</p>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tableRecords.map((record) => (
              <tr key={record._id}>
                <td>{record.date}</td>
                <td>{record.employee?.user?.name || "-"}</td>
                <td>{record.employee?.user?.email || "-"}</td>
                <td>
                  <span className={statusClassName(record.status)}>{record.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      )}

      {confirmDialog && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Update Attendance?</h3>
            <p>
              <strong>{confirmDialog.employeeName}</strong> is already marked as{" "}
              <span className={statusClassName(confirmDialog.currentStatus)}>
                {confirmDialog.currentStatus}
              </span>{" "}
              today.
            </p>
            <p>
              Change to{" "}
              <span className={statusClassName(confirmDialog.newStatus)}>
                {confirmDialog.newStatus}
              </span>
              ?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setConfirmDialog(null);
                  await doMarkAttendance();
                }}
              >
                Yes, Update
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
