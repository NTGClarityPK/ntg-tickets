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
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto';
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
    console.log('📝 Creating workflow:', createWorkflowDto);
    console.log('👤 User:', req.user);
    const userId = req.user?.sub || req.user?.id;
    console.log('👤 User ID:', userId);
    try {
      const result = await this.workflowsService.create(createWorkflowDto, userId);
      console.log('✅ Workflow created successfully:', result.id);
      return {
        data: result,
        message: 'Workflow created successfully',
      };
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowsService.findOne(id);
    return {
      data: workflow,
      message: 'Workflow retrieved successfully',
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
  async activate(@Param('id') id: string) {
    const workflow = await this.workflowsService.activate(id);
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

  // Transition management endpoints
  @Post(':workflowId/transitions')
  @Roles(UserRole.ADMIN)
  addTransition(
    @Param('workflowId') workflowId: string,
    @Body() createTransitionDto: CreateWorkflowTransitionDto,
  ) {
    return this.workflowsService.addTransition(workflowId, createTransitionDto);
  }

  @Patch('transitions/:transitionId')
  @Roles(UserRole.ADMIN)
  updateTransition(
    @Param('transitionId') transitionId: string,
    @Body() updateData: Partial<CreateWorkflowTransitionDto>,
  ) {
    return this.workflowsService.updateTransition(transitionId, updateData);
  }

  @Delete('transitions/:transitionId')
  @Roles(UserRole.ADMIN)
  removeTransition(@Param('transitionId') transitionId: string) {
    return this.workflowsService.removeTransition(transitionId);
  }

  // Workflow execution endpoints
  @Get(':workflowId/can-transition')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  canExecuteTransition(
    @Param('workflowId') workflowId: string,
    @Query('fromState') fromState: string,
    @Query('toState') toState: string,
    @Request() req,
  ) {
    return this.workflowsService.canExecuteTransition(
      workflowId,
      fromState,
      toState,
      req.user.roles[0], // Assuming single role for simplicity
    );
  }

  @Post(':workflowId/execute-transition')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  executeTransition(
    @Param('workflowId') workflowId: string,
    @Body() body: {
      ticketId: string;
      fromState: string;
      toState: string;
      comment?: string;
    },
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.workflowsService.executeTransition(
      body.ticketId,
      workflowId,
      body.fromState,
      body.toState,
      userId,
      body.comment,
    );
  }
}
