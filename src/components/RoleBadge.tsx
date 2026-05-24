import React from "react";
import { getRoleLabel, normalizeRole, ROLES } from "../permissions";

const ROLE_STYLES = {
  [ROLES.MAIN_ADMIN]: "border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#D4AF37]",
  [ROLES.L1]: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  [ROLES.L2]: "border-white/15 bg-white/5 text-white/75",
};

export default function RoleBadge({ role }) {
  const normalizedRole = normalizeRole(role);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${ROLE_STYLES[normalizedRole]}`}>
      {getRoleLabel(normalizedRole)}
    </span>
  );
}
