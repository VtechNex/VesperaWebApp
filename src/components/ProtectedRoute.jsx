import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";
import AccessRestricted from "./AccessRestricted";

export default function ProtectedRoute({ children, roles = [], permission, redirectTo = "/admin/login" }) {
  const location = useLocation();
  const { user, status, hasPermission } = useAuth();

  if (status === "loading") {
    return <Loading message="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <AccessRestricted
        description="Your account does not have access to this route."
        onAction={() => (window.location.href = "/dashboard/admin")}
      />
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <AccessRestricted
        description="Your account does not have permission to access this area."
        onAction={() => (window.location.href = "/dashboard/admin")}
      />
    );
  }

  return children;
}
