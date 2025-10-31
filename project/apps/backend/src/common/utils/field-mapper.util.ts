/**
 * Utility to map between camelCase (API) and snake_case (Database) field names
 */

export const FieldMapper = {
  /**
   * Convert camelCase object to snake_case for database
   */
  toSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.camelToSnake(key);
      result[snakeKey] = value;
    }
    return result;
  },

  /**
   * Convert snake_case object to camelCase for API
   */
  toCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.snakeToCamel(key);
      result[camelKey] = value;
    }
    return result;
  },

  /**
   * Convert camelCase string to snake_case
   */
  camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  },

  /**
   * Convert snake_case string to camelCase
   */
  snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  /**
   * Map common field names
   */
  mapCommonFields<T extends Record<string, any>>(obj: T, direction: 'toSnake' | 'toCamel' = 'toCamel'): Record<string, any> {
    const fieldMap: Record<string, string> = {
      // User fields
      userId: 'user_id',
      createdBy: 'created_by',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      isActive: 'is_active',
      
      // Ticket fields
      ticketId: 'ticket_id',
      ticketNumber: 'ticket_number',
      categoryId: 'category_id',
      subcategoryId: 'subcategory_id',
      requesterId: 'requester_id',
      assignedToId: 'assigned_to_id',
      dueDate: 'due_date',
      closedAt: 'closed_at',
      
      // File fields
      fileUrl: 'file_url',
      fileSize: 'file_size',
      fileType: 'file_type',
      uploadedBy: 'uploaded_by',
      
      // Workflow fields
      workflowId: 'workflow_id',
      workflowVersion: 'workflow_version',
      workflowSnapshot: 'workflow_snapshot',
      fromState: 'from_state',
      toState: 'to_state',
      
      // General
      customName: 'custom_name',
      fieldName: 'field_name',
      oldValue: 'old_value',
      newValue: 'new_value',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      resourceId: 'resource_id',
      searchCriteria: 'search_criteria',
      isPublic: 'is_public',
      isRequired: 'is_required',
      fieldType: 'field_type',
      customFieldId: 'custom_field_id',
      isInternal: 'is_internal',
      relationType: 'relation_type',
      relatedTicketId: 'related_ticket_id',
      transitionId: 'transition_id',
      executedBy: 'executed_by',
      executedAt: 'executed_at',
      errorMessage: 'error_message',
      relatedToTickets: 'related_to_tickets',
    };

    const result: Record<string, any> = {};
    const reverseMap: Record<string, string> = {};
    for (const [camel, snake] of Object.entries(fieldMap)) {
      reverseMap[snake] = camel;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (direction === 'toSnake') {
        result[fieldMap[key] || this.camelToSnake(key)] = value;
      } else {
        result[reverseMap[key] || this.snakeToCamel(key)] = value;
      }
    }
    return result;
  },
};

