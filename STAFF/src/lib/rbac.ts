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
