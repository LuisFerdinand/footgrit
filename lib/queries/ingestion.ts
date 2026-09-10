import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { importBatches, importRows, users } from "@/lib/db/schema";

export async function listBatches() {
  return db
    .select({
      id: importBatches.id,
      entity: importBatches.entity,
      fileName: importBatches.fileName,
      status: importBatches.status,
      totalRows: importBatches.totalRows,
      validRows: importBatches.validRows,
      errorRows: importBatches.errorRows,
      duplicateRows: importBatches.duplicateRows,
      reviewRows: importBatches.reviewRows,
      importedRows: importBatches.importedRows,
      createdAt: importBatches.createdAt,
      completedAt: importBatches.completedAt,
      uploadedBy: users.name,
    })
    .from(importBatches)
    .leftJoin(users, eq(users.id, importBatches.uploadedBy))
    .orderBy(desc(importBatches.createdAt))
    .limit(30);
}

export async function getBatch(id: string) {
  const batch = await db.query.importBatches.findFirst({
    where: eq(importBatches.id, id),
  });
  if (!batch) return null;
  const rows = await db
    .select()
    .from(importRows)
    .where(eq(importRows.batchId, id))
    .orderBy(asc(importRows.rowNumber));
  return { batch, rows };
}

export async function getReviewRows(id: string) {
  return db
    .select()
    .from(importRows)
    .where(
      and(eq(importRows.batchId, id), eq(importRows.status, "needs_review")),
    )
    .orderBy(asc(importRows.rowNumber));
}
