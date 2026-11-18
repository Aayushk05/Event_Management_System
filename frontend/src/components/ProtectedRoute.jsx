import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_REDIRECTS = {
  participant: "/dashboard",
  organizer:   "/organizer/dashboard",
  admin:       "/admin/dashboard",
};

/**
 * ProtectedRoute
 * @param {string[]} roles - allowed roles. If omitted, any authenticated user passes.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    const redirect = ROLE_REDIRECTS[user?.role] || "/login";
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default ProtectedRoute;
