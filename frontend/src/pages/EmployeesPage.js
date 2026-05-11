import { useEffect, useState } from "react";
import api from "../api/client";

const initialForm = {
  name: "",
  email: "",
  password: "",
  employeeId: "",
  department: "",
  designation: "",
  phone: "",
  joiningDate: "",
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getApiErrorMessage = (err, fallbackMessage) => {
    const responseData = err?.response?.data;
    if (responseData?.errors?.length) {
      return responseData.errors[0].message;
    }
    return responseData?.message || fallbackMessage;
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onEdit = (employee) => {
    setEditingId(employee._id);
    setForm({
      name: employee.user.name,
      email: employee.user.email,
      password: "",
      employeeId: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      phone: employee.phone || "",
      joiningDate: employee.joiningDate?.split("T")[0] || "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      setMessage("Employee deleted");
      loadEmployees();
    } catch (err) {
      setError(getApiErrorMessage(err, "Delete failed"));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, {
          name: form.name,
          email: form.email,
          department: form.department,
          designation: form.designation,
          phone: form.phone,
          joiningDate: form.joiningDate,
        });
        setMessage("Employee updated");
      } else {
        await api.post("/employees", form);
        setMessage("Employee added");
      }

      resetForm();
      loadEmployees();
    } catch (err) {
      setError(getApiErrorMessage(err, "Request failed"));
    }
  };

  const visibleEmployees = employees.filter((employee) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return [
      employee.employeeId,
      employee.user?.name,
      employee.user?.email,
      employee.department,
      employee.designation,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  return (
    <div className="page-stack">
      <div className="section-header">
        <h2>Employee Management</h2>
        <p>Create and maintain employee records securely.</p>
      </div>

      <form onSubmit={onSubmit} className="panel form-grid columns-3">
        <label>
          Name
          <input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </label>

        {!editingId && (
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </label>
        )}

        <label>
          Employee ID
          <input
            value={form.employeeId}
            onChange={(e) => updateField("employeeId", e.target.value)}
            required
            disabled={Boolean(editingId)}
          />
        </label>

        <label>
          Department
          <input
            value={form.department}
            onChange={(e) => updateField("department", e.target.value)}
            required
          />
        </label>

        <label>
          Designation
          <input
            value={form.designation}
            onChange={(e) => updateField("designation", e.target.value)}
            required
          />
        </label>

        <label>
          Phone
          <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
        </label>

        <label>
          Joining Date
          <input
            type="date"
            value={form.joiningDate}
            onChange={(e) => updateField("joiningDate", e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Employee" : "Add Employee"}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="panel toolbar-panel">
        <label>
          Search Employees
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department, role"
          />
        </label>
      </div>

      <div className="panel table-wrap">
        {visibleEmployees.length === 0 ? (
          <p className="empty-state">No matching employees found.</p>
        ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((employee) => (
              <tr key={employee._id}>
                <td>{employee.employeeId}</td>
                <td>{employee.user?.name}</td>
                <td>{employee.user?.email}</td>
                <td>{employee.department}</td>
                <td>{employee.designation}</td>
                <td>
                  <button type="button" className="btn btn-small" onClick={() => onEdit(employee)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => onDelete(employee._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
