import React from "react";
import usePermissions from "../hooks/usePermissions";

export default function PermissionGate({ permission, fallback = null, children }) {
  const { hasPermission, isAuthLoading, isRoleLoading } = usePermissions();

  if (isAuthLoading || isRoleLoading) return null;
  if (permission && !hasPermission(permission)) return fallback;
  return children;
}
