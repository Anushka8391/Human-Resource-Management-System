import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();

  if (loading) {
    return <div className="center-text">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.map((role) => String(role).toLowerCase()).includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
