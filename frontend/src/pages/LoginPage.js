import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isDevelopment = process.env.NODE_ENV !== "production";
const defaultAdminEmail = isDevelopment ? "admin@hrms.com" : "";
const defaultAdminPassword = isDevelopment ? "admin123" : "";

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState(defaultAdminEmail);
  const [password, setPassword] = useState(defaultAdminPassword);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setError("");

    if (nextRole === "admin") {
      setEmail(defaultAdminEmail);
      setPassword(defaultAdminPassword);
      return;
    }

    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, role);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Human Resource Management System</h1>
        <p>Sign in to continue to your workspace</p>

        <div className="login-role-switch" role="group" aria-label="Select login role">
          <button
            type="button"
            className={`role-option ${role === "admin" ? "active" : ""}`}
            onClick={() => selectRole("admin")}
          >
            Admin Login
          </button>
          <button
            type="button"
            className={`role-option ${role === "employee" ? "active" : ""}`}
            onClick={() => selectRole("employee")}
          >
            Employee Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Signing in..."
              : role === "admin"
                ? "Login as Admin"
                : "Login as Employee"}
          </button>
        </form>

        <div className="login-helper">
          {isDevelopment && (
            <>
              <strong>Default Admin:</strong> admin@hrms.com / admin123
              <br />
            </>
          )}
          <strong>Employee:</strong> use credentials created by admin from Employee Management
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
