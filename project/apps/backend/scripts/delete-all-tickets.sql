-- Script to delete all tickets and related data
-- WARNING: This will permanently delete all tickets!

-- First, delete all related data (due to foreign key constraints)
DELETE FROM "ticket_custom_fields";
DELETE FROM "workflow_executions" WHERE "ticketId" IS NOT NULL;
DELETE FROM "ticket_relations";
DELETE FROM "notifications" WHERE "ticketId" IS NOT NULL;
DELETE FROM "ticket_history";
DELETE FROM "attachments";
DELETE FROM "comments";

-- Finally, delete all tickets
DELETE FROM "tickets";

-- Show confirmation message
SELECT 'All tickets and related data have been deleted!' as status;

