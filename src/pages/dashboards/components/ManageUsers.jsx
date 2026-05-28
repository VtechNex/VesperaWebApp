import React, { useEffect, useMemo, useState } from "react";
import { Eye, MoreHorizontal, PencilLine, ShieldCheck, Trash2, UserPlus, UserRoundCog } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import RoleBadge from "../../../components/RoleBadge";
import AccessRestricted from "../../../components/AccessRestricted";
import ADMIN from "../../../services/adminService";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../context/AuthContext";
import {
  getDefaultPermissionsForRole,
  getEffectivePermissions,
  MANAGE_USERS_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  ROLES,
} from "../../../permissions";

const CREATE_FORM = "create";
const EDIT_FORM = "edit";
const VIEW_FORM = "view";

function DarkSelect({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`appearance-none rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-[#D4AF37]/55 focus:ring-2 focus:ring-[#D4AF37]/15 ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

function ToggleCard({ checked, disabled, label, description, onChange }) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
        disabled ? "border-white/8 bg-white/[0.02] opacity-70" : "border-white/12 bg-white/[0.03] hover:border-[#D4AF37]/25"
      }`}
    >
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-white/50">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[#D4AF37]"
      />
    </label>
  );
}

function buildEmptyForm() {
  return {
    id: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: ROLES.L2,
    isActive: true,
    permissions: getDefaultPermissionsForRole(ROLES.L2),
  };
}

function normalizeUserForm(user) {
  const role = user?.role || ROLES.L2;
  return {
    id: user?.id || "",
    firstName: user?.firstName || user?.first_name || "",
    lastName: user?.lastName || user?.last_name || "",
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    role,
    isActive: Boolean(user?.isActive ?? user?.is_active ?? true),
    permissions: getEffectivePermissions({
      role,
      permissions: user?.permissions || user?.effectivePermissions || {},
    }),
  };
}

