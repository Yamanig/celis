import { db } from "~/db";
import { auditLogs } from "~/db/schema";
import { getCurrentUser } from "./auth.server";
import { eq, desc, count, sql } from "drizzle-orm";

export type AuditMetadata = Record<string, string | number | boolean | null> | null;

export interface AuditEvent {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

function serializeMetadata(
  metadata?: Record<string, unknown>
): AuditMetadata {
  if (!metadata) return null;
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    } else {
      result[key] = JSON.stringify(value);
    }
  }
  return result;
}

export async function insertAuditLog(event: AuditEvent) {
  const user = await getCurrentUser().catch(() => null);
  await db.insert(auditLogs).values({
    actorId: user?.id ?? null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    metadata: serializeMetadata(event.metadata),
  });
}

export async function getAdminAuditLogs(options?: {
  page?: number;
  limit?: number;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 25;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      log: auditLogs,
      actorEmail: sql<string>`users.email`,
    })
    .from(auditLogs)
    .leftJoin(sql`users`, eq(sql`users.id`, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(auditLogs);

  return {
    items: rows.map((r) => ({
      id: r.log.id,
      action: r.log.action,
      resourceType: r.log.resourceType,
      resourceId: r.log.resourceId,
      metadata: (r.log.metadata as AuditMetadata | null) ?? null,
      actorEmail: r.actorEmail,
      createdAt: r.log.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
