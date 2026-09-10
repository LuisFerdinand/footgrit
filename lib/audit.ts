import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function recordAudit(input: {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      before: input.before,
      after: input.after,
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
