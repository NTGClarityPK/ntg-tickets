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
  Query,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ActivateWorkflowDto } from './dto/activate-workflow.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createWorkflowDto: CreateWorkflowDto, @Request() req) {
    const userId = req.user?.sub || req.user?.id;
    const result = await this.workflowsService.create(createWorkflowDto, userId);
    return {
      data: result,
      message: 'Workflow created successfully',
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async findAll() {
    const workflows = await this.workflowsService.findAll();
    return {
      data: workflows,
      message: 'Workflows retrieved successfully',
    };
  }

  @Get('default')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF, UserRole.END_USER)
  async findDefault() {
    const workflow = await this.workflowsService.findDefault();
    return {
      data: workflow,
      message: 'Default workflow retrieved successfully',
    };
  }

  @Get('all-statuses')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async getAllWorkflowStatuses() {
    const statuses = await this.workflowsService.getAllWorkflowStatuses();
    return {
      data: statuses,
      message: 'All workflow statuses retrieved successfully',
    };
  }

  @Get('dashboard-stats')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF, UserRole.END_USER)
  async getDashboardStats(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.activeRole || req.user?.role || req.user?.roles?.[0];
    const stats = await this.workflowsService.getDashboardStats(userId, userRole);
    return {
      data: stats,
      message: 'Dashboard stats retrieved successfully',
    };
  }

  @Get('staff-performance')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async getStaffPerformance() {
    const performance = await this.workflowsService.getStaffPerformance();
    return {
      data: performance,
      message: 'Staff performance retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowsService.findOne(id);
    return {
      data: workflow,
      message: 'Workflow retrieved successfully',
    };
  }

  @Get(':id/statuses')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async getWorkflowStatuses(@Param('id') id: string) {
    const statuses = await this.workflowsService.getWorkflowStatuses(id);
    return {
      data: statuses,
      message: 'Workflow statuses retrieved successfully',
    };
  }

  @Get(':id/status-categorization')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  async getStatusCategorization(@Param('id') id: string) {
    const categorization = await this.workflowsService.getStatusCategorization(id);
    return {
      data: categorization,
      message: 'Status categorization retrieved successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const workflow = await this.workflowsService.update(id, updateWorkflowDto, userId);
    return {
      data: workflow,
      message: 'Workflow updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.workflowsService.remove(id);
    return {
      data: null,
      message: 'Workflow deleted successfully',
    };
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(
    @Param('id') id: string,
    @Body() activateDto?: ActivateWorkflowDto,
  ) {
    const workflow = await this.workflowsService.activate(
      id,
      activateDto?.workingStatuses,
      activateDto?.doneStatuses,
    );
    return {
      data: workflow,
      message: 'Workflow activated successfully',
    };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    const workflow = await this.workflowsService.deactivate(id);
    return {
      data: workflow,
      message: 'Workflow deactivated successfully',
    };
  }

  @Patch(':id/set-default')
  @Roles(UserRole.ADMIN)
  async setAsDefault(@Param('id') id: string) {
    const workflow = await this.workflowsService.setAsDefault(id);
    return {
      data: workflow,
      message: 'Workflow set as default successfully',
    };
  }

  // Transition management and execution endpoints removed - not used by frontend
  // Workflow transitions are managed through the workflow definition itself
}
