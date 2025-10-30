import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Event listeners disabled due to Prisma version compatibility
    // if (process.env.NODE_ENV === 'development') {
    //   this.$on('query', (e: any) => {
    //     this.logger.debug(`Query: ${e.query}`)
    //     this.logger.debug(`Params: ${e.params}`)
    //     this.logger.debug(`Duration: ${e.duration}ms`)
    //   })
    // }

    // this.$on('error', (e: any) => {
    //   this.logger.error('Database error:', e)
    // })

    // this.$on('info', (e: any) => {
    //   this.logger.log(`Database info: ${e.message}`)
    // })

    // this.$on('warn', (e: any) => {
    //   this.logger.warn(`Database warning: ${e.message}`)
    // })
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  async enableShutdownHooks() {
    // this.$on('beforeExit', async () => {
    //   await app.close()
    // })
  }

  // Helper method for transactions
  async transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  // Helper method for soft deletes
  async softDelete(model: string, where: Record<string, unknown>) {
    const updateData = {
      isActive: false,
      updatedAt: new Date(),
    };

    // Type assertion for dynamic model access
    const modelInstance = (
      this as unknown as Record<
        string,
        {
          update: (args: {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          }) => Promise<unknown>;
        }
      >
    )[model];
    return modelInstance.update({
      where,
      data: updateData,
    });
  }

  // Helper method for pagination
  async paginate(
    model: string,
    args: { page?: number; limit?: number; [key: string]: unknown }
  ) {
    const { page = 1, limit = 20, ...where } = args;
    const skip = (page - 1) * limit;

    // Type assertion for dynamic model access
    const modelInstance = (
      this as unknown as Record<
        string,
        {
          findMany: (args: {
            where: Record<string, unknown>;
            skip: number;
            take: number;
            orderBy: Record<string, string>;
          }) => Promise<unknown[]>;
          count: (args: { where: Record<string, unknown> }) => Promise<number>;
        }
      >
    )[model];

    const [data, total] = await Promise.all([
      modelInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      modelInstance.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
