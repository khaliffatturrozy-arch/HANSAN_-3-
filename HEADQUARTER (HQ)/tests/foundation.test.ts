import { describe, it, expect } from "vitest";
import { hasRole, isOrgMember, isOutletMember, assertTenantAccess } from "@/lib/rbac";
import { redactSensitive } from "@/lib/audit";
import { createOrganizationSchema, membershipRoleSchema } from "@/lib/validation";

describe("RBAC", () => {
  it("hasRole returns true when any required role matches", () => {
    expect(hasRole(["staff"], ["owner", "staff"])).toBe(true);
    expect(hasRole(["pos"], ["owner", "staff"])).toBe(false);
    expect(hasRole([], [])).toBe(true);
  });
  it("isOrgMember / isOutletMember check membership", () => {
    expect(isOrgMember(["o1", "o2"], "o2")).toBe(true);
    expect(isOrgMember(["o1"], "o2")).toBe(false);
    expect(isOutletMember(["u1"], "u1")).toBe(true);
  });
  it("assertTenantAccess throws on org mismatch", () => {
    expect(() => assertTenantAccess({ userOrgIds: ["o1"], userOutletIds: [], orgId: "o2" })).toThrow("ORG_ACCESS_DENIED");
  });
  it("assertTenantAccess throws on outlet mismatch", () => {
    expect(() => assertTenantAccess({ userOrgIds: ["o1"], userOutletIds: ["u1"], outletId: "u2" })).toThrow("OUTLET_ACCESS_DENIED");
  });
  it("assertTenantAccess throws on role mismatch", () => {
    expect(() => assertTenantAccess({ userOrgIds: ["o1"], userOutletIds: [], requiredRoles: ["owner"], userRoles: ["staff"] })).toThrow("ROLE_ACCESS_DENIED");
  });
  it("assertTenantAccess passes when all match", () => {
    expect(() => assertTenantAccess({ userOrgIds: ["o1"], userOutletIds: ["u1"], orgId: "o1", outletId: "u1", requiredRoles: ["staff"], userRoles: ["staff"] })).not.toThrow();
  });
});

describe("Validation (Zod)", () => {
  it("accepts valid organization", () => {
    expect(createOrganizationSchema.parse({ name: "Acme", slug: "acme" })).toBeTruthy();
  });
  it("rejects invalid slug", () => {
    expect(() => createOrganizationSchema.parse({ name: "Acme", slug: "ACME!" })).toThrow();
  });
  it("membershipRoleSchema accepts known roles", () => {
    expect(membershipRoleSchema.parse("owner")).toBe("owner");
    expect(() => membershipRoleSchema.parse("superadmin")).toThrow();
  });
});

describe("Audit redaction", () => {
  it("redacts sensitive keys", () => {
    const out = redactSensitive({ user: "a", password: "secret123", nested: { token: "t", ok: 1 } }) as any;
    expect(out.password).toBe("[REDACTED]");
    expect(out.nested.token).toBe("[REDACTED]");
    expect(out.nested.ok).toBe(1);
    expect(out.user).toBe("a");
  });
});

import { canGrantRole } from "@/lib/rbac";

describe("Role grant matrix", () => {
  it("owner can grant all roles", () => {
    expect(canGrantRole(["owner"], "owner")).toBe(true);
    expect(canGrantRole(["owner"], "admin")).toBe(true);
    expect(canGrantRole(["owner"], "developer")).toBe(true);
  });
  it("admin cannot grant owner or admin", () => {
    expect(canGrantRole(["admin"], "owner")).toBe(false);
    expect(canGrantRole(["admin"], "admin")).toBe(false);
    expect(canGrantRole(["admin"], "manager")).toBe(true);
  });
  it("manager cannot grant admin or manager", () => {
    expect(canGrantRole(["manager"], "admin")).toBe(false);
    expect(canGrantRole(["manager"], "manager")).toBe(false);
    expect(canGrantRole(["manager"], "staff")).toBe(true);
  });
  it("staff/pos/kds/finance/developer cannot grant any role", () => {
    for (const r of ["staff", "pos", "kds", "finance", "developer"]) {
      expect(canGrantRole([r], "staff")).toBe(false);
    }
  });
  it("deny by default for unknown granter", () => {
    expect(canGrantRole(["unknown"], "staff")).toBe(false);
  });
});
