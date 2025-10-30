import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    const comment = await this.commentsService.create(
      createCommentDto,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: comment,
      message: 'Comment created successfully',
    };
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get all comments for a ticket' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Request() req
  ) {
    const comments = await this.commentsService.findAll(
      ticketId,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: comments,
      message: 'Comments retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const comment = await this.commentsService.findOne(
      id,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: comment,
      message: 'Comment retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req
  ) {
    const comment = await this.commentsService.update(
      id,
      updateCommentDto,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: comment,
      message: 'Comment updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.commentsService.remove(
      id,
      req.user.id,
      req.user.activeRole
    );
    return result;
  }
}