export default function ManageUsers() {
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(CREATE_FORM);
  const [form, setForm] = useState(buildEmptyForm());
  const [selectedUser, setSelectedUser] = useState(null);
  const [contextMenuId, setContextMenuId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isMainAdmin = userRole === ROLES.MAIN_ADMIN;
  const isManager = userRole === ROLES.MANAGER;
  const canControlPermissions = isMainAdmin || isManager;

  const allowedRoleOptions = useMemo(() => {
    if (isMainAdmin) {
      return [ROLES.MAIN_ADMIN, ROLES.MANAGER, ROLES.L1, ROLES.L2];
    }
    if (isManager) {
      return [ROLES.L1, ROLES.L2];
    }
    return [];
  }, [isMainAdmin, isManager]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await ADMIN.FETCH_USERS();
      if (response?.status === 200) {
        setUsers(Array.isArray(response.data?.data) ? response.data.data : []);
      } else {
        toast({
          title: "Unable to load users",
          description: response?.data?.message || "The user directory could not be loaded.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((entry) => entry.role === ROLES.MAIN_ADMIN).length;
    const managers = users.filter((entry) => entry.role === ROLES.MANAGER).length;
    const l1 = users.filter((entry) => entry.role === ROLES.L1).length;
    const l2 = users.filter((entry) => entry.role === ROLES.L2).length;
    return { total, admins, managers, l1, l2 };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (roleFilter !== "all" && entry.role !== roleFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        entry.username,
        entry.email,
        entry.name,
        entry.first_name,
        entry.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [roleFilter, search, users]);

  const permissionSummary = (userRecord) =>
    MANAGE_USERS_PERMISSION_KEYS.filter((permissionKey) => userRecord?.effectivePermissions?.[permissionKey]).length;

  const openCreateDialog = () => {
    const nextRole = allowedRoleOptions[0] || ROLES.L2;
    setDialogMode(CREATE_FORM);
    setSelectedUser(null);
    setForm({
      ...buildEmptyForm(),
      role: nextRole,
      permissions: getDefaultPermissionsForRole(nextRole),
    });
    setDialogOpen(true);
  };

  const openViewDialog = (userRecord) => {
    setDialogMode(VIEW_FORM);
    setSelectedUser(userRecord);
    setForm(normalizeUserForm(userRecord));
    setDialogOpen(true);
  };

  const openEditDialog = (userRecord) => {
    setDialogMode(EDIT_FORM);
    setSelectedUser(userRecord);
    setForm(normalizeUserForm(userRecord));
    setDialogOpen(true);
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateRole = (nextRole) => {
    setForm((current) => ({
      ...current,
      role: nextRole,
      permissions: getDefaultPermissionsForRole(nextRole),
    }));
  };

  const setPermissionValue = (permissionKey, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permissionKey]: checked,
      },
    }));
  };

  const submitForm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        permissions: form.permissions,
        ...(dialogMode === CREATE_FORM ? { password: form.password } : {}),
      };

      const response =
        dialogMode === CREATE_FORM
          ? await ADMIN.CREATE_USER(payload)
          : await ADMIN.UPDATE_USER(form.id, payload);

      if (response?.status === 201 || response?.status === 200) {
        await fetchUsers();
        setDialogOpen(false);
        toast({
          title: dialogMode === CREATE_FORM ? "User created" : "User updated",
          description:
            dialogMode === CREATE_FORM
              ? `${form.username} is now ready to access the admin panel.`
              : `${form.username} permissions were updated successfully.`,
        });
        return;
      }

      toast({
        title: dialogMode === CREATE_FORM ? "Create failed" : "Update failed",
        description: response?.data?.message || "The user record could not be saved.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (userRecord) => {
    const response = await ADMIN.UPDATE_USER(userRecord.id, {
      firstName: userRecord.firstName || userRecord.first_name || "",
      lastName: userRecord.lastName || userRecord.last_name || "",
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
      isActive: !(userRecord.isActive ?? userRecord.is_active),
      permissions: userRecord.permissions || userRecord.effectivePermissions || {},
    });

    if (response?.status === 200) {
      await fetchUsers();
      toast({
        title: userRecord.is_active ? "User deactivated" : "User activated",
        description: `${userRecord.username} status has been updated.`,
      });
      return;
    }

    toast({
      title: "Status update failed",
      description: response?.data?.message || "The user status could not be updated.",
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);
    try {
      const response = await ADMIN.DELETE_USER(selectedUser.id);
      if (response?.status === 200) {
        await fetchUsers();
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        toast({
          title: "User deleted",
          description: "The user account was removed successfully.",
        });
        return;
      }

      toast({
        title: "Delete failed",
        description: response?.data?.message || "The selected user could not be deleted.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!canControlPermissions) {
    return (
      <AccessRestricted
        description="Only MAIN_ADMIN and MANAGER accounts can manage user roles and permission sets."
      />
    );
  }

  const isViewMode = dialogMode === VIEW_FORM;
  const roleHasLockedPermissions = form.role === ROLES.MAIN_ADMIN || form.role === ROLES.MANAGER;
  const permissionCardsDisabled = isViewMode || roleHasLockedPermissions;

  return (
    <div className="min-h-screen space-y-5 bg-black text-white fade-in">
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.16),_transparent_34%),linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(7,7,7,0.98)_100%)] p-5 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Permission Control
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-[#F5E7B2]">Manage Users</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              MAIN_ADMIN and MANAGER can create users, assign roles, activate accounts, and fine-tune what L1/L2 users are allowed to see and do.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gold-btn h-11 px-5 text-sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">Total Users</div>
          <div className="mt-3 text-2xl font-semibold text-white">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">Main Admin</div>
          <div className="mt-3 text-2xl font-semibold text-[#D4AF37]">{stats.admins}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">Managers</div>
          <div className="mt-3 text-2xl font-semibold text-emerald-300">{stats.managers}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">L1 Users</div>
          <div className="mt-3 text-2xl font-semibold text-sky-300">{stats.l1}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">L2 Users</div>
          <div className="mt-3 text-2xl font-semibold text-white">{stats.l2}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, username, or email"
          className="max-w-xl border-white/15 bg-black/50 text-white"
        />
        <DarkSelect value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="min-w-[170px]">
          <option value="all">All Roles</option>
          <option value={ROLES.MAIN_ADMIN}>Main Admin</option>
          <option value={ROLES.MANAGER}>Manager</option>
          <option value={ROLES.L1}>L1</option>
          <option value={ROLES.L2}>L2</option>
        </DarkSelect>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/60 text-left text-white/55">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-white/55">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-white/55">
                    No matching users were found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userRecord) => (
                  <tr key={userRecord.id} className="border-t border-white/8 bg-black/20">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{userRecord.name || userRecord.username}</div>
                      <div className="mt-1 text-xs text-white/50">{userRecord.email}</div>
                      <div className="mt-1 text-xs text-white/35">@{userRecord.username}</div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={userRecord.role} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${userRecord.is_active ? "bg-emerald-500/12 text-emerald-300" : "bg-red-500/12 text-red-300"}`}>
                        {userRecord.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white">{permissionSummary(userRecord)} enabled</div>
                      <div className="mt-1 text-xs text-white/45">
                        {userRecord.role === ROLES.MAIN_ADMIN || userRecord.role === ROLES.MANAGER
                          ? "Full operational access"
                          : userRecord.effectivePermissions?.canViewLeadPhone
                            ? "Phone access enabled"
                            : "Phone access restricted"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-white/55">
                      {userRecord.updated_at ? new Date(userRecord.updated_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-flex justify-end">
                        <button
                          type="button"
                          onClick={() => setContextMenuId((current) => (current === userRecord.id ? "" : userRecord.id))}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#D4AF37]/30 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {contextMenuId === userRecord.id ? (
                          <div className="absolute right-0 top-11 z-20 min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl">
                            <button type="button" onClick={() => { setContextMenuId(""); openViewDialog(userRecord); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.05]">
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button type="button" onClick={() => { setContextMenuId(""); openEditDialog(userRecord); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.05]">
                              <PencilLine className="h-4 w-4" />
                              Edit User
                            </button>
                            <button type="button" onClick={() => { setContextMenuId(""); openEditDialog(userRecord); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.05]">
                              <UserRoundCog className="h-4 w-4" />
                              Manage Permissions
                            </button>
                            <button type="button" onClick={() => { setContextMenuId(""); handleStatusToggle(userRecord); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.05]">
                              <ShieldCheck className="h-4 w-4" />
                              {userRecord.is_active ? "Deactivate User" : "Activate User"}
                            </button>
                            {String(userRecord.id) !== String(user?.id) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setContextMenuId("");
                                  setSelectedUser(userRecord);
                                  setDeleteDialogOpen(true);
                                }}
                                className="flex w-full items-center gap-2 border-t border-white/8 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[min(1120px,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,13,13,0.98)_0%,rgba(7,7,7,0.98)_100%)] p-0 text-white">
          <div className="border-b border-white/8 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-[#F5E7B2]">
              {dialogMode === CREATE_FORM ? "Create User" : dialogMode === VIEW_FORM ? "User Details" : "Edit User"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-white/55">
              {dialogMode === CREATE_FORM
                ? "Create a new admin-panel account and define exactly what this user can access."
                : dialogMode === VIEW_FORM
                  ? "Review role, status, and the resolved permission set for this account."
                  : "Update role, activation state, and the stored permission map for this account."}
            </DialogDescription>
          </div>

          <div className="space-y-6 px-6 py-5">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Basic Details</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">First Name</label>
                  <Input value={form.firstName} disabled={isViewMode} onChange={(event) => updateForm("firstName", event.target.value)} className="border-white/15 bg-black/50 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">Last Name</label>
                  <Input value={form.lastName} disabled={isViewMode} onChange={(event) => updateForm("lastName", event.target.value)} className="border-white/15 bg-black/50 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">Username</label>
                  <Input value={form.username} disabled={isViewMode} onChange={(event) => updateForm("username", event.target.value)} className="border-white/15 bg-black/50 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">Email</label>
                  <Input value={form.email} disabled={isViewMode} type="email" onChange={(event) => updateForm("email", event.target.value)} className="border-white/15 bg-black/50 text-white" />
                </div>
                {dialogMode === CREATE_FORM ? (
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">Password</label>
                    <Input value={form.password} type="password" disabled={isViewMode} onChange={(event) => updateForm("password", event.target.value)} className="border-white/15 bg-black/50 text-white" />
                  </div>
                ) : null}
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-white/45">Role</label>
                  <DarkSelect value={form.role} disabled={isViewMode} onChange={(event) => updateRole(event.target.value)} className="w-full">
                    {allowedRoleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption === ROLES.MAIN_ADMIN ? "Main Admin" : roleOption === ROLES.MANAGER ? "Manager" : roleOption}
                      </option>
                    ))}
                  </DarkSelect>
                </div>
              </div>

              <label className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
                <input type="checkbox" checked={form.isActive} disabled={isViewMode} onChange={(event) => updateForm("isActive", event.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
                Active User
              </label>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Permission Section</h3>
                  <p className="mt-2 text-sm text-white/55">
                    Role changes auto-fill the default permission set. MAIN_ADMIN and MANAGER always keep full operational access.
                  </p>
                </div>
                {roleHasLockedPermissions ? (
                  <div className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#F5E7B2]">
                    Full access is locked for {form.role === ROLES.MAIN_ADMIN ? "MAIN_ADMIN" : "MANAGER"}.
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.key} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="mb-3 text-sm font-semibold text-white">{group.label}</div>
                    <div className="space-y-3">
                      {group.permissions.map((permissionItem) => (
                        <ToggleCard
                          key={permissionItem.key}
                          checked={Boolean(form.permissions?.[permissionItem.key])}
                          disabled={permissionCardsDisabled}
                          label={permissionItem.label}
                          description={`Controls ${permissionItem.label.toLowerCase()} access.`}
                          onChange={(checked) => setPermissionValue(permissionItem.key, checked)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/8 px-6 py-5 md:flex-row md:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/15 bg-transparent text-white hover:bg-white/[0.05]">
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode ? (
              <Button onClick={submitForm} disabled={submitting} className="gold-btn">
                {submitting ? "Saving..." : dialogMode === CREATE_FORM ? "Create User" : "Save Changes"}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (deleteLoading) return;
          setDeleteDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
          }
        }}
        title="Delete user?"
        description="This permanently removes the selected account from the admin panel."
        details={selectedUser ? <div className="text-sm text-white/70">{selectedUser.username} • {selectedUser.email}</div> : null}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
        destructive
      />
    </div>
  );
}
