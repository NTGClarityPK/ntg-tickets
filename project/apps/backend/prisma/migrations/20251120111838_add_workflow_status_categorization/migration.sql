/*
  Warnings:

  - The values [SLA_WARNING,SLA_BREACH] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ASSIGN_TO_USER,CALCULATE_RESOLUTION_TIME,UPDATE_PRIORITY,CREATE_SUBTASK,LOG_ACTIVITY] on the enum `WorkflowActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REQUIRES_ASSIGNMENT,REQUIRES_APPROVAL,PRIORITY_HIGH] on the enum `WorkflowConditionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `slaLevel` on the `tickets` table. All the data in the column will be lost.
  - The `status` column on the `tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `order` on the `workflow_actions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `workflow_actions` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `workflow_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `operator` on the `workflow_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `workflow_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `workflow_permissions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_STATUS_CHANGED', 'COMMENT_ADDED', 'TICKET_DUE', 'TICKET_ESCALATED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WorkflowActionType_new" AS ENUM ('SEND_NOTIFICATION', 'ASSIGN_USER', 'UPDATE_FIELD', 'SEND_EMAIL', 'CREATE_TASK');
ALTER TABLE "workflow_actions" ALTER COLUMN "type" TYPE "WorkflowActionType_new" USING ("type"::text::"WorkflowActionType_new");
ALTER TYPE "WorkflowActionType" RENAME TO "WorkflowActionType_old";
ALTER TYPE "WorkflowActionType_new" RENAME TO "WorkflowActionType";
DROP TYPE "WorkflowActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WorkflowConditionType_new" AS ENUM ('REQUIRES_COMMENT', 'REQUIRES_RESOLUTION', 'REQUIRES_ASSIGNEE', 'CUSTOM_FIELD_VALUE');
ALTER TABLE "workflow_conditions" ALTER COLUMN "type" TYPE "WorkflowConditionType_new" USING ("type"::text::"WorkflowConditionType_new");
ALTER TYPE "WorkflowConditionType" RENAME TO "WorkflowConditionType_old";
ALTER TYPE "WorkflowConditionType_new" RENAME TO "WorkflowConditionType";
DROP TYPE "WorkflowConditionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "workflow_executions" DROP CONSTRAINT "workflow_executions_workflowId_fkey";

-- DropIndex
DROP INDEX "workflow_permissions_transitionId_role_key";

-- DropIndex
DROP INDEX "workflow_transitions_workflowId_fromState_toState_key";

-- DropIndex
DROP INDEX "workflows_status_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "slaLevel",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "workflow_actions" DROP COLUMN "order",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "workflow_conditions" DROP COLUMN "isRequired",
DROP COLUMN "operator",
DROP COLUMN "updatedAt",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "workflow_executions" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "result" TEXT,
ALTER COLUMN "fromState" DROP NOT NULL,
ALTER COLUMN "toState" DROP NOT NULL,
ALTER COLUMN "transitionId" DROP NOT NULL,
ALTER COLUMN "metadata" DROP NOT NULL,
ALTER COLUMN "metadata" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_permissions" DROP COLUMN "updatedAt",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "doneStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workingStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "definition" DROP NOT NULL;

-- DropEnum
DROP TYPE "SLALevel";

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "workflows_status_isActive_idx" ON "workflows"("status", "isActive");

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "attachments_created_at_idx" RENAME TO "attachments_createdAt_idx";

-- RenameIndex
ALTER INDEX "attachments_ticket_idx" RENAME TO "attachments_ticketId_idx";

-- RenameIndex
ALTER INDEX "attachments_uploader_idx" RENAME TO "attachments_uploadedBy_idx";

-- RenameIndex
ALTER INDEX "audit_logs_created_at_idx" RENAME TO "audit_logs_createdAt_idx";

-- RenameIndex
ALTER INDEX "audit_logs_user_idx" RENAME TO "audit_logs_userId_idx";

-- RenameIndex
ALTER INDEX "comments_created_at_idx" RENAME TO "comments_createdAt_idx";

-- RenameIndex
ALTER INDEX "comments_ticket_idx" RENAME TO "comments_ticketId_idx";

-- RenameIndex
ALTER INDEX "comments_user_idx" RENAME TO "comments_userId_idx";

-- RenameIndex
ALTER INDEX "notifications_created_at_idx" RENAME TO "notifications_createdAt_idx";

-- RenameIndex
ALTER INDEX "notifications_user_is_read_idx" RENAME TO "notifications_userId_isRead_idx";

-- RenameIndex
ALTER INDEX "saved_searches_created_at_idx" RENAME TO "saved_searches_createdAt_idx";

-- RenameIndex
ALTER INDEX "saved_searches_user_idx" RENAME TO "saved_searches_userId_idx";

-- RenameIndex
ALTER INDEX "ticket_custom_fields_field_idx" RENAME TO "ticket_custom_fields_customFieldId_idx";

-- RenameIndex
ALTER INDEX "ticket_custom_fields_ticket_idx" RENAME TO "ticket_custom_fields_ticketId_idx";

-- RenameIndex
ALTER INDEX "ticket_history_created_at_idx" RENAME TO "ticket_history_createdAt_idx";

-- RenameIndex
ALTER INDEX "ticket_history_ticket_idx" RENAME TO "ticket_history_ticketId_idx";

-- RenameIndex
ALTER INDEX "ticket_history_user_idx" RENAME TO "ticket_history_userId_idx";

-- RenameIndex
ALTER INDEX "ticket_relations_related_ticket_idx" RENAME TO "ticket_relations_relatedTicketId_idx";

-- RenameIndex
ALTER INDEX "ticket_relations_ticket_idx" RENAME TO "ticket_relations_ticketId_idx";

-- RenameIndex
ALTER INDEX "tickets_assigned_to_idx" RENAME TO "tickets_assignedToId_idx";

-- RenameIndex
ALTER INDEX "tickets_category_subcategory_idx" RENAME TO "tickets_categoryId_subcategoryId_idx";

-- RenameIndex
ALTER INDEX "tickets_created_at_idx" RENAME TO "tickets_createdAt_idx";

-- RenameIndex
ALTER INDEX "tickets_requester_idx" RENAME TO "tickets_requesterId_idx";

-- RenameIndex
ALTER INDEX "workflow_executions_executed_at_idx" RENAME TO "workflow_executions_executedAt_idx";

-- RenameIndex
ALTER INDEX "workflow_executions_ticket_idx" RENAME TO "workflow_executions_ticketId_idx";

-- RenameIndex
ALTER INDEX "workflow_executions_user_idx" RENAME TO "workflow_executions_executedBy_idx";

-- RenameIndex
ALTER INDEX "workflow_executions_workflow_idx" RENAME TO "workflow_executions_workflowId_idx";

-- RenameIndex
ALTER INDEX "workflow_transitions_states_idx" RENAME TO "workflow_transitions_fromState_toState_idx";

-- RenameIndex
ALTER INDEX "workflow_transitions_workflow_active_idx" RENAME TO "workflow_transitions_workflowId_isActive_idx";

-- RenameIndex
ALTER INDEX "workflows_created_at_idx" RENAME TO "workflows_createdAt_idx";

-- RenameIndex
ALTER INDEX "workflows_created_by_idx" RENAME TO "workflows_createdBy_idx";
