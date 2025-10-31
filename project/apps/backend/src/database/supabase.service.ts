import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

@Injectable()
export class SupabaseService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient<Database>;
  private supabaseAdmin: SupabaseClient<Database>; // For admin operations with service role key

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY'
      );
    }

    // Client with anon key (for client-side operations)
    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    // Admin client with service role key (bypasses RLS)
    if (supabaseServiceKey) {
      this.supabaseAdmin = createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } else {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY not set. Admin operations may not work correctly.'
      );
      this.supabaseAdmin = this.supabase;
    }
  }

  async onModuleInit() {
    try {
      // Test connection
      const { data, error } = await this.supabase.from('users').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is OK
        this.logger.error('Failed to connect to Supabase:', error);
        throw error;
      }

      this.logger.log('✅ Supabase connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Supabase:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Supabase disconnected');
  }

  /**
   * Get the Supabase client (uses anon key, respects RLS)
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Get the Supabase admin client (uses service role key, bypasses RLS)
   * Use this for server-side operations that need admin privileges
   */
  getAdminClient(): SupabaseClient<Database> {
    return this.supabaseAdmin;
  }

  /**
   * Helper method for common query operations
   * Uses admin client by default (you can modify this based on your needs)
   */
  get client() {
    return this.supabaseAdmin;
  }

  /**
   * Helper for type-safe queries
   * Example: supabaseService.from('users').select('*')
   */
  get from() {
    return this.supabaseAdmin.from.bind(this.supabaseAdmin);
  }

  /**
   * Helper for storage operations
   */
  get storage() {
    return this.supabaseAdmin.storage;
  }

  /**
   * Helper for auth operations (using admin client for user management)
   */
  get auth() {
    return this.supabaseAdmin.auth;
  }

  /**
   * Transaction helper (Supabase doesn't have native transactions, but you can use RPC)
   * For complex transactions, create a PostgreSQL function and call it via RPC
   */
  async rpc<T = any>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: any }> {
    return this.supabaseAdmin.rpc(functionName, params);
  }

  /**
   * Pagination helper
   */
  async paginate<T = any>(
    table: string,
    options: {
      page?: number;
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      filters?: Record<string, unknown>;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {},
    } = options;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = this.supabaseAdmin
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: (data || []) as T[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

