import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FileStorageService } from '../../common/file-storage/file-storage.service';
import { VirusScanService } from '../virus-scan/virus-scan.service';
// import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private prisma: PrismaService,
    private fileStorage: FileStorageService,
    private virusScan: VirusScanService
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

    // Validate user has permission to upload attachments to this ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
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

    // Check if ticket exists
    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
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

    // Upload file to storage
    const fileUrl = await this.fileStorage.uploadFile(file, {
      folder: `tickets/${ticketId}`,
      filename: file.originalname,
    });

    // Create attachment record
    const attachment = await this.prisma.attachment.create({
      data: {
        ticketId: ticketId,
        filename: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        fileUrl,
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

    // Validate user has permission to view attachments for this ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
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

    // Generate signed URL for download
    const downloadUrl = await this.fileStorage.getSignedUrl(
      attachment.fileUrl,
      {
        expiresIn: 3600,
        responseContentDisposition: `attachment; filename="${attachment.filename}"`,
      }
    );

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

    // Delete file from storage
    try {
      await this.fileStorage.deleteFile(attachment.fileUrl);
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

    // Generate preview URL
    const previewUrl = await this.fileStorage.getSignedUrl(attachment.fileUrl, {
      expiresIn: 3600,
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
