import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role.includes("admin");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const employeeProfile = summary?.employeeProfile || user?.employee || null;
  const formattedJoiningDate = employeeProfile?.joiningDate
    ? new Date(employeeProfile.joiningDate).toLocaleDateString()
    : "-";

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await api.get("/dashboard/summary");
        setSummary(data);
      } catch {
        setError("Failed to load dashboard summary");
      }
    };

    loadSummary();
  }, []);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!summary) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="page-stack">
      <div className="section-header">
        <h2>Dashboard</h2>
        <p>
          {isAdmin
            ? "Track team strength, attendance trends, and leave workload in one place."
            : "Track your profile, leave requests, and attendance consistency in one place."}
        </p>
      </div>

      {isAdmin ? (
        <div className="card-grid">
          <article className="stat-card accent-a">
            <h3>Total Employees</h3>
            <p className="metric-value">{summary.employeeCount}</p>
          </article>

          <article className="stat-card accent-b">
            <h3>Leave Summary</h3>
            <p className="metric-line">Total: {summary.leaveSummary.total}</p>
            <p className="metric-line">Approved: {summary.leaveSummary.approved}</p>
            <p className="metric-line">Pending: {summary.leaveSummary.pending}</p>
          </article>

          <article className="stat-card accent-c">
            <h3>Attendance Summary</h3>
            <p className="metric-line">Present: {summary.attendanceSummary.present}</p>
            <p className="metric-line">Absent: {summary.attendanceSummary.absent}</p>
          </article>
        </div>
      ) : (
        <div className="card-grid">
          <article className="stat-card accent-a employee-profile-card">
            <h3>Employee Details</h3>

            <div className="profile-grid">
              <div className="profile-item">
                <span className="profile-label">Name</span>
                <span className="profile-value">{user?.name || "-"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user?.email || "-"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Employee ID</span>
                <span className="profile-value">{employeeProfile?.employeeId || "-"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Department</span>
                <span className="profile-value">{employeeProfile?.department || "-"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Designation</span>
                <span className="profile-value">{employeeProfile?.designation || "-"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Joining Date</span>
                <span className="profile-value">{formattedJoiningDate}</span>
              </div>
            </div>
          </article>

          <article className="stat-card accent-b">
            <h3>My Leave Summary</h3>
            <p className="metric-line">Total: {summary.leaveSummary.total}</p>
            <p className="metric-line">Approved: {summary.leaveSummary.approved}</p>
            <p className="metric-line">Pending: {summary.leaveSummary.pending}</p>
          </article>

          <article className="stat-card accent-c">
            <h3>My Attendance Summary</h3>
            <p className="metric-line">Present: {summary.attendanceSummary.present}</p>
            <p className="metric-line">Absent: {summary.attendanceSummary.absent}</p>
          </article>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
