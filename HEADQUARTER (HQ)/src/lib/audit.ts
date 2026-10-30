const SENSITIVE_KEYS = new Set(["password", "token", "secret", "authorization", "cookie", "apiKey", "serviceRoleKey"]);

export function redactSensitive(input: unknown): unknown {
  if (input === null || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(redactSensitive);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) out[k] = "[REDACTED]";
    else out[k] = redactSensitive(v);
  }
  return out;
}

export interface AuditEvent {
  actorUserId?: string | null;
  organizationId?: string | null;
  outletId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(db: any, event: AuditEvent): Promise<void> {
  const { auditLogs } = await import("../db/schema");
  await db.insert(auditLogs).values({
    actorUserId: event.actorUserId ?? null,
    organizationId: event.organizationId ?? null,
    outletId: event.outletId ?? null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    metadata: event.metadata ? (redactSensitive(event.metadata) as any) : null,
  });
}
