import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../../config/app-config.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private readonly appConfig: AppConfigService
  ) {
    this.bucketName =
      this.configService.get('AWS_S3_BUCKET') ||
      this.configService.get('R2_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId:
          this.configService.get('AWS_ACCESS_KEY_ID') ||
          this.configService.get('R2_ACCESS_KEY_ID'),
        secretAccessKey:
          this.configService.get('AWS_SECRET_ACCESS_KEY') ||
          this.configService.get('R2_SECRET_ACCESS_KEY'),
      },
      endpoint: this.configService.get('R2_ACCOUNT_ID')
        ? `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`
        : undefined,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: { folder: string; filename: string }
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${options.folder}/${options.filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const key = `${options.folder}/${options.filename}`;
      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      this.logger.log(`File uploaded: ${key}`);

      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  async getSignedUrl(
    key: string,
    options: { expiresIn?: number; responseContentDisposition?: string } = {}
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600,
      });
      return signedUrl;
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  generateFileKey(ticketId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `tickets/${ticketId}/${timestamp}_${sanitizedFilename}`;
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
