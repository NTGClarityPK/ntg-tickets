import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsResolver } from './workflows.resolver';
import { WorkflowExecutionService } from './workflow-execution.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsResolver, WorkflowExecutionService],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule {}
