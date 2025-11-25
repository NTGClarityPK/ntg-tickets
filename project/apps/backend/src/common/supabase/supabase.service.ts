import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      this.logger.warn(
        'Supabase credentials not fully configured. Some features may not work.'
      );
    }

    // Client for user operations (uses anon key - limited permissions)
    this.supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    // Admin client for server-side operations (uses service role key - full permissions)
    // WARNING: Never expose this client to the frontend!
    this.supabaseAdmin = createClient(
      supabaseUrl || '',
      supabaseServiceKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async onModuleInit() {
    try {
      // Test connection by checking if we can access auth (doesn't require database tables)
      // This verifies the Supabase client is properly configured
      const { data, error } = await this.supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      
      if (error) {
        this.logger.warn('Supabase connection test failed:', error.message);
        // Check if it's a configuration issue
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !supabaseServiceKey) {
          this.logger.error('⚠️ Supabase credentials missing! Check your .env file.');
        } else {
          this.logger.warn('⚠️ Supabase connection issue. Auth operations may fail.');
        }
      } else {
        this.logger.log('✅ Supabase connected successfully');
      }
    } catch (error) {
      this.logger.warn('Supabase initialization check failed:', error);
      // Don't throw - allow the app to start even if Supabase test fails
      // The actual operations will fail with better error messages
    }
  }

  /**
   * Get Supabase client (anon key - for user operations)
   * Use this for operations that should respect RLS policies
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get Supabase admin client (service role key - bypasses RLS)
   * WARNING: Only use this for server-side operations that need admin privileges
   * Never expose this to the frontend!
   */
  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Get Supabase client with a specific access token
   * Useful for operations on behalf of a specific user
   */
  getClientWithToken(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');

    return createClient(supabaseUrl || '', supabaseAnonKey || '', {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
  }
}

