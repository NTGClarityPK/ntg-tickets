-- AlterTable: Add isSystemDefault field to workflows table
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "isSystemDefault" BOOLEAN NOT NULL DEFAULT false;

-- Mark the first/oldest workflow as system default if one exists
UPDATE "workflows"
SET "isSystemDefault" = true
WHERE "id" = (
  SELECT "id" 
  FROM "workflows" 
  ORDER BY "createdAt" ASC 
  LIMIT 1
);


