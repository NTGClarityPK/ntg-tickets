-- AlterTable: Add deletedAt and version fields to workflows table for soft delete and versioning
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable: Add workflowSnapshot and workflowVersion to tickets table to preserve workflow at creation time
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "workflowSnapshot" JSONB;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "workflowVersion" INTEGER;

-- Update existing tickets to capture their current workflow snapshot
UPDATE "tickets" t
SET "workflowSnapshot" = w."definition",
    "workflowVersion" = COALESCE(w."version", 1)
FROM "workflows" w
WHERE t."workflowId" = w."id"
  AND t."workflowSnapshot" IS NULL;


