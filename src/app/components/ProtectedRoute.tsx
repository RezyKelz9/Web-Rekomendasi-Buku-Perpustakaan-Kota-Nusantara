import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/select-role" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/user"} replace />;
  }
  return <Outlet />;
}

export function MemberRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/select-role" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/select-role" replace />;
  if (user?.role !== "admin") return <Navigate to="/user" replace />;
  return <Outlet />;
}

