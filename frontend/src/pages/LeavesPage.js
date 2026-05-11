import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const getTodayLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const LeavesPage = () => {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role.includes("admin");
  const isEmployee = role === "employee";
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "", leaveType: "full-day" });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/leaves");
      setLeaves(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const applyLeave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(form.fromDate);
    fromDateObj.setHours(0, 0, 0, 0);

    if (fromDateObj < today) {
      setError("From date cannot be a past date");
      return;
    }

    if (new Date(form.fromDate) > new Date(form.toDate)) {
      setError("From date cannot be later than To date");
      return;
    }

    try {
      await api.post("/leaves/apply", form);
      setForm({ fromDate: "", toDate: "", reason: "", leaveType: "full-day" });
      setMessage("Leave request applied");
      loadLeaves();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && data.errors.length > 0) {
        setError(data.errors.map((e) => e.message).join(", "));
      } else {
        setError(data?.message || "Failed to apply leave");
      }
    }
  };

  const reviewLeave = async (id, status) => {
    setError("");
    setMessage("");

    try {
      await api.patch(`/leaves/${id}/review`, { status });
      setMessage(`Leave ${status}`);
      loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review leave");
    }
  };

  const visibleLeaves =
    filter === "all" ? leaves : leaves.filter((leave) => leave.status === filter);

  const statusClassName = (status) => {
    if (status === "approved") {
      return "pill pill-approved";
    }
    if (status === "rejected") {
      return "pill pill-rejected";
    }
    return "pill pill-pending";
  };

  return (
    <div className="page-stack">
      <div className="section-header">
        <h2>Leave Management</h2>
        <p>
          {isAdmin
            ? "Review and decide pending leave requests"
            : "Apply for leave and track your request history"}
        </p>
      </div>

      {isEmployee && (
        <form className="panel form-grid columns-3" onSubmit={applyLeave}>
          <label>
            From Date
            <input
              type="date"
              value={form.fromDate}
              min={getTodayLocal()}
              onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
              required
            />
          </label>

          <label>
            To Date
            <input
              type="date"
              value={form.toDate}
              min={form.fromDate || getTodayLocal()}
              onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
              required
            />
          </label>

          <label>
            Reason
            <input
              type="text"
              placeholder="Medical appointment, personal reason, etc."
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              required
            />
          </label>

          <label>
            Leave Type
            <select
              value={form.leaveType}
              onChange={(e) => setForm((prev) => ({ ...prev, leaveType: e.target.value }))}
            >
              <option value="full-day">Full Day</option>
              <option value="half-day">Half Day</option>
            </select>
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Apply Leave
            </button>
          </div>
        </form>
      )}

      <div className="filter-row">
        <button
          type="button"
          className={`btn ${filter === "all" ? "btn-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`btn ${filter === "pending" ? "btn-primary" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          type="button"
          className={`btn ${filter === "approved" ? "btn-primary" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved
        </button>
        <button
          type="button"
          className={`btn ${filter === "rejected" ? "btn-primary" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </button>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="panel table-wrap">
        {loading ? (
          <p>Loading leave requests...</p>
        ) : visibleLeaves.length === 0 ? (
          <p className="empty-state">No leave requests found for this filter.</p>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {visibleLeaves.map((leave) => (
              <tr key={leave._id}>
                <td>{leave.employee?.user?.name || "-"}</td>
                <td>{leave.fromDate}</td>
                <td>{leave.toDate}</td>
                <td>{leave.leaveType === "half-day" ? "Half Day" : "Full Day"}</td>
                <td>{leave.reason}</td>
                <td>
                  <span className={statusClassName(leave.status)}>{leave.status}</span>
                </td>
                {isAdmin && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={leave.status !== "pending"}
                      onClick={() => reviewLeave(leave._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      disabled={leave.status !== "pending"}
                      onClick={() => reviewLeave(leave._id, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default LeavesPage;
