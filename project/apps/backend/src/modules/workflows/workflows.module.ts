import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsResolver } from './workflows.resolver';
import { WorkflowExecutionService } from './workflow-execution.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsResolver, WorkflowExecutionService],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule {}
