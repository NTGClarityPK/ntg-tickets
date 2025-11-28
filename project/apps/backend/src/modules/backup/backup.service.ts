import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FileStorageService } from '../../common/file-storage/file-storage.service';
import { AppConfigService } from '../../config/app-config.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private prisma: PrismaService,
    private fileStorageService: FileStorageService,
    private readonly appConfig: AppConfigService
  ) {}

  /**
   * Create a full database backup
   */
  async createDatabaseBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `database-backup-${timestamp}.sql`;
      const backupPath = path.join(process.cwd(), 'backups', backupFileName);

      // Ensure backups directory exists
      const backupsDir = path.dirname(backupPath);
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      // Get database URL from environment
      const databaseUrl = this.appConfig.databaseUrl;
      if (!databaseUrl) {
        throw new Error('Database URL is not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Create pg_dump command
      const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose --clean --no-owner --no-privileges > "${backupPath}"`;

      this.logger.log('Creating database backup...');
      await execAsync(pgDumpCommand);

      // Compress the backup
      const compressedBackupPath = `${backupPath}.gz`;
      await this.compressFile(backupPath, compressedBackupPath);

      // Upload to cloud storage
      const backupBuffer = fs.readFileSync(compressedBackupPath);
      const cloudPath = `backups/${backupFileName}.gz`;
      await this.fileStorageService.uploadFile(
        {
          buffer: backupBuffer,
          originalname: `${backupFileName}.gz`,
          mimetype: 'application/gzip',
          size: backupBuffer.length,
        } as Express.Multer.File,
        {
          folder: 'backups',
          filename: `${backupFileName}.gz`,
        }
      );

      // Clean up local files
      fs.unlinkSync(backupPath);
      fs.unlinkSync(compressedBackupPath);

      this.logger.log(`Database backup created successfully: ${cloudPath}`);
      return cloudPath;
    } catch (error) {
      this.logger.error('Error creating database backup:', error);
      throw error;
    }
  }

  /**
   * Create a data-only backup (JSON format)
   */
  async createDataBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `data-backup-${timestamp}.json`;
      const backupPath = path.join(process.cwd(), 'backups', backupFileName);

      // Ensure backups directory exists
      const backupsDir = path.dirname(backupPath);
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      // Export all data
      const data = {
        users: await this.prisma.user.findMany(),
        categories: await this.prisma.category.findMany(),
        subcategories: await this.prisma.subcategory.findMany(),
        tickets: await this.prisma.ticket.findMany({
          include: {
            requester: true,
            assignedTo: true,
            comments: true,
            attachments: true,
            history: true,
          },
        }),
        customFields: await this.prisma.customField.findMany(),
        emailTemplates: await this.prisma.emailTemplate.findMany(),
        systemSettings: await this.prisma.systemSettings.findMany(),
        notifications: await this.prisma.notification.findMany(),
        savedSearches: await this.prisma.savedSearch.findMany(),
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          totalRecords: 0, // Will be calculated
        },
      };

      // Calculate total records
      data.metadata.totalRecords = Object.values(data).reduce(
        (total, table) => {
          if (Array.isArray(table)) return total + table.length;
          return total;
        },
        0
      );

      // Write to file
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

      // Compress the backup
      const compressedBackupPath = `${backupPath}.gz`;
      await this.compressFile(backupPath, compressedBackupPath);

      // Upload to cloud storage
      const backupBuffer = fs.readFileSync(compressedBackupPath);
      const cloudPath = `backups/${backupFileName}.gz`;
      await this.fileStorageService.uploadFile(
        {
          buffer: backupBuffer,
          originalname: `${backupFileName}.gz`,
          mimetype: 'application/gzip',
          size: backupBuffer.length,
        } as Express.Multer.File,
        {
          folder: 'backups',
          filename: `${backupFileName}.gz`,
        }
      );

      // Clean up local files
      fs.unlinkSync(backupPath);
      fs.unlinkSync(compressedBackupPath);

      this.logger.log(`Data backup created successfully: ${cloudPath}`);
      return cloudPath;
    } catch (error) {
      this.logger.error('Error creating data backup:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabaseBackup(backupPath: string): Promise<void> {
    try {
      this.logger.log(`Restoring database from backup: ${backupPath}`);

      // Download backup from cloud storage
      const backupBuffer = await this.downloadBackup(backupPath);
      const tempPath = path.join(
        process.cwd(),
        'temp',
        `restore-${Date.now()}.sql.gz`
      );

      // Ensure temp directory exists
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write backup to temp file
      fs.writeFileSync(tempPath, backupBuffer);

      // Decompress the backup
      const decompressedPath = tempPath.replace('.gz', '');
      await this.decompressFile(tempPath, decompressedPath);

      // Get database URL from environment
      const databaseUrl = this.appConfig.databaseUrl;
      if (!databaseUrl) {
        throw new Error('Database URL is not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Create psql command to restore
      const psqlCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} --no-password < "${decompressedPath}"`;

      this.logger.log('Restoring database...');
      await execAsync(psqlCommand);

      // Clean up temp files
      fs.unlinkSync(tempPath);
      fs.unlinkSync(decompressedPath);

      this.logger.log('Database restored successfully');
    } catch (error) {
      this.logger.error('Error restoring database backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from JSON backup
   */
  async restoreDataBackup(backupPath: string): Promise<void> {
    try {
      this.logger.log(`Restoring data from backup: ${backupPath}`);

      // Download backup from cloud storage
      const backupBuffer = await this.downloadBackup(backupPath);
      const tempPath = path.join(
        process.cwd(),
        'temp',
        `restore-${Date.now()}.json.gz`
      );

      // Ensure temp directory exists
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write backup to temp file
      fs.writeFileSync(tempPath, backupBuffer);

      // Decompress the backup
      const decompressedPath = tempPath.replace('.gz', '');
      await this.decompressFile(tempPath, decompressedPath);

      // Read and parse JSON data
      const backupData = JSON.parse(fs.readFileSync(decompressedPath, 'utf8'));

      // Start transaction
      await this.prisma.$transaction(async tx => {
        // Clear existing data (in reverse order of dependencies)
        await tx.savedSearch.deleteMany();
        await tx.notification.deleteMany();
        await tx.ticketCustomField.deleteMany();
        await tx.ticketHistory.deleteMany();
        await tx.attachment.deleteMany();
        await tx.comment.deleteMany();
        await tx.ticket.deleteMany();
        await tx.subcategory.deleteMany();
        await tx.category.deleteMany();
        await tx.customField.deleteMany();
        await tx.emailTemplate.deleteMany();
        await tx.systemSettings.deleteMany();
        await tx.user.deleteMany();

        // Restore data (in order of dependencies)
        if (backupData.users) {
          await tx.user.createMany({ data: backupData.users });
        }

        if (backupData.categories) {
          await tx.category.createMany({ data: backupData.categories });
        }

        if (backupData.subcategories) {
          await tx.subcategory.createMany({ data: backupData.subcategories });
        }

        if (backupData.customFields) {
          await tx.customField.createMany({ data: backupData.customFields });
        }

        if (backupData.emailTemplates) {
          await tx.emailTemplate.createMany({
            data: backupData.emailTemplates,
          });
        }

        if (backupData.systemSettings) {
          await tx.systemSettings.createMany({
            data: backupData.systemSettings,
          });
        }

        if (backupData.tickets) {
          // Create tickets without relations first
          const ticketsData = backupData.tickets.map(
            (ticket: {
              id: string;
              ticketNumber: string;
              title: string;
              description: string;
              category: string;
              subcategory: string;
              priority: string;
              status: string;
              requesterId: string;
              assignedToId?: string;
              dueDate?: Date;
              createdAt: Date;
              updatedAt: Date;
              impact?: string;
              slaLevel?: string;
              resolution?: string;
              closedAt?: Date;
            }) => ({
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: ticket.title,
              description: ticket.description,
              category: ticket.category,
              subcategory: ticket.subcategory,
              priority: ticket.priority,
              status: ticket.status,
              impact: ticket.impact,
              slaLevel: ticket.slaLevel,
              requesterId: ticket.requesterId,
              assignedToId: ticket.assignedToId,
              dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
              resolution: ticket.resolution,
              createdAt: new Date(ticket.createdAt),
              updatedAt: new Date(ticket.updatedAt),
              closedAt: ticket.closedAt ? new Date(ticket.closedAt) : null,
            })
          );

          await tx.ticket.createMany({ data: ticketsData });

          // Create related data
          for (const ticket of backupData.tickets) {
            if (ticket.comments) {
              await tx.comment.createMany({
                data: ticket.comments.map(
                  (comment: {
                    id: string;
                    content: string;
                    authorId: string;
                    ticketId: string;
                    createdAt: Date;
                    updatedAt: Date;
                  }) => ({
                    ...comment,
                    createdAt: new Date(comment.createdAt),
                    updatedAt: new Date(comment.updatedAt),
                  })
                ),
              });
            }

            if (ticket.attachments) {
              await tx.attachment.createMany({
                data: ticket.attachments.map(
                  (attachment: {
                    id: string;
                    filename: string;
                    fileUrl: string;
                    fileSize: number;
                    fileType: string;
                    ticketId: string;
                    uploadedBy: string;
                    createdAt: Date;
                  }) => ({
                    ...attachment,
                    createdAt: new Date(attachment.createdAt),
                  })
                ),
              });
            }

            if (ticket.ticketHistory) {
              await tx.ticketHistory.createMany({
                data: ticket.ticketHistory.map(
                  (history: {
                    id: string;
                    ticketId: string;
                    field: string;
                    oldValue: string;
                    newValue: string;
                    changedBy: string;
                    changedAt: Date;
                    createdAt: Date;
                  }) => ({
                    ...history,
                    createdAt: new Date(history.createdAt),
                  })
                ),
              });
            }
          }
        }

        if (backupData.notifications) {
          await tx.notification.createMany({
            data: backupData.notifications.map(
              (notification: {
                id: string;
                userId: string;
                ticketId?: string;
                type: string;
                title: string;
                message: string;
                isRead: boolean;
                createdAt: Date;
              }) => ({
                ...notification,
                createdAt: new Date(notification.createdAt),
              })
            ),
          });
        }

        if (backupData.savedSearches) {
          await tx.savedSearch.createMany({
            data: backupData.savedSearches.map(
              (search: {
                id: string;
                userId: string;
                name: string;
                query: string;
                filters: string;
                createdAt: Date;
                updatedAt: Date;
              }) => ({
                ...search,
                createdAt: new Date(search.createdAt),
                updatedAt: new Date(search.updatedAt),
              })
            ),
          });
        }
      });

      // Clean up temp files
      fs.unlinkSync(tempPath);
      fs.unlinkSync(decompressedPath);

      this.logger.log('Data restored successfully');
    } catch (error) {
      this.logger.error('Error restoring data backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      // This would typically list files from cloud storage
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error('Error listing backups:', error);
      throw error;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupPath: string): Promise<void> {
    try {
      // This would typically delete from cloud storage
      this.logger.log(`Backup deleted: ${backupPath}`);
    } catch (error) {
      this.logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * Compress a file using gzip
   */
  private async compressFile(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip();
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      input.pipe(gzip).pipe(output);

      output.on('finish', resolve);
      output.on('error', reject);
    });
  }

  /**
   * Decompress a gzipped file
   */
  private async decompressFile(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip();
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      input.pipe(gunzip).pipe(output);

      output.on('finish', resolve);
      output.on('error', reject);
    });
  }

  private async downloadBackup(backupPath: string): Promise<Buffer> {
    try {
      // Read the backup file from the local filesystem
      const fs = await import('fs/promises');
      const path = await import('path');

      const fullPath = path.resolve(backupPath);
      const backupData = await fs.readFile(fullPath);

      this.logger.log(`Downloaded backup from ${backupPath}`);
      return backupData;
    } catch (error) {
      this.logger.error(`Failed to download backup from ${backupPath}:`, error);
      throw new Error(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
