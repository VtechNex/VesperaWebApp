import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";
import AccessRestricted from "./AccessRestricted";
import ErrorState from "./ErrorState";

export default function ProtectedRoute({ children, roles = [], permission, redirectTo = "/admin/login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authLoading, authError, hasPermission, rehydrate } = useAuth();

  if (authLoading) {
    return <Loading message="Checking your session..." />;
  }

  if (authError && !user) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          title="We couldn't restore your session"
          description={authError}
          onRetry={rehydrate}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <AccessRestricted
        description="Your account does not have access to this route."
        onAction={() => navigate("/dashboard/admin", { replace: true })}
      />
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <AccessRestricted
        description="Your account does not have permission to access this area."
        onAction={() => navigate("/dashboard/admin", { replace: true })}
      />
    );
  }

  return children;
}
