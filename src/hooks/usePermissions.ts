import { useAuth } from "../context/AuthContext";

export default function usePermissions() {
  const { permissions, hasPermission, userRole, userProfile, isAuthLoading, isRoleLoading } = useAuth();

  return {
    permissions,
    hasPermission,
    userRole,
    userProfile,
    isAuthLoading,
    isRoleLoading,
  };
}
