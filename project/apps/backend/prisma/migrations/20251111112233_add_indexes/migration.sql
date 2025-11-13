-- Indexes for tickets
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "tickets_assigned_to_idx" ON "tickets"("assignedToId");
CREATE INDEX IF NOT EXISTS "tickets_requester_idx" ON "tickets"("requesterId");
CREATE INDEX IF NOT EXISTS "tickets_category_subcategory_idx" ON "tickets"("categoryId", "subcategoryId");
CREATE INDEX IF NOT EXISTS "tickets_created_at_idx" ON "tickets"("createdAt");

-- Indexes for comments
CREATE INDEX IF NOT EXISTS "comments_ticket_idx" ON "comments"("ticketId");
CREATE INDEX IF NOT EXISTS "comments_user_idx" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments"("createdAt");

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS "attachments_ticket_idx" ON "attachments"("ticketId");
CREATE INDEX IF NOT EXISTS "attachments_uploader_idx" ON "attachments"("uploadedBy");
CREATE INDEX IF NOT EXISTS "attachments_created_at_idx" ON "attachments"("createdAt");

-- Indexes for ticket history
CREATE INDEX IF NOT EXISTS "ticket_history_ticket_idx" ON "ticket_history"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_history_user_idx" ON "ticket_history"("userId");
CREATE INDEX IF NOT EXISTS "ticket_history_created_at_idx" ON "ticket_history"("createdAt");

-- Indexes for ticket relations
CREATE INDEX IF NOT EXISTS "ticket_relations_ticket_idx" ON "ticket_relations"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_relations_related_ticket_idx" ON "ticket_relations"("relatedTicketId");

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS "notifications_user_is_read_idx" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("createdAt");

-- Indexes for ticket custom fields
CREATE INDEX IF NOT EXISTS "ticket_custom_fields_ticket_idx" ON "ticket_custom_fields"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_custom_fields_field_idx" ON "ticket_custom_fields"("customFieldId");

-- Indexes for saved searches
CREATE INDEX IF NOT EXISTS "saved_searches_user_idx" ON "saved_searches"("userId");
CREATE INDEX IF NOT EXISTS "saved_searches_created_at_idx" ON "saved_searches"("createdAt");

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("createdAt");

-- Indexes for workflows
CREATE INDEX IF NOT EXISTS "workflows_status_active_idx" ON "workflows"("status", "isActive");
CREATE INDEX IF NOT EXISTS "workflows_created_by_idx" ON "workflows"("createdBy");
CREATE INDEX IF NOT EXISTS "workflows_created_at_idx" ON "workflows"("createdAt");

-- Indexes for workflow transitions
CREATE INDEX IF NOT EXISTS "workflow_transitions_workflow_active_idx" ON "workflow_transitions"("workflowId", "isActive");
CREATE INDEX IF NOT EXISTS "workflow_transitions_states_idx" ON "workflow_transitions"("fromState", "toState");

-- Indexes for workflow executions
CREATE INDEX IF NOT EXISTS "workflow_executions_ticket_idx" ON "workflow_executions"("ticketId");
CREATE INDEX IF NOT EXISTS "workflow_executions_workflow_idx" ON "workflow_executions"("workflowId");
CREATE INDEX IF NOT EXISTS "workflow_executions_user_idx" ON "workflow_executions"("executedBy");
CREATE INDEX IF NOT EXISTS "workflow_executions_executed_at_idx" ON "workflow_executions"("executedAt");


