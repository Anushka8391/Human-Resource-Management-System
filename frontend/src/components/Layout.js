import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const navClassName = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-identity">
          <Link to="/" className="brand">
            <span>HRMS</span>
          </Link>
          <p className="topbar-subtitle">Workforce operations at a glance</p>
        </div>
        <div className="topbar-actions">
          <span className="date-pill">{today}</span>
          <span className="role-pill">{user?.role}</span>
          <span className="user-pill">{user?.name}</span>
          <button type="button" className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="content-wrap">
        <aside className="sidebar">
          <NavLink to="/" end className={navClassName}>
            Dashboard
          </NavLink>

          {user?.role === "admin" && (
            <>
              <NavLink to="/employees" className={navClassName}>
                Employees
              </NavLink>
              <NavLink to="/attendance" className={navClassName}>
                Attendance
              </NavLink>
              <NavLink to="/leaves" className={navClassName}>
                Leaves
              </NavLink>
            </>
          )}

          {user?.role === "employee" && (
            <>
              <NavLink to="/attendance" className={navClassName}>
                Attendance
              </NavLink>
              <NavLink to="/leaves" className={navClassName}>
                Leaves
              </NavLink>
            </>
          )}

          <div className="sidebar-note">
            <p>People-first HR operations with a clean, decision-ready workspace.</p>
          </div>
        </aside>

        <main className="main-content">
          <div className="main-surface">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
