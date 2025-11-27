import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FileStorageService } from '../../common/file-storage/file-storage.service';
import { VirusScanService } from '../virus-scan/virus-scan.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
// import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private prisma: PrismaService,
    private fileStorage: FileStorageService,
    private virusScan: VirusScanService,
    private tenantContext: TenantContextService
  ) {}

  async uploadAttachment(
    ticketId: string,
    file: Express.Multer.File,
    userId: string,
    userRole: string
  ) {
    this.logger.log(
      `Uploading attachment for ticket ${ticketId}`,
      'AttachmentsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();

    // Validate user has permission to upload attachments to this ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, ...(tenantId ? { tenantId } : {}) },
      select: { requesterId: true, assignedToId: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has permission to upload to this ticket
    const hasPermission =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole);

    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to upload attachments to this ticket'
      );
    }

    // Validate file size (10MB max per file)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    // Check if ticket exists (already validated above with tenant filter)
    const existingTicket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, ...(tenantId ? { tenantId } : {}) },
    });

    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    // Enhanced virus scanning with file metadata
    try {
      const scanResult = await this.virusScan.scanFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      if (!scanResult.clean) {
        this.logger.warn('File upload blocked by virus scan', {
          fileName: file.originalname,
          threats: scanResult.threats,
          scanEngine: scanResult.scanEngine,
          scanTime: scanResult.scanTime,
        });

        throw new BadRequestException(
          `File failed security scan: ${scanResult.threats?.join(', ')}`
        );
      }

      this.logger.log('File passed virus scan', {
        fileName: file.originalname,
        scanEngine: scanResult.scanEngine,
        scanTime: scanResult.scanTime,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // Re-throw security-related errors
      }
      this.logger.error('Virus scan failed', error);
      throw new BadRequestException(
        'File security scan failed - upload rejected'
      );
    }

    // Sanitize filename to remove special characters and emojis
    // Keep the original extension
    const fileExtension = file.originalname.split('.').pop() || '';
    const fileNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    // Replace all non-ASCII and special characters with underscores
    const sanitizedBaseName = fileNameWithoutExt
      .replace(/[^\x00-\x7F]/g, '_') // Replace non-ASCII characters (emojis, etc.)
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace remaining special characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    const sanitizedFilename = `${timestamp}_${sanitizedBaseName}${fileExtension ? '.' + fileExtension : ''}`;
    
    // Upload file to Supabase Storage
    const fileUrl = await this.fileStorage.uploadFile(file, {
      folder: `tickets/${ticketId}`,
      filename: sanitizedFilename,
      bucket: 'ticket-attachments',
    });

    // Create attachment record
    // Store both the public URL and the storage path
    const attachment = await this.prisma.attachment.create({
      data: {
        ticketId: ticketId,
        filename: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        fileUrl, // Store the public URL from Supabase
        uploadedBy: userId,
      },
      include: {
        uploader: true,
        ticket: {
          include: {
            requester: true,
            assignedTo: true,
          },
        },
      },
    });

    this.logger.log(
      `Attachment created: ${attachment.id}`,
      'AttachmentsService'
    );
    return attachment;
  }

  async findAll(ticketId: string, userId: string, userRole: string) {
    this.logger.log(
      `Finding attachments for ticket ${ticketId}`,
      'AttachmentsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();

    // Validate user has permission to view attachments for this ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, ...(tenantId ? { tenantId } : {}) },
      select: { requesterId: true, assignedToId: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has permission to view attachments for this ticket
    const hasPermission =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole);

    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to view attachments for this ticket'
      );
    }

    const attachments = await this.prisma.attachment.findMany({
      where: { ticketId },
      include: {
        uploader: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attachments;
  }

  async findOne(id: string, userId: string, userRole: string) {
    this.logger.log(`Finding attachment ${id}`, 'AttachmentsService');

    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        uploader: true,
        ticket: {
          include: {
            requester: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if user has permission to view this attachment
    const ticket = attachment.ticket;
    const hasPermission =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole);

    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to view this attachment'
      );
    }

    return attachment;
  }

  async getSignedUrl(id: string, userId: string, userRole: string) {
    this.logger.log(
      `Getting signed URL for attachment ${id}`,
      'AttachmentsService'
    );

    const attachment = await this.findOne(id, userId, userRole);

    // Check permissions - user must be requester, assignee, or have admin role
    const ticket = attachment.ticket;
    const hasPermission =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole);

    if (!hasPermission) {
      throw new BadRequestException('Access denied');
    }

    // Generate signed URL for download from Supabase Storage
    // Extract path from stored URL
    let filePath = attachment.fileUrl;
    if (filePath.includes('/storage/v1/object/public/')) {
      // Extract path from Supabase public URL
      const urlParts = filePath.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const bucketAndPath = urlParts[1];
        const pathParts = bucketAndPath.split('/');
        filePath = pathParts.slice(1).join('/'); // Remove bucket name
      }
    } else if (!filePath.includes('/')) {
      // Assume it's already a path
      filePath = attachment.fileUrl;
    }

    const downloadUrl = await this.fileStorage.getSignedUrl(filePath, {
      expiresIn: 3600,
      responseContentDisposition: `attachment; filename="${attachment.filename}"`,
      bucket: 'ticket-attachments',
    });

    return {
      downloadUrl,
      filename: attachment.filename,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
    };
  }

  async update(
    id: string,
    updateAttachmentDto: UpdateAttachmentDto,
    userId: string,
    userRole: string
  ) {
    this.logger.log(`Updating attachment ${id}`, 'AttachmentsService');

    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check permissions - user can update their own attachments or admins can update any
    const canUpdate =
      attachment.uploadedBy === userId ||
      ['ADMIN', 'SUPPORT_MANAGER'].includes(userRole);

    if (!canUpdate) {
      throw new BadRequestException(
        'Access denied: You can only update your own attachments'
      );
    }

    const updatedAttachment = await this.prisma.attachment.update({
      where: { id },
      data: updateAttachmentDto,
      include: {
        uploader: true,
        ticket: {
          include: {
            requester: true,
            assignedTo: true,
          },
        },
      },
    });

    this.logger.log(`Attachment updated: ${id}`, 'AttachmentsService');
    return updatedAttachment;
  }

  async remove(id: string, userId: string, userRole: string) {
    this.logger.log(`Deleting attachment ${id}`, 'AttachmentsService');

    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check permissions - user can delete their own attachments or admins can delete any
    const canDelete =
      attachment.uploadedBy === userId ||
      ['ADMIN', 'SUPPORT_MANAGER'].includes(userRole);

    if (!canDelete) {
      throw new BadRequestException(
        'Access denied: You can only delete your own attachments'
      );
    }

    // Delete file from Supabase Storage
    // Extract path from URL or use stored path
    try {
      // If fileUrl is a full URL, extract the path
      let filePath = attachment.fileUrl;
      if (filePath.includes('/storage/v1/object/public/')) {
        // Extract path from Supabase public URL
        const urlParts = filePath.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const bucketAndPath = urlParts[1];
          const pathParts = bucketAndPath.split('/');
          filePath = pathParts.slice(1).join('/'); // Remove bucket name
        }
      } else if (filePath.includes('/storage/v1/object/sign/')) {
        // For signed URLs, we need to store the path separately
        // For now, log a warning
        this.logger.warn('Cannot delete file from signed URL, path not stored');
      }
      
      await this.fileStorage.deleteFile(filePath, 'ticket-attachments');
    } catch (error) {
      this.logger.warn('Failed to delete file from storage', error);
    }

    // Delete attachment record
    await this.prisma.attachment.delete({
      where: { id },
    });

    this.logger.log(`Attachment deleted: ${id}`, 'AttachmentsService');
    return { message: 'Attachment deleted successfully' };
  }

  async getFilePreview(id: string, userId: string, userRole: string) {
    this.logger.log(
      `Getting file preview for attachment ${id}`,
      'AttachmentsService'
    );

    const attachment = await this.findOne(id, userId, userRole);

    // Check permissions
    const ticket = attachment.ticket;
    const hasPermission =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole);

    if (!hasPermission) {
      throw new BadRequestException('Access denied');
    }

    // Check if file is previewable
    const previewableTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];

    if (!previewableTypes.includes(attachment.fileType)) {
      throw new BadRequestException('File type not previewable');
    }

    // Generate preview URL from Supabase Storage
    let filePath = attachment.fileUrl;
    if (filePath.includes('/storage/v1/object/public/')) {
      const urlParts = filePath.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const bucketAndPath = urlParts[1];
        const pathParts = bucketAndPath.split('/');
        filePath = pathParts.slice(1).join('/');
      }
    }

    const previewUrl = await this.fileStorage.getSignedUrl(filePath, {
      expiresIn: 3600,
      bucket: 'ticket-attachments',
    });

    return {
      previewUrl,
      filename: attachment.filename,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
    };
  }

  async getAttachmentStats(ticketId: string) {
    this.logger.log(
      `Getting attachment stats for ticket ${ticketId}`,
      'AttachmentsService'
    );

    const stats = await this.prisma.attachment.aggregate({
      where: { ticketId },
      _count: {
        id: true,
      },
      _sum: {
        fileSize: true,
      },
    });

    return {
      totalFiles: stats._count.id,
      totalSize: stats._sum.fileSize || 0,
      totalSizeFormatted: this.formatFileSize(stats._sum.fileSize || 0),
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
