import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsResolver } from './workflows.resolver';
import { WorkflowExecutionService } from './workflow-execution.service';
import { DatabaseModule } from '../../database/database.module';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsResolver, WorkflowExecutionService],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule {}
