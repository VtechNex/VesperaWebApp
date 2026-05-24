export const ROLES = {
  MAIN_ADMIN: "MAIN_ADMIN",
  L1: "L1",
  L2: "L2",
} as const;

export const PERMISSION_KEYS = [
  "canViewDashboard",
  "canViewLeads",
  "canViewLeadPhone",
  "canCreateLead",
  "canEditLead",
  "canDeleteLead",
  "canExportLeads",
  "canViewLists",
  "canCreateList",
  "canEditList",
  "canDeleteList",
  "canManageUsers",
  "canManageSettings",
  "canReadCustomFieldsForLeadForm",
  "canManageCustomFields",
  "canManageCompanyProfile",
  "canManageQualifiers",
  "canManageLeadStages",
  "canManagePropertyMedia",
] as const;

export const PERMISSIONS_MATRIX = {
  [ROLES.MAIN_ADMIN]: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewLeadPhone: true,
    canCreateLead: true,
    canEditLead: true,
    canDeleteLead: true,
    canExportLeads: true,
    canViewLists: true,
    canCreateList: true,
    canEditList: true,
    canDeleteList: true,
    canManageUsers: true,
    canManageSettings: true,
    canReadCustomFieldsForLeadForm: true,
    canManageCustomFields: true,
    canManageCompanyProfile: true,
    canManageQualifiers: true,
    canManageLeadStages: true,
    canManagePropertyMedia: true,
  },
  [ROLES.L1]: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewLeadPhone: true,
    canCreateLead: true,
    canEditLead: false,
    canDeleteLead: false,
    canExportLeads: false,
    canViewLists: true,
    canCreateList: false,
    canEditList: false,
    canDeleteList: false,
    canManageUsers: false,
    canManageSettings: false,
    canReadCustomFieldsForLeadForm: true,
    canManageCustomFields: false,
    canManageCompanyProfile: false,
    canManageQualifiers: false,
    canManageLeadStages: false,
    canManagePropertyMedia: false,
  },
  [ROLES.L2]: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewLeadPhone: false,
    canCreateLead: false,
    canEditLead: false,
    canDeleteLead: false,
    canExportLeads: false,
    canViewLists: true,
    canCreateList: false,
    canEditList: false,
    canDeleteList: false,
    canManageUsers: false,
    canManageSettings: false,
    canReadCustomFieldsForLeadForm: false,
    canManageCustomFields: false,
    canManageCompanyProfile: false,
    canManageQualifiers: false,
    canManageLeadStages: false,
    canManagePropertyMedia: false,
  },
} as const;

const LEGACY_ROLE_MAP: Record<string, string> = {
  main_admin: ROLES.MAIN_ADMIN,
  admin: ROLES.MAIN_ADMIN,
  superadmin: ROLES.MAIN_ADMIN,
  owner: ROLES.MAIN_ADMIN,
  l1: ROLES.L1,
  manager: ROLES.L1,
  l2: ROLES.L2,
  sales: ROLES.L2,
  marketing: ROLES.L2,
  customer: ROLES.L2,
};

export function normalizeRole(rawRole?: string | null) {
  if (!rawRole) return ROLES.L2;
  const normalized = LEGACY_ROLE_MAP[String(rawRole).trim().toLowerCase()];
  return normalized || ROLES.L2;
}

export function getPermissionsForRole(rawRole?: string | null) {
  return PERMISSIONS_MATRIX[normalizeRole(rawRole)];
}

export function hasPermission(rawRole: string | null | undefined, permissionName: string) {
  const permissions = getPermissionsForRole(rawRole);
  return Boolean(permissions?.[permissionName as keyof typeof permissions]);
}

export function getRoleLabel(rawRole?: string | null) {
  const role = normalizeRole(rawRole);
  if (role === ROLES.MAIN_ADMIN) return "Main Admin";
  if (role === ROLES.L1) return "L1";
  return "L2";
}
