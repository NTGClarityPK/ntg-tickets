import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Attachments')
@Controller('attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('ticket/:ticketId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload attachment to ticket' })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async uploadAttachment(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const attachment = await this.attachmentsService.uploadAttachment(
      ticketId,
      file,
      req.user.id,
      req.user.activeRole
    );

    return {
      data: attachment,
      message: 'Attachment uploaded successfully',
    };
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get all attachments for a ticket' })
  @ApiResponse({
    status: 200,
    description: 'Attachments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Request() req
  ) {
    const attachments = await this.attachmentsService.findAll(
      ticketId,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: attachments,
      message: 'Attachments retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attachment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const attachment = await this.attachmentsService.findOne(
      id,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: attachment,
      message: 'Attachment retrieved successfully',
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get signed URL for attachment download' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSignedUrl(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.attachmentsService.getSignedUrl(
      id,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: result,
      message: 'Signed URL generated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.attachmentsService.remove(
      id,
      req.user.id,
      req.user.activeRole
    );
    return result;
  }
}
