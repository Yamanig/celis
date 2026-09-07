import { db } from "~/db";
import { auditLogs } from "~/db/schema";
import { getCurrentUser } from "./auth.server";
import { eq, desc, count, sql } from "drizzle-orm";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Best-effort request context for an audit entry. Returns nulls when called
 * outside a request (scripts, cron) instead of throwing.
 */
function getRequestContext(): {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
} {
  try {
    const forwardedFor = getRequestHeader("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;
    const requestId =
      getRequestHeader("x-request-id") ??
      getRequestHeader("cf-ray") ??
      null;
    return { ipAddress, userAgent, requestId };
  } catch {
    return { ipAddress: null, userAgent: null, requestId: null };
  }
}

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
  const { ipAddress, userAgent, requestId } = getRequestContext();
  const base = {
    actorId: user?.id ?? null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    metadata: serializeMetadata(event.metadata),
    ipAddress,
  };
  try {
    await db.insert(auditLogs).values({ ...base, userAgent, requestId });
  } catch (err) {
    // Fall back if migration 0036 (user_agent / request_id columns) is not
    // applied yet — never let an audit write break the audited action.
    const message = err instanceof Error ? err.message : String(err);
    if (/column .*(user_agent|request_id).* does not exist/i.test(message)) {
      await db.insert(auditLogs).values(base);
      return;
    }
    throw err;
  }
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
