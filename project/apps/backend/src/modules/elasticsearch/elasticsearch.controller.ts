import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ElasticsearchService } from './elasticsearch.service';

@Controller('elasticsearch')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Get('search')
  @Roles('END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN')
  async search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('category') category: string,
    @Query('assignedTo') assignedTo: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string
  ) {
    const filters: {
      status?: string[];
      priority?: string[];
      category?: string[];
      assignedTo?: string[];
      dateFrom?: string;
      dateTo?: string;
    } = {};

    if (status) filters.status = status.split(',');
    if (priority) filters.priority = priority.split(',');
    if (category) filters.category = category.split(',');
    if (assignedTo) filters.assignedTo = assignedTo.split(',');
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    return this.elasticsearchService.searchTickets(query, filters, page, limit);
  }

  @Get('suggestions')
  @Roles('END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN')
  async getSuggestions(
    @Query('q') query: string,
    @Query('field') field: string = 'title'
  ) {
    return this.elasticsearchService.getSuggestions(query, field);
  }

  @Get('aggregations')
  @Roles('SUPPORT_MANAGER', 'ADMIN')
  async getAggregations(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('category') category: string
  ) {
    const filters: {
      status?: string[];
      priority?: string[];
      category?: string[];
    } = {};

    if (status) filters.status = status.split(',');
    if (priority) filters.priority = priority.split(',');
    if (category) filters.category = category.split(',');

    return this.elasticsearchService.getAggregations(filters);
  }

  @Get('health')
  @Roles('ADMIN')
  async getHealth() {
    return this.elasticsearchService.getHealth();
  }

  @Post('reindex')
  @Roles('ADMIN')
  async reindex() {
    // This would typically be called with a list of tickets from the database
    // For now, we'll just return a success message
    return {
      message:
        'Reindex initiated. This is a placeholder for the actual reindex operation.',
    };
  }
}
