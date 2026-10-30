import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
});

export const createOutletSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
});

export const membershipRoleSchema = z.enum(["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"]);

export const createOrgMembershipSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: membershipRoleSchema,
});

export const createOutletMembershipSchema = z.object({
  userId: z.string().uuid(),
  outletId: z.string().uuid(),
  role: membershipRoleSchema,
});
