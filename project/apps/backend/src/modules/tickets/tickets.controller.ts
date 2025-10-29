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
import { TicketFiltersDto } from './dto/ticket-filters.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { NextAuthJwtGuard } from '../auth/guards/nextauth-jwt.guard';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(NextAuthJwtGuard)
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
  @ApiOperation({ summary: 'Get all tickets with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @Get('my')
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiResponse({
    status: 200,
    description: 'User tickets retrieved successfully',
  })
  async getMyTickets(@Query() filters: TicketFiltersDto, @Request() req) {
    const tickets = await this.ticketsService.findMyTickets(
      req.user.id,
      req.user.activeRole
    );

    // Apply filters to the result
    let filteredTickets = tickets;
    if (filters.status && filters.status.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.status.includes(ticket.status)
      );
    }
    if (filters.priority && filters.priority.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.priority.includes(ticket.priority)
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.ticketNumber.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    return {
      data: paginatedTickets,
      pagination: {
        page,
        limit,
        total: filteredTickets.length,
        totalPages: Math.ceil(filteredTickets.length / limit),
      },
      message: 'Your tickets retrieved successfully',
    };
  }

  @Get('assigned')
  @ApiOperation({ summary: 'Get tickets assigned to current user' })
  @ApiResponse({
    status: 200,
    description: 'Assigned tickets retrieved successfully',
  })
  async getAssignedTickets(@Query() filters: TicketFiltersDto, @Request() req) {
    // Debug logging removed for production

    const result = await this.ticketsService.findAssignedTickets(
      req.user.id,
      req.user.activeRole
    );

    // Apply filters to the result
    let filteredTickets = result.data;
    if (filters.status && filters.status.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.status.includes(ticket.status)
      );
    }
    if (filters.priority && filters.priority.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.priority.includes(ticket.priority)
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.ticketNumber.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    return {
      data: paginatedTickets,
      pagination: {
        page,
        limit,
        total: filteredTickets.length,
        totalPages: Math.ceil(filteredTickets.length / limit),
      },
      message: 'Assigned tickets retrieved successfully',
    };
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tickets' })
  @ApiResponse({
    status: 200,
    description: 'Overdue tickets retrieved successfully',
  })
  async getOverdueTickets(@Request() req) {
    const tickets = await this.ticketsService.findOverdueTickets(
      req.user.id,
      req.user.activeRole
    );
    return {
      data: tickets,
      message: 'Overdue tickets retrieved successfully',
    };
  }

  @Get('approaching-sla')
  @ApiOperation({ summary: 'Get tickets approaching SLA breach' })
  @ApiResponse({
    status: 200,
    description: 'Tickets approaching SLA retrieved successfully',
  })
  async getTicketsApproachingSLA() {
    const tickets = await this.ticketsService.getTicketsApproachingSLA();
    return {
      data: tickets,
      message: 'Tickets approaching SLA retrieved successfully',
    };
  }

  @Get('breached-sla')
  @ApiOperation({ summary: 'Get tickets that have breached SLA' })
  @ApiResponse({
    status: 200,
    description: 'Breached SLA tickets retrieved successfully',
  })
  async getBreachedSLATickets() {
    const tickets = await this.ticketsService.getBreachedSLATickets();
    return {
      data: tickets,
      message: 'Breached SLA tickets retrieved successfully',
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
      data: ticket,
      message: 'Ticket status updated successfully',
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
      data: ticket,
      message: 'Ticket assigned successfully',
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
      data: ticket,
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
}
