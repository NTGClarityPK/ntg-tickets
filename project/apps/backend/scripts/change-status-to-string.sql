-- Migration to change ticket status from enum to string to support custom workflow statuses
-- This allows tickets to use any status defined in their workflow (like "QA", "Testing", etc.)

-- Step 1: Add a temporary column with string type
ALTER TABLE "tickets" ADD COLUMN "status_new" TEXT;

-- Step 2: Copy existing status values to the new column
UPDATE "tickets" SET "status_new" = "status"::text;

-- Step 3: Drop the old status column
ALTER TABLE "tickets" DROP COLUMN "status";

-- Step 4: Rename the new column to status
ALTER TABLE "tickets" RENAME COLUMN "status_new" TO "status";

-- Step 5: Set default value and NOT NULL constraint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'NEW';
ALTER TABLE "tickets" ALTER COLUMN "status" SET NOT NULL;

-- Note: We're keeping the TicketStatus enum in the schema for backward compatibility
-- but tickets table no longer uses it, allowing full flexibility for workflow statuses

