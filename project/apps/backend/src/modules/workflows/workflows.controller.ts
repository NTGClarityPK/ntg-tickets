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
  create(@Body() createWorkflowDto: CreateWorkflowDto, @Request() req) {
    return this.workflowsService.create(createWorkflowDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  findAll() {
    return this.workflowsService.findAll();
  }

  @Get('default')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  findDefault() {
    return this.workflowsService.findDefault();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Request() req,
  ) {
    return this.workflowsService.update(id, updateWorkflowDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.workflowsService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.workflowsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.workflowsService.deactivate(id);
  }

  @Patch(':id/set-default')
  @Roles(UserRole.ADMIN)
  setAsDefault(@Param('id') id: string) {
    return this.workflowsService.setAsDefault(id);
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
    return this.workflowsService.executeTransition(
      body.ticketId,
      workflowId,
      body.fromState,
      body.toState,
      req.user.id,
      body.comment,
    );
  }
}
