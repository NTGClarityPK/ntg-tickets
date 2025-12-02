import { Module, forwardRef } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, PrismaService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
