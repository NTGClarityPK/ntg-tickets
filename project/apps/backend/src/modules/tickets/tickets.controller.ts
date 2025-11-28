import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketFiltersDto, TicketViewType } from './dto/ticket-filters.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    const ticket = await this.ticketsService.create(
      createTicketDto,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: ticket,
      message: 'Ticket created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List tickets with filters' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'viewType', required: false, enum: TicketViewType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: [String] })
  @ApiQuery({ name: 'priority', required: false, type: [String] })
  @ApiQuery({ name: 'category', required: false, type: [String] })
  @ApiQuery({ name: 'assignedToId', required: false, type: [String] })
  @ApiQuery({ name: 'requesterId', required: false, type: [String] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async findAll(@Query() filters: TicketFiltersDto, @Request() req) {
    const result = await this.ticketsService.findAll(
      filters,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Tickets retrieved successfully',
    };
  }



  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const ticket = await this.ticketsService.findOne(
      id,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: ticket,
      message: 'Ticket retrieved successfully',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; resolution?: string; comment?: string },
    @Request() req
  ) {
    // Debug logging removed for production

    const ticket = await this.ticketsService.updateStatus(
      id,
      body.status,
      body.resolution,
      req.user.id,
      req.user.activeRole,
      body.comment,
    );
    return {
      message: 'Ticket status updated successfully',
      ticketId: ticket.id,
      status: ticket.status,
    };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to user' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid assignment' })
  @ApiResponse({ status: 404, description: 'Ticket or user not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTicketDto: AssignTicketDto,
    @Request() req
  ) {
    const ticket = await this.ticketsService.assignTicket(
      id,
      assignTicketDto.assignedToId,
      req.user.id,
      req.user.activeRole
    );
    return {
      message: 'Ticket assigned successfully',
      ticketId: ticket.id,
      assignedToId: ticket.assignedTo?.id || assignTicketDto.assignedToId,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Request() req
  ) {
    const ticket = await this.ticketsService.update(
      id,
      updateTicketDto,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: {
        id: ticket.id,
        description: ticket.description,
        status: ticket.status,
      },
      message: 'Ticket updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.ticketsService.remove(
      id,
      req.user.id,
      req.user.activeRole
    );
    return result;
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete tickets' })
  @ApiResponse({
    status: 200,
    description: 'Tickets deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - No IDs provided' })
  @ApiResponse({ status: 404, description: 'No tickets found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async bulkDelete(
    @Body() body: { ids: string[] },
    @Request() req
  ) {
    const result = await this.ticketsService.bulkRemove(
      body.ids,
      req.user.id,
      req.user.activeRole
    );
    return {
      data: result,
      message: `Successfully deleted ${result.deletedCount} ticket(s)`,
    };
  }
}
