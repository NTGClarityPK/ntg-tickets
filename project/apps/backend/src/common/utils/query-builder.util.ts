import { TicketFiltersDto } from '../../modules/tickets/dto/ticket-filters.dto';

/**
 * Utility class for building Prisma query where clauses from filter DTOs.
 * This reduces code duplication across ticket service methods.
 */
export class TicketQueryBuilder {
  private where: any = {};

  /**
   * Adds status filter to the query
   */
  addStatusFilter(status?: any[]): this {
    if (status && status.length > 0) {
      this.where.status = {
        in: status,
      };
    }
    return this;
  }

  /**
   * Adds priority filter to the query
   */
  addPriorityFilter(priority?: any[]): this {
    if (priority && priority.length > 0) {
      this.where.priority = {
        in: priority,
      };
    }
    return this;
  }

  /**
   * Adds category filter to the query
   */
  addCategoryFilter(category?: string[]): this {
    if (category && category.length > 0) {
      this.where.categoryId = { in: category };
    }
    return this;
  }

  /**
   * Adds assignedToId filter to the query
   */
  addAssignedToFilter(assignedToId?: string[]): this {
    if (assignedToId && assignedToId.length > 0) {
      this.where.assignedToId = { in: assignedToId };
    }
    return this;
  }

  /**
   * Adds requesterId filter to the query
   */
  addRequesterFilter(requesterId?: string[]): this {
    if (requesterId && requesterId.length > 0) {
      this.where.requesterId = { in: requesterId };
    }
    return this;
  }

  /**
   * Adds search filter to the query (searches title, description, ticketNumber)
   */
  addSearchFilter(search?: string): this {
    if (search && search.trim().length > 0) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' as any } },
        { description: { contains: search, mode: 'insensitive' as any } },
        { ticketNumber: { contains: search, mode: 'insensitive' as any } },
      ];

      // If there's already an OR clause (e.g., from role filtering), 
      // we need to combine them with AND
      if (Array.isArray(this.where.OR) && this.where.OR.length > 0) {
        const existingOR = this.where.OR;
        // Extract other conditions
        const { OR: _, ...otherConditions } = this.where;
        // Combine role OR with search OR using AND
        this.where = {
          AND: [
            { OR: existingOR as any[] },
            { OR: searchConditions },
          ],
          ...(Object.keys(otherConditions).length > 0 ? otherConditions : {}),
        } as any;
      } else {
        // No existing OR clause, just add search OR
        this.where.OR = searchConditions;
      }
    }
    return this;
  }

  /**
   * Adds date range filter to the query
   */
  addDateRangeFilter(dateFrom?: string, dateTo?: string): this {
    if (dateFrom || dateTo) {
      this.where.createdAt = {};
      if (dateFrom) {
        this.where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        this.where.createdAt.lte = new Date(dateTo);
      }
    }
    return this;
  }

  /**
   * Adds role-based filtering based on user role
   */
  addRoleFilter(userId: string, userRole: string): this {
    if (userRole === 'END_USER') {
      this.where.requesterId = userId;
    } else if (userRole === 'SUPPORT_STAFF') {
      this.where.OR = [{ assignedToId: userId }, { assignedToId: null }];
    }
    // SUPPORT_MANAGER and ADMIN can see all tickets, so no filter needed
    return this;
  }

  /**
   * Builds a where clause from TicketFiltersDto
   */
  static fromFilters(
    filters: TicketFiltersDto,
    userId?: string,
    userRole?: string
  ): any {
    const builder = new TicketQueryBuilder();

    if (userId && userRole) {
      builder.addRoleFilter(userId, userRole);
    }

    return builder
      .addStatusFilter(filters.status)
      .addPriorityFilter(filters.priority)
      .addCategoryFilter(filters.category)
      .addAssignedToFilter(filters.assignedToId)
      .addRequesterFilter(filters.requesterId)
      .addSearchFilter(filters.search)
      .addDateRangeFilter(filters.dateFrom, filters.dateTo)
      .build();
  }

  /**
   * Builds the where clause and returns it
   */
  build(): any {
    return this.where;
  }
}

/**
 * Utility function to get pagination parameters from filters
 */
export function getPaginationParams(filters: { page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

