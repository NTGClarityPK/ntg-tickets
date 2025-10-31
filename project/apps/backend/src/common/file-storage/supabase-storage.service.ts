import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../database/supabase.service';

export interface UploadOptions {
  folder: string;
  filename: string;
}

export interface SignedUrlOptions {
  expiresIn?: number;
  responseContentDisposition?: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private bucketName: string;

  constructor(
    private supabase: SupabaseService,
    private configService: ConfigService
  ) {
    this.bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'ticket-attachments';
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions
  ): Promise<string> {
    try {
      const filePath = `${options.folder}/${options.filename}`;

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Set to true if you want to overwrite existing files
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            fileSize: file.size.toString(),
          },
        });

      if (error) {
        this.logger.error('Error uploading file to Supabase Storage:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      this.logger.log(`File uploaded: ${filePath}`);
      return urlData.publicUrl;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      // Extract the path from URL if it's a full URL
      const path = this.extractPathFromUrl(filePath);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        this.logger.error('Error deleting file from Supabase Storage:', error);
        throw error;
      }

      this.logger.log(`File deleted: ${path}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for downloading a file
   * Note: Supabase Storage uses public URLs by default, but you can create signed URLs for private buckets
   */
  async getSignedUrl(
    filePath: string,
    options: SignedUrlOptions = {}
  ): Promise<string> {
    try {
      const path = this.extractPathFromUrl(filePath);

      // If bucket is public, return public URL
      // Otherwise, create signed URL
      const expiresIn = options.expiresIn || 3600; // Default 1 hour

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) {
        // If signed URL fails, try public URL as fallback
        this.logger.warn('Failed to create signed URL, using public URL:', error);
        const { data: urlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(path);
        return urlData.publicUrl;
      }

      let signedUrl = data.signedUrl;

      // Add response content disposition if specified
      if (options.responseContentDisposition) {
        const url = new URL(signedUrl);
        url.searchParams.set('download', options.responseContentDisposition);
        signedUrl = url.toString();
      }

      return signedUrl;
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(filePath: string): Promise<string> {
    const path = this.extractPathFromUrl(filePath);
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        this.logger.error('Error listing files:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Helper: Extract file path from full URL
   */
  private extractPathFromUrl(url: string): string {
    // If it's already a path, return it
    if (!url.includes('http')) {
      return url;
    }

    // Extract path from Supabase Storage URL
    // Format: https://PROJECT_ID.supabase.co/storage/v1/object/public/BUCKET_NAME/path/to/file
    const match = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    if (match) {
      return match[1];
    }

    // Fallback: try to extract from any URL
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\/storage\/v1\/object\/public\/[^\/]+\//, '');
    } catch {
      return url;
    }
  }

  /**
   * Generate a file key (path) for storing files
   */
  generateFileKey(ticketId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `tickets/${ticketId}/${timestamp}_${sanitizedFilename}`;
  }

  /**
   * Validate file type
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): boolean {
    const maxSize = parseInt(
      process.env.MAX_FILE_SIZE || '10485760',
      10
    ); // 10MB default
    return size <= maxSize;
  }

  /**
   * Create bucket if it doesn't exist (admin operation)
   * Call this during app initialization
   */
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

      if (listError) {
        this.logger.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some((b) => b.name === this.bucketName);

      if (!bucketExists) {
        const { data, error } = await this.supabase.storage.createBucket(
          this.bucketName,
          {
            public: true, // Set to false for private buckets
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
            ],
          }
        );

        if (error) {
          this.logger.error('Error creating bucket:', error);
          throw error;
        }

        this.logger.log(`Bucket created: ${this.bucketName}`);
      } else {
        this.logger.log(`Bucket already exists: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error('Error ensuring bucket exists:', error);
      // Don't throw - allow app to continue even if bucket creation fails
    }
  }
}

