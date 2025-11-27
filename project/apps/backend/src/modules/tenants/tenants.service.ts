import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { EmailService } from '../../common/email/email.service';
import { ValidationService } from '../../common/validation/validation.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private emailService: EmailService,
    private validationService: ValidationService,
  ) {}

  // ===== TENANT CRUD =====

  async create(createTenantDto: CreateTenantDto) {
    const slug = createTenantDto.slug || this.generateSlug(createTenantDto.name);

    // Check if slug already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Organization with this slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug,
        domain: createTenantDto.domain,
        plan: createTenantDto.plan || 'FREE',
        maxUsers: createTenantDto.maxUsers || 10,
        isActive: createTenantDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, tickets: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: updateTenantDto.slug },
      });
      if (existing) {
        throw new ConflictException('Organization with this slug already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    // Soft delete by deactivating
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===== INVITATION MANAGEMENT =====

  async createInvitation(tenantId: string, inviterId: string, dto: CreateInvitationDto) {
    // Check if tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user already exists in this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this organization');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: dto.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An active invitation already exists for this email');
    }

    // Create invitation with 30-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = await this.prisma.tenantInvitation.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        roles: dto.roles,
        invitedBy: inviterId,
        expiresAt,
      },
      include: {
        tenant: true,
        inviter: { select: { name: true, email: true } },
      },
    });

    // Send invitation email
    try {
      await this.emailService.sendInvitationEmail({
        to: dto.email,
        inviteeName: dto.name || dto.email,
        organizationName: tenant.name,
        inviterName: invitation.inviter.name,
        roles: dto.roles.map(r => r.toString()),
        inviteLink: `${process.env.FRONTEND_URL}/auth/accept-invite?token=${invitation.token}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to send invitation email:', error);
      // Don't fail the invitation creation if email fails
    }

    return invitation;
  }

  async getInvitations(tenantId: string, status?: 'pending' | 'accepted' | 'expired') {
    this.logger.log(`getInvitations called with tenantId: ${tenantId}, status: ${status}`);
    const now = new Date();
    
    let where: any = { tenantId };

    if (status === 'pending') {
      where.acceptedAt = null;
      where.expiresAt = { gt: now };
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null };
    } else if (status === 'expired') {
      where.acceptedAt = null;
      where.expiresAt = { lte: now };
    }

    const invitations = await this.prisma.tenantInvitation.findMany({
      where,
      include: {
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add computed status to each invitation
    return invitations.map(inv => ({
      ...inv,
      status: inv.acceptedAt
        ? 'accepted'
        : inv.expiresAt <= now
        ? 'expired'
        : 'pending',
    }));
  }

  async validateInvitation(token: string) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { token },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Fetch theme settings for the organization
    const themeSettings = await this.prisma.themeSettings.findFirst({
      where: { tenantId: invitation.tenantId, isActive: true },
      select: { primaryColor: true, logoUrl: true, logoData: true },
    });

    return {
      email: invitation.email,
      name: invitation.name,
      roles: invitation.roles,
      organization: invitation.tenant,
      themeSettings: themeSettings || null,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { token: dto.token },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Validate password
    const passwordValidation = this.validationService.validatePassword(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    // Create user in Supabase Auth
    const supabase = this.supabaseService.getAdminClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        name: dto.name,
        roles: invitation.roles.map(r => r.toString()),
        tenantId: invitation.tenantId,
      },
    });

    if (authError || !supabaseUser) {
      this.logger.error('Error creating Supabase user:', authError);
      throw new BadRequestException(authError?.message || 'Failed to create user account');
    }

    // Create user in database
    try {
      const user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          tenantId: invitation.tenantId,
          email: invitation.email,
          name: dto.name,
          roles: invitation.roles,
          isActive: true,
        },
      });

      // Mark invitation as accepted
      await this.prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
        organization: {
          id: invitation.tenant.id,
          name: invitation.tenant.name,
          slug: invitation.tenant.slug,
        },
      };
    } catch (error) {
      // Rollback Supabase user if database creation fails
      await supabase.auth.admin.deleteUser(supabaseUser.id);
      throw error;
    }
  }

  async resendInvitation(tenantId: string, invitationId: string, inviterId: string) {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    // Create new expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate new token and update expiry
    const updated = await this.prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: {
        token: crypto.randomUUID(),
        expiresAt,
        invitedBy: inviterId,
      },
      include: {
        inviter: { select: { name: true } },
      },
    });

    // Resend email
    try {
      await this.emailService.sendInvitationEmail({
        to: invitation.email,
        inviteeName: invitation.name || invitation.email,
        organizationName: invitation.tenant.name,
        inviterName: updated.inviter.name,
        roles: invitation.roles.map(r => r.toString()),
        inviteLink: `${process.env.FRONTEND_URL}/auth/accept-invite?token=${updated.token}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to resend invitation email:', error);
    }

    return updated;
  }

  async cancelInvitation(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Cannot cancel an accepted invitation');
    }

    await this.prisma.tenantInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation cancelled successfully' };
  }

  // ===== HELPER METHODS =====

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

