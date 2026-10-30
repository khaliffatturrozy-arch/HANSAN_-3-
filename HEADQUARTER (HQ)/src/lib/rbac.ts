export function hasRole(userRoles: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((r) => userRoles.includes(r));
}

export function isOrgMember(orgIds: string[], orgId: string): boolean {
  return orgIds.includes(orgId);
}

export function isOutletMember(outletIds: string[], outletId: string): boolean {
  return outletIds.includes(outletId);
}

export function assertTenantAccess(params: { userOrgIds: string[]; userOutletIds: string[]; orgId?: string; outletId?: string; requiredRoles?: string[]; userRoles?: string[] }): void {
  if (params.orgId && !isOrgMember(params.userOrgIds, params.orgId)) {
    throw new Error("ORG_ACCESS_DENIED");
  }
  if (params.outletId && !isOutletMember(params.userOutletIds, params.outletId)) {
    throw new Error("OUTLET_ACCESS_DENIED");
  }
  if (params.requiredRoles && params.userRoles && !hasRole(params.userRoles, params.requiredRoles)) {
    throw new Error("ROLE_ACCESS_DENIED");
  }
}

// Explicit role grant matrix. A granter may grant only roles within their authority.
// Deny by default.
const GRANT_MATRIX: Record<string, string[]> = {
  owner: ["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"],
  admin: ["manager", "staff", "pos", "kds", "finance"],
  manager: ["staff", "pos", "kds", "finance"],
  staff: [],
  pos: [],
  kds: [],
  finance: [],
  developer: [],
};

export function canGrantRole(granterRoles: string[], targetRole: string): boolean {
  for (const r of granterRoles) {
    const allowed = GRANT_MATRIX[r];
    if (allowed && allowed.includes(targetRole)) return true;
  }
  return false;
}

export function isOwnerProtected(granterRoles: string[]): boolean {
  // Only an owner can grant the owner role.
  return granterRoles.includes("owner");
}
