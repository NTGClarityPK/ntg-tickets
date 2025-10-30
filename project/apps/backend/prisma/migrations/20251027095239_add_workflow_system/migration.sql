-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkflowConditionType" AS ENUM ('REQUIRES_COMMENT', 'REQUIRES_RESOLUTION', 'REQUIRES_ASSIGNMENT', 'REQUIRES_APPROVAL', 'PRIORITY_HIGH', 'CUSTOM_FIELD_VALUE');

-- CreateEnum
CREATE TYPE "WorkflowActionType" AS ENUM ('SEND_NOTIFICATION', 'ASSIGN_TO_USER', 'CALCULATE_RESOLUTION_TIME', 'UPDATE_PRIORITY', 'CREATE_SUBTASK', 'SEND_EMAIL', 'LOG_ACTIVITY');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "workflowId" TEXT;

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_conditions" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "type" "WorkflowConditionType" NOT NULL,
    "value" TEXT,
    "operator" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_actions" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "type" "WorkflowActionType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_permissions" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "canExecute" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transitions_workflowId_fromState_toState_key" ON "workflow_transitions"("workflowId", "fromState", "toState");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_permissions_transitionId_role_key" ON "workflow_permissions"("transitionId", "role");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_conditions" ADD CONSTRAINT "workflow_conditions_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "workflow_transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "workflow_transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "workflow_transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
