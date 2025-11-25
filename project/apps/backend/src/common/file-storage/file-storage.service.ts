import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../../config/app-config.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private bucketName: string;
  private attachmentsBucket: string;
  private avatarsBucket: string;

  constructor(
    private configService: ConfigService,
    private readonly appConfig: AppConfigService,
    private supabaseService: SupabaseService
  ) {
    // Default bucket names - can be overridden via env
    this.attachmentsBucket =
      this.configService.get('SUPABASE_STORAGE_BUCKET_ATTACHMENTS') ||
      'ticket-attachments';
    this.avatarsBucket =
      this.configService.get('SUPABASE_STORAGE_BUCKET_AVATARS') ||
      'user-avatars';
    this.bucketName = this.attachmentsBucket; // Default bucket
  }

  async uploadFile(
    file: Express.Multer.File,
    options: { folder: string; filename: string; bucket?: string }
  ): Promise<string> {
    try {
      const bucket = options.bucket || this.attachmentsBucket;
      const filePath = `${options.folder}/${options.filename}`;

      const supabase = this.supabaseService.getAdminClient();

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Set to true if you want to overwrite existing files
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        });

      if (error) {
        this.logger.error('Error uploading file to Supabase:', error);
        throw error;
      }

      // Get public URL for the file
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      this.logger.log(`File uploaded to Supabase: ${filePath}`);
      return publicUrl;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(
    filePath: string,
    bucket?: string
  ): Promise<void> {
    try {
      const bucketName = bucket || this.attachmentsBucket;
      const supabase = this.supabaseService.getAdminClient();

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error('Error deleting file from Supabase:', error);
        throw error;
      }

      this.logger.log(`File deleted from Supabase: ${filePath}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  async getSignedUrl(
    filePath: string,
    options: {
      expiresIn?: number;
      responseContentDisposition?: string;
      bucket?: string;
    } = {}
  ): Promise<string> {
    try {
      const bucketName = options.bucket || this.attachmentsBucket;
      const expiresIn = options.expiresIn || 3600; // Default 1 hour
      const supabase = this.supabaseService.getAdminClient();

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        this.logger.error('Error generating signed URL:', error);
        throw error;
      }

      // If responseContentDisposition is provided, append it to the URL
      if (options.responseContentDisposition && data.signedUrl) {
        const url = new URL(data.signedUrl);
        url.searchParams.append(
          'response-content-disposition',
          options.responseContentDisposition
        );
        return url.toString();
      }

      return data.signedUrl;
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  generateFileKey(ticketId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${ticketId}/${timestamp}_${sanitizedFilename}`;
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  getPublicUrl(filePath: string, bucket?: string): string {
    const bucketName = bucket || this.attachmentsBucket;
    const supabase = this.supabaseService.getAdminClient();
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  }

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

  validateFileSize(size: number): boolean {
    const maxSize = this.appConfig.maxFileSizeBytes;
    return size <= maxSize;
  }
}
