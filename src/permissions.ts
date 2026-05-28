export const ROLES = {
  MAIN_ADMIN: "MAIN_ADMIN",
  MANAGER: "MANAGER",
  L1: "L1",
  L2: "L2",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

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

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type PermissionRecord = Record<PermissionKey, boolean>;
export type PermissionGroup = {
  key: string;
  label: string;
  permissions: Array<{ key: PermissionKey; label: string }>;
};

export const MANAGE_USERS_PERMISSION_KEYS = [
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
  "canManageCompanyProfile",
  "canManageQualifiers",
  "canManageLeadStages",
  "canManagePropertyMedia",
] as const satisfies readonly PermissionKey[];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "canViewDashboard", label: "View Dashboard" }],
  },
  {
    key: "leads",
    label: "Leads",
    permissions: [
      { key: "canViewLeads", label: "View Leads" },
      { key: "canViewLeadPhone", label: "View Lead Phone Number" },
      { key: "canCreateLead", label: "Add Lead" },
      { key: "canEditLead", label: "Edit Lead" },
      { key: "canDeleteLead", label: "Delete Lead" },
      { key: "canExportLeads", label: "Export Excel" },
    ],
  },
  {
    key: "lists",
    label: "Lists",
    permissions: [
      { key: "canViewLists", label: "View Lists" },
      { key: "canCreateList", label: "Create List" },
      { key: "canEditList", label: "Edit List" },
      { key: "canDeleteList", label: "Delete List" },
    ],
  },
  {
    key: "admin",
    label: "Admin Access",
    permissions: [
      { key: "canManageUsers", label: "Manage Users" },
      { key: "canManageSettings", label: "Manage Settings" },
      { key: "canManageCompanyProfile", label: "Manage Company Profile" },
      { key: "canManageQualifiers", label: "Manage Qualifiers" },
      { key: "canManageLeadStages", label: "Manage Lead Stages" },
      { key: "canManagePropertyMedia", label: "Manage Property Media" },
    ],
  },
];

function buildPermissionMap(value: boolean): PermissionRecord {
  return PERMISSION_KEYS.reduce((accumulator, permissionKey) => {
    accumulator[permissionKey] = value;
    return accumulator;
  }, {} as PermissionRecord);
}

export const FULL_PERMISSIONS = buildPermissionMap(true);

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionRecord> = {
  [ROLES.MAIN_ADMIN]: {
    ...FULL_PERMISSIONS,
  },
  [ROLES.MANAGER]: {
    ...FULL_PERMISSIONS,
  },
  [ROLES.L1]: {
    ...buildPermissionMap(false),
    canViewDashboard: true,
    canViewLeads: true,
    canViewLeadPhone: true,
    canCreateLead: true,
    canViewLists: true,
    canReadCustomFieldsForLeadForm: true,
  },
  [ROLES.L2]: {
    ...buildPermissionMap(false),
    canViewDashboard: true,
    canViewLeads: true,
    canViewLists: true,
  },
};

const LEGACY_ROLE_MAP: Record<string, Role> = {
  main_admin: ROLES.MAIN_ADMIN,
  admin: ROLES.MAIN_ADMIN,
  superadmin: ROLES.MAIN_ADMIN,
  owner: ROLES.MAIN_ADMIN,
  manager: ROLES.MANAGER,
  l1: ROLES.L1,
  sales: ROLES.L2,
  marketing: ROLES.L2,
  customer: ROLES.L2,
  l2: ROLES.L2,
};

export function resolveKnownRole(rawRole?: string | null): Role | null {
  if (!rawRole) return null;
  const trimmedRole = String(rawRole).trim();
  if (!trimmedRole) return null;

  if ((Object.values(ROLES) as string[]).includes(trimmedRole)) {
    return trimmedRole as Role;
  }

  return LEGACY_ROLE_MAP[trimmedRole.toLowerCase()] || null;
}

export function normalizeRole(rawRole?: string | null, fallbackRole: Role = ROLES.L2): Role {
  return resolveKnownRole(rawRole) || fallbackRole;
}

export function normalizePermissionRecord(rawPermissions?: Partial<PermissionRecord> | null): PermissionRecord {
  return PERMISSION_KEYS.reduce((accumulator, permissionKey) => {
    accumulator[permissionKey] = Boolean(rawPermissions?.[permissionKey]);
    return accumulator;
  }, {} as PermissionRecord);
}

export function sanitizePermissionOverrides(rawPermissions?: Partial<PermissionRecord> | null): Partial<PermissionRecord> {
  return PERMISSION_KEYS.reduce((accumulator, permissionKey) => {
    if (Object.prototype.hasOwnProperty.call(rawPermissions || {}, permissionKey)) {
      accumulator[permissionKey] = Boolean(rawPermissions?.[permissionKey]);
    }
    return accumulator;
  }, {} as Partial<PermissionRecord>);
}

export function getPermissionsForRole(rawRole?: string | null): PermissionRecord {
  return {
    ...DEFAULT_ROLE_PERMISSIONS[normalizeRole(rawRole)],
  };
}

export function getDefaultPermissionsForRole(rawRole?: string | null): PermissionRecord {
  return getPermissionsForRole(rawRole);
}

export function getEffectivePermissions(userProfile?: {
  role?: string | null;
  permissions?: Partial<PermissionRecord> | null;
} | null): PermissionRecord {
  const role = normalizeRole(userProfile?.role);
  if (role === ROLES.MAIN_ADMIN) {
    return { ...FULL_PERMISSIONS };
  }
  if (role === ROLES.MANAGER) {
    return { ...DEFAULT_ROLE_PERMISSIONS[ROLES.MANAGER] };
  }

  return {
    ...DEFAULT_ROLE_PERMISSIONS[role],
    ...sanitizePermissionOverrides(userProfile?.permissions),
  };
}

export function hasPermission(
  userProfileOrRole: string | { role?: string | null; permissions?: Partial<PermissionRecord> | null } | null | undefined,
  permissionName: string
) {
  if (!PERMISSION_KEYS.includes(permissionName as PermissionKey)) {
    return false;
  }

  if (typeof userProfileOrRole === "string" || userProfileOrRole == null) {
    return Boolean(getPermissionsForRole(userProfileOrRole)?.[permissionName as PermissionKey]);
  }

  return Boolean(getEffectivePermissions(userProfileOrRole)?.[permissionName as PermissionKey]);
}

export function getRoleLabel(rawRole?: string | null) {
  const role = normalizeRole(rawRole);
  if (role === ROLES.MAIN_ADMIN) return "Main Admin";
  if (role === ROLES.MANAGER) return "Manager";
  if (role === ROLES.L1) return "L1";
  return "L2";
}
