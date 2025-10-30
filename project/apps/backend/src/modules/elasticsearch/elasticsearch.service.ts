import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { Ticket } from '@prisma/client';

interface ElasticsearchSearchBody {
  query: {
    bool: {
      must: Array<Record<string, unknown>>;
      filter: Array<Record<string, unknown>>;
    };
  };
  from: number;
  size: number;
  sort: Array<{ [key: string]: { order: 'asc' | 'desc' } }>;
  highlight: {
    fields: Record<
      string,
      { fragment_size: number; number_of_fragments: number }
    >;
  };
}

interface ElasticsearchHit {
  _source: Ticket;
  _score: number;
  highlight?: Record<string, string[]>;
}

interface ElasticsearchResponse {
  hits: {
    hits: ElasticsearchHit[];
    total: number | { value: number };
  };
}

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly client: Client;
  private readonly indexName: string;

  constructor(private configService: ConfigService) {
    this.indexName = this.configService.get('ELASTICSEARCH_INDEX', 'tickets');

    this.client = new Client({
      node: this.configService.get(
        'ELASTICSEARCH_NODE',
        'http://localhost:9200'
      ),
      auth: {
        username: this.configService.get('ELASTICSEARCH_USERNAME', 'elastic'),
        password: this.configService.get('ELASTICSEARCH_PASSWORD', 'changeme'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.createIndex();
      this.logger.log('Elasticsearch service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch service', error);
    }
  }

  private async createIndex() {
    const indexExists = await this.client.indices.exists({
      index: this.indexName,
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              ticketNumber: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'standard',
              },
              category: { type: 'keyword' },
              subcategory: { type: 'keyword' },
              priority: { type: 'keyword' },
              status: { type: 'keyword' },
              impact: { type: 'keyword' },
              urgency: { type: 'keyword' },
              slaLevel: { type: 'keyword' },
              requesterId: { type: 'keyword' },
              assignedToId: { type: 'keyword' },
              requesterName: { type: 'text' },
              assignedToName: { type: 'text' },
              resolution: { type: 'text' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              dueDate: { type: 'date' },
              closedAt: { type: 'date' },
              tags: { type: 'keyword' },
              customFields: {
                type: 'object',
                dynamic: true,
              },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball'],
                },
              },
            },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
    }
  }

  async indexTicket(
    ticket: Ticket & {
      requester?: { id: string; name: string; email: string };
      assignedTo?: { id: string; name: string; email: string };
    }
  ) {
    try {
      const document = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        category: ticket.categoryId,
        subcategory: ticket.subcategoryId,
        priority: ticket.priority,
        status: ticket.status,
        impact: ticket.impact,
        urgency: ticket.urgency,
        slaLevel: ticket.slaLevel,
        requesterId: ticket.requesterId,
        assignedToId: ticket.assignedToId,
        requesterName: ticket.requester?.name || '',
        assignedToName: ticket.assignedTo?.name || '',
        resolution: ticket.resolution,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        dueDate: ticket.dueDate,
        closedAt: ticket.closedAt,
        tags: this.extractTags(ticket),
        customFields: {},
      };

      await this.client.index({
        index: this.indexName,
        id: ticket.id,
        body: document,
      });

      this.logger.log(`Indexed ticket: ${ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Failed to index ticket ${ticket.ticketNumber}`, error);
    }
  }

  async updateTicket(
    ticket: Ticket & {
      requester?: { id: string; name: string; email: string };
      assignedTo?: { id: string; name: string; email: string };
    }
  ) {
    try {
      await this.indexTicket(ticket);
      this.logger.log(`Updated ticket in index: ${ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to update ticket ${ticket.ticketNumber}`,
        error
      );
    }
  }

  async deleteTicket(ticketId: string) {
    try {
      await this.client.delete({
        index: this.indexName,
        id: ticketId,
      });
      this.logger.log(`Deleted ticket from index: ${ticketId}`);
    } catch (error) {
      this.logger.error(`Failed to delete ticket ${ticketId}`, error);
    }
  }

  async searchTickets(
    query: string,
    filters: {
      status?: string[];
      priority?: string[];
      category?: string[];
      assignedTo?: string[];
      dateFrom?: string;
      dateTo?: string;
    } = {},
    page = 1,
    limit = 20
  ) {
    try {
      const from = (page - 1) * limit;

      const searchBody: ElasticsearchSearchBody = {
        query: {
          bool: {
            must: [],
            filter: [],
          },
        },
        from,
        size: limit,
        sort: [{ updatedAt: { order: 'desc' } }, { _score: { order: 'desc' } }],
        highlight: {
          fields: {
            title: { fragment_size: 150, number_of_fragments: 3 },
            description: { fragment_size: 150, number_of_fragments: 3 },
          },
        },
      };

      // Add text search
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: [
              'title^3',
              'description^2',
              'requesterName',
              'assignedToName',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      } else {
        searchBody.query.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters.status && filters.status.length > 0) {
        searchBody.query.bool.filter.push({
          terms: { status: filters.status },
        });
      }

      if (filters.priority && filters.priority.length > 0) {
        searchBody.query.bool.filter.push({
          terms: { priority: filters.priority },
        });
      }

      if (filters.category && filters.category.length > 0) {
        searchBody.query.bool.filter.push({
          terms: { category: filters.category },
        });
      }

      if (filters.assignedTo && filters.assignedTo.length > 0) {
        searchBody.query.bool.filter.push({
          terms: { assignedToId: filters.assignedTo },
        });
      }

      if (filters.dateFrom || filters.dateTo) {
        const dateRange: { gte?: string; lte?: string } = {};
        if (filters.dateFrom) {
          dateRange.gte = new Date(filters.dateFrom).toISOString();
        }
        if (filters.dateTo) {
          dateRange.lte = new Date(filters.dateTo).toISOString();
        }
        searchBody.query.bool.filter.push({
          range: { createdAt: dateRange },
        });
      }

      const response = (await this.client.search({
        index: this.indexName,
        body: searchBody,
      })) as ElasticsearchResponse;

      return {
        hits: response.hits.hits.map((hit: ElasticsearchHit) => ({
          ...hit._source,
          _score: hit._score,
          _highlight: hit.highlight,
        })),
        total:
          typeof response.hits.total === 'number'
            ? response.hits.total
            : response.hits.total.value,
        page,
        limit,
        totalPages: Math.ceil(
          (typeof response.hits.total === 'number'
            ? response.hits.total
            : response.hits.total.value) / limit
        ),
      };
    } catch (error) {
      this.logger.error('Search failed', error);
      throw new Error('Search operation failed');
    }
  }

  async getSuggestions(query: string, field: string = 'title') {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            ticket_suggest: {
              prefix: query,
              completion: {
                field: `${field}.suggest`,
                size: 10,
              },
            },
          },
        },
      });

      const options = response.suggest.ticket_suggest[0].options;
      return Array.isArray(options)
        ? options.map((option: { text: string }) => option.text)
        : [options.text];
    } catch (error) {
      this.logger.error('Suggestion search failed', error);
      return [];
    }
  }

  async getAggregations(
    filters: {
      status?: string[];
      priority?: string[];
      category?: string[];
    } = {}
  ) {
    try {
      const searchBody: {
        size: number;
        aggs: Record<string, unknown>;
        query?: { bool: { filter: unknown[] } };
      } = {
        size: 0,
        aggs: {
          status: {
            terms: { field: 'status' },
          },
          priority: {
            terms: { field: 'priority' },
          },
          category: {
            terms: { field: 'category' },
          },
          assignedTo: {
            terms: { field: 'assignedToId' },
          },
          createdByMonth: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: 'month',
            },
          },
        },
      };

      // Add filters to aggregations
      if (Object.keys(filters).length > 0) {
        searchBody.query = {
          bool: {
            filter: [],
          },
        };

        if (filters.status && filters.status.length > 0) {
          searchBody.query.bool.filter.push({
            terms: { status: filters.status },
          });
        }

        if (filters.priority && filters.priority.length > 0) {
          searchBody.query.bool.filter.push({
            terms: { priority: filters.priority },
          });
        }

        if (filters.category && filters.category.length > 0) {
          searchBody.query.bool.filter.push({
            terms: { category: filters.category },
          });
        }
      }

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
      });

      return response.aggregations;
    } catch (error) {
      this.logger.error('Aggregation search failed', error);
      return {};
    }
  }

  async reindexAll(
    tickets: (Ticket & {
      requester?: { id: string; name: string; email: string };
      assignedTo?: { id: string; name: string; email: string };
    })[]
  ) {
    try {
      this.logger.log('Starting full reindex...');

      // Delete existing index
      await this.client.indices.delete({
        index: this.indexName,
        ignore_unavailable: true,
      });

      // Recreate index
      await this.createIndex();

      // Bulk index all tickets
      const body = tickets.flatMap(ticket => [
        { index: { _index: this.indexName, _id: ticket.id } },
        {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          category: ticket.categoryId,
          subcategory: ticket.subcategoryId,
          priority: ticket.priority,
          status: ticket.status,
          impact: ticket.impact,
          urgency: ticket.urgency,
          slaLevel: ticket.slaLevel,
          requesterId: ticket.requesterId,
          assignedToId: ticket.assignedToId,
          requesterName: ticket.requester?.name || '',
          assignedToName: ticket.assignedTo?.name || '',
          resolution: ticket.resolution,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          dueDate: ticket.dueDate,
          closedAt: ticket.closedAt,
          tags: this.extractTags(ticket),
          customFields: {},
        },
      ]);

      await this.client.bulk({ body });
      this.logger.log(`Reindexed ${tickets.length} tickets`);
    } catch (error) {
      this.logger.error('Full reindex failed', error);
      throw error;
    }
  }

  async getHealth() {
    try {
      const health = await this.client.cluster.health({
        index: this.indexName,
      });
      return {
        status: health.status,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards,
        relocatingShards: health.relocating_shards,
        initializingShards: health.initializing_shards,
        unassignedShards: health.unassigned_shards,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return { status: 'red', error: error.message };
    }
  }

  private extractTags(ticket: Ticket): string[] {
    const tags: string[] = [];

    // Add priority as tag
    if (ticket.priority) {
      tags.push(`priority:${ticket.priority.toLowerCase()}`);
    }

    // Add status as tag
    if (ticket.status) {
      tags.push(`status:${ticket.status.toLowerCase()}`);
    }

    // Add category as tag
    if (ticket.categoryId) {
      tags.push(`category:${ticket.categoryId.toLowerCase()}`);
    }

    // Add SLA level as tag
    if (ticket.slaLevel) {
      tags.push(`sla:${ticket.slaLevel.toLowerCase()}`);
    }

    return tags;
  }
}
