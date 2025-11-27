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
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('tenants')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ===== INVITATION MANAGEMENT (must be before :id routes) =====

  @Get('invitations')
  @Roles('ADMIN')
  getInvitations(
    @Request() req: any,
    @Query('status') status?: 'pending' | 'accepted' | 'expired',
  ) {
    return this.tenantsService.getInvitations(req.user.tenantId, status);
  }

  @Post('invitations')
  @Roles('ADMIN')
  createInvitation(@Request() req: any, @Body() dto: CreateInvitationDto) {
    return this.tenantsService.createInvitation(
      req.user.tenantId,
      req.user.id,
      dto,
    );
  }

  @Get('invitations/validate/:token')
  @Public()
  validateInvitation(@Param('token') token: string) {
    return this.tenantsService.validateInvitation(token);
  }

  @Post('invitations/accept')
  @Public()
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.tenantsService.acceptInvitation(dto);
  }

  @Post('invitations/:id/resend')
  @Roles('ADMIN')
  resendInvitation(@Request() req: any, @Param('id') id: string) {
    return this.tenantsService.resendInvitation(
      req.user.tenantId,
      id,
      req.user.id,
    );
  }

  @Delete('invitations/:id')
  @Roles('ADMIN')
  cancelInvitation(@Request() req: any, @Param('id') id: string) {
    return this.tenantsService.cancelInvitation(req.user.tenantId, id);
  }

  // ===== TENANT MANAGEMENT (parameterized routes last) =====

  @Post()
  @Roles('ADMIN')
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}

