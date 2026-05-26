import React from "react";
import usePermissions from "../hooks/usePermissions";

type PermissionGateProps = {
  permission?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { hasPermission, isAuthLoading, isRoleLoading } = usePermissions();
  const canUsePermission = hasPermission as unknown as ((permissionName: string) => boolean) | undefined;

  if (isAuthLoading || isRoleLoading) return null;
  if (permission && !canUsePermission?.(permission)) return fallback;
  return children;
}
