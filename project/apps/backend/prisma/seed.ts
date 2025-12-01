import {
  PrismaClient,
  UserRole,
  TicketPriority,
  TicketImpact,
  TicketCategory,
  WorkflowStatus,
} from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Initialize Supabase client for user creation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Users will be created without Supabase Auth.');
  console.warn('   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper function to create user in Supabase Auth and database
async function createUserWithSupabase(
  tenantId: string,
  email: string,
  password: string,
  name: string,
  roles: UserRole[]
) {
  let supabaseUserId: string | null = null;

  // Create user in Supabase Auth first (if Supabase is configured)
  if (supabase) {
    try {
      // Check if user already exists by listing users and finding by email
      const { data: usersList } = await supabase.auth.admin.listUsers();
      
      let foundUser: { id: string; email?: string } | null = null;
      
      if (usersList?.users && Array.isArray(usersList.users)) {
        foundUser = (usersList.users as Array<{ id: string; email?: string }>).find(
          (u) => u.email === email
        ) || null;
      }

      if (foundUser) {
        console.log(`   ℹ️  User ${email} already exists in Supabase Auth`);
        supabaseUserId = foundUser.id;
      } else {
        // Create user in Supabase Auth
        const {
          data: { user: supabaseUser },
          error: authError,
        } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm for seed users
          user_metadata: {
            name,
            roles: roles.map((r) => r.toString()),
            tenantId,
            seeded: true,
          },
        });

        if (authError || !supabaseUser) {
          console.warn(`   ⚠️  Failed to create ${email} in Supabase Auth: ${authError?.message}`);
          console.warn(`   ⚠️  Creating user in database only (without Supabase Auth)`);
        } else {
          supabaseUserId = supabaseUser.id;
          console.log(`   ✅ Created ${email} in Supabase Auth`);
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Error creating ${email} in Supabase Auth:`, error);
      console.warn(`   ⚠️  Creating user in database only (without Supabase Auth)`);
    }
  }

  // Check if user already exists in database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let user;
  if (existingUser) {
    // Update existing user
    user = await prisma.user.update({
      where: { email },
      data: {
        name,
        roles,
        tenantId,
        isActive: true,
      },
    });

    if (supabaseUserId && supabaseUserId !== existingUser.id) {
      console.warn(`   ⚠️  Warning: User ${email} has different ID in database (${existingUser.id}) vs Supabase (${supabaseUserId})`);
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        id: supabaseUserId || undefined,
        tenantId,
        email,
        name,
        roles,
        isActive: true,
      },
    });
  }

  return user;
}

async function main() {
  console.log('🌱 Starting database seeding for multi-tenant system...');

  // ===== CREATE SAMPLE ORGANIZATIONS =====
  console.log('\n🏢 Creating sample organizations...');

  // Organization 1: NTG Solutions (Primary demo org)
  const ntgTenant = await prisma.tenant.upsert({
    where: { slug: 'ntg-solutions' },
    update: {},
    create: {
      name: 'NTG Solutions',
      slug: 'ntg-solutions',
      plan: 'ENTERPRISE',
      maxUsers: 100,
      isActive: true,
    },
  });
  console.log(`   ✅ Created organization: ${ntgTenant.name}`);

  // Organization 2: Acme Corp (Secondary demo org)
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'PRO',
      maxUsers: 50,
      isActive: true,
    },
  });
  console.log(`   ✅ Created organization: ${acmeTenant.name}`);

  // ===== CREATE USERS FOR NTG SOLUTIONS =====
  console.log('\n👥 Creating users for NTG Solutions...');
  
  const ntgAdmin = await createUserWithSupabase(
    ntgTenant.id,
    'admin@ntg-solutions.com',
    'admin123',
    'Ahmad Muhammad Ali',
    [UserRole.ADMIN]
  );

  const ntgManager = await createUserWithSupabase(
    ntgTenant.id,
    'manager@ntg-solutions.com',
    'manager123',
    'Fatima Abd al-Rahman',
    [UserRole.SUPPORT_MANAGER]
  );

  const ntgSupport1 = await createUserWithSupabase(
    ntgTenant.id,
    'support1@ntg-solutions.com',
    'support123',
    'Muhammad Hassan Ibrahim',
    [UserRole.SUPPORT_STAFF]
  );

  const ntgSupport2 = await createUserWithSupabase(
    ntgTenant.id,
    'support2@ntg-solutions.com',
    'support123',
    'Aisha Ahmad Mahmoud',
    [UserRole.SUPPORT_STAFF]
  );

  const ntgUser1 = await createUserWithSupabase(
    ntgTenant.id,
    'user1@ntg-solutions.com',
    'user123',
    'Maryam Ali Hassan',
    [UserRole.END_USER]
  );

  const ntgUser2 = await createUserWithSupabase(
    ntgTenant.id,
    'user2@ntg-solutions.com',
    'user123',
    'Yusuf Abd al-Aziz',
    [UserRole.END_USER]
  );

  console.log('   ✅ NTG Solutions users created');

  // ===== CREATE USERS FOR ACME CORP =====
  console.log('\n👥 Creating users for Acme Corporation...');

  const acmeAdmin = await createUserWithSupabase(
    acmeTenant.id,
    'admin@acme-corp.com',
    'admin123',
    'John Smith',
    [UserRole.ADMIN]
  );

  const acmeManager = await createUserWithSupabase(
    acmeTenant.id,
    'manager@acme-corp.com',
    'manager123',
    'Sarah Johnson',
    [UserRole.SUPPORT_MANAGER]
  );

  const acmeSupport = await createUserWithSupabase(
    acmeTenant.id,
    'support@acme-corp.com',
    'support123',
    'Mike Wilson',
    [UserRole.SUPPORT_STAFF]
  );

  const acmeUser = await createUserWithSupabase(
    acmeTenant.id,
    'user@acme-corp.com',
    'user123',
    'Emily Davis',
    [UserRole.END_USER]
  );

  console.log('   ✅ Acme Corporation users created');

  // ===== CREATE CATEGORIES FOR NTG SOLUTIONS =====
  console.log('\n📁 Creating categories for NTG Solutions...');

  // Helper to find or create category (since tenantId+name is no longer unique)
  async function findOrCreateCategory(tenantId: string, name: any, description: string, createdBy: string) {
    let category = await prisma.category.findFirst({
      where: { tenantId, name },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { tenantId, name, description, isActive: true, createdBy },
      });
    }
    return category;
  }

  const ntgCategories = await Promise.all([
    findOrCreateCategory(ntgTenant.id, 'HARDWARE', 'Hardware-related issues', ntgAdmin.id),
    findOrCreateCategory(ntgTenant.id, 'SOFTWARE', 'Software-related issues', ntgAdmin.id),
    findOrCreateCategory(ntgTenant.id, 'NETWORK', 'Network-related issues', ntgAdmin.id),
    findOrCreateCategory(ntgTenant.id, 'ACCESS', 'Access and permissions issues', ntgAdmin.id),
    findOrCreateCategory(ntgTenant.id, 'OTHER', 'Other issues', ntgAdmin.id),
  ]);

  const [ntgHardware, ntgSoftware, ntgNetwork, ntgAccess, ntgOther] = ntgCategories;
  console.log('   ✅ NTG Solutions categories created');

  // Create subcategories for NTG Hardware
  const hardwareSubcategories = [
    { name: 'desktop', description: 'Desktop Computer' },
    { name: 'laptop', description: 'Laptop Computer' },
    { name: 'printer', description: 'Printer' },
    { name: 'monitor', description: 'Monitor' },
    { name: 'keyboard', description: 'Keyboard/Mouse' },
  ];

  for (const sub of hardwareSubcategories) {
    await prisma.subcategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: ntgHardware.id } },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        categoryId: ntgHardware.id,
        isActive: true,
        createdBy: ntgAdmin.id,
      },
    });
  }

  // Create subcategories for NTG Software
  const softwareSubcategories = [
    { name: 'operating_system', description: 'Operating System' },
    { name: 'email_client', description: 'Email Client' },
    { name: 'browser', description: 'Web Browser' },
    { name: 'office_suite', description: 'Office Suite' },
    { name: 'other', description: 'Other Software' },
  ];

  for (const sub of softwareSubcategories) {
    await prisma.subcategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: ntgSoftware.id } },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        categoryId: ntgSoftware.id,
        isActive: true,
        createdBy: ntgAdmin.id,
      },
    });
  }

  // Create subcategories for NTG Network
  const networkSubcategories = [
    { name: 'internet', description: 'Internet Connection' },
    { name: 'wifi', description: 'WiFi' },
    { name: 'vpn', description: 'VPN' },
  ];

  for (const sub of networkSubcategories) {
    await prisma.subcategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: ntgNetwork.id } },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        categoryId: ntgNetwork.id,
        isActive: true,
        createdBy: ntgAdmin.id,
      },
    });
  }

  // Create subcategories for NTG Access
  const accessSubcategories = [
    { name: 'password_reset', description: 'Password Reset' },
    { name: 'permissions', description: 'Permissions' },
    { name: 'user_account', description: 'User Account' },
  ];

  for (const sub of accessSubcategories) {
    await prisma.subcategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: ntgAccess.id } },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        categoryId: ntgAccess.id,
        isActive: true,
        createdBy: ntgAdmin.id,
      },
    });
  }

  // Create subcategories for NTG Other
  const otherSubcategories = [
    { name: 'general', description: 'General Issues' },
    { name: 'training', description: 'Training Requests' },
  ];

  for (const sub of otherSubcategories) {
    await prisma.subcategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: ntgOther.id } },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        categoryId: ntgOther.id,
        isActive: true,
        createdBy: ntgAdmin.id,
      },
    });
  }

  console.log('   ✅ NTG Solutions subcategories created');

  // ===== CREATE CATEGORIES FOR ACME CORP =====
  console.log('\n📁 Creating categories for Acme Corporation...');

  const acmeCategories = await Promise.all([
    findOrCreateCategory(acmeTenant.id, 'HARDWARE', 'Hardware issues', acmeAdmin.id),
    findOrCreateCategory(acmeTenant.id, 'SOFTWARE', 'Software issues', acmeAdmin.id),
    findOrCreateCategory(acmeTenant.id, 'OTHER', 'Other issues', acmeAdmin.id),
  ]);

  const [acmeHardware, acmeSoftware, acmeOther] = acmeCategories;

  // Simple subcategories for Acme
  await prisma.subcategory.upsert({
    where: { name_categoryId: { name: 'general', categoryId: acmeHardware.id } },
    update: {},
    create: {
      name: 'general',
      description: 'General Hardware',
      categoryId: acmeHardware.id,
      isActive: true,
      createdBy: acmeAdmin.id,
    },
  });

  await prisma.subcategory.upsert({
    where: { name_categoryId: { name: 'general', categoryId: acmeSoftware.id } },
    update: {},
    create: {
      name: 'general',
      description: 'General Software',
      categoryId: acmeSoftware.id,
      isActive: true,
      createdBy: acmeAdmin.id,
    },
  });

  await prisma.subcategory.upsert({
    where: { name_categoryId: { name: 'general', categoryId: acmeOther.id } },
    update: {},
    create: {
      name: 'general',
      description: 'General Issues',
      categoryId: acmeOther.id,
      isActive: true,
      createdBy: acmeAdmin.id,
    },
  });

  console.log('   ✅ Acme Corporation categories created');

  // ===== CREATE DEFAULT WORKFLOWS =====
  console.log('\n🔄 Creating default workflows...');
    
    const defaultDefinition = {
      nodes: [
      { id: 'create', type: 'statusNode', position: { x: 50, y: 80 }, data: { label: 'Create Ticket', color: '#4caf50', isInitial: true } },
      { id: 'new', type: 'statusNode', position: { x: 280, y: 80 }, data: { label: 'New', color: '#ff9800' } },
      { id: 'open', type: 'statusNode', position: { x: 510, y: 80 }, data: { label: 'Open', color: '#2196f3' } },
      { id: 'in_progress', type: 'statusNode', position: { x: 510, y: 200 }, data: { label: 'In Progress', color: '#ff9800' } },
      { id: 'resolved', type: 'statusNode', position: { x: 740, y: 80 }, data: { label: 'Resolved', color: '#4caf50' } },
      { id: 'closed', type: 'statusNode', position: { x: 970, y: 80 }, data: { label: 'Closed', color: '#9e9e9e' } },
      { id: 'reopened', type: 'statusNode', position: { x: 1100, y: 280 }, data: { label: 'Reopened', color: '#f44336' } },
      { id: 'on_hold', type: 'statusNode', position: { x: 510, y: 320 }, data: { label: 'On Hold', color: '#9e9e9e' } },
      ],
      edges: [
      { id: 'e0-create', source: 'create', target: 'new', label: 'Create Ticket', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['END_USER'], conditions: [], actions: [], isCreateTransition: true } },
      { id: 'e1', source: 'new', target: 'open', label: 'Open', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e2', source: 'open', target: 'in_progress', label: 'Start Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e3', source: 'in_progress', target: 'resolved', label: 'Resolve', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e3-hold', source: 'in_progress', target: 'on_hold', label: 'Put On Hold', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e3-resume', source: 'on_hold', target: 'in_progress', label: 'Resume Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e4', source: 'resolved', target: 'closed', label: 'Close', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e5', source: 'closed', target: 'reopened', label: 'Reopen', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['END_USER', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      { id: 'e6', source: 'reopened', target: 'in_progress', label: 'Resume Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
    ],
  };

  // Create workflow for NTG Solutions
  const ntgWorkflow = await prisma.workflow.upsert({
    where: { id: 'ntg-default-workflow' },
    update: {},
    create: {
      id: 'ntg-default-workflow',
      tenantId: ntgTenant.id,
        name: 'Default Workflow',
      description: 'System default workflow for ticket management.',
      status: WorkflowStatus.ACTIVE,
        isDefault: true,
        isSystemDefault: true,
        isActive: true,
        version: 1,
        definition: defaultDefinition as any,
      createdBy: ntgAdmin.id,
        workingStatuses: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
        doneStatuses: ['CLOSED', 'RESOLVED'],
      },
    });
  console.log(`   ✅ Created workflow for NTG Solutions`);

  // Create workflow for Acme Corp
  const acmeWorkflow = await prisma.workflow.upsert({
    where: { id: 'acme-default-workflow' },
    update: {},
      create: {
      id: 'acme-default-workflow',
      tenantId: acmeTenant.id,
      name: 'Default Workflow',
      description: 'System default workflow for ticket management.',
      status: WorkflowStatus.ACTIVE,
      isDefault: true,
      isSystemDefault: true,
      isActive: true,
      version: 1,
      definition: defaultDefinition as any,
      createdBy: acmeAdmin.id,
      workingStatuses: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
      doneStatuses: ['CLOSED', 'RESOLVED'],
      },
    });
  console.log(`   ✅ Created workflow for Acme Corporation`);

  // ===== CREATE SAMPLE TICKETS FOR NTG SOLUTIONS =====
  console.log('\n🎫 Creating sample tickets for NTG Solutions...');

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Get subcategories
  const laptopSubcat = await prisma.subcategory.findFirst({
    where: { name: 'laptop', categoryId: ntgHardware.id },
  });
  const emailSubcat = await prisma.subcategory.findFirst({
    where: { name: 'email_client', categoryId: ntgSoftware.id },
  });
  const passwordSubcat = await prisma.subcategory.findFirst({
    where: { name: 'password_reset', categoryId: ntgAccess.id },
  });

  const workflowSnapshot = {
    id: ntgWorkflow.id,
    name: ntgWorkflow.name,
    definition: ntgWorkflow.definition,
    workingStatuses: ntgWorkflow.workingStatuses,
    doneStatuses: ntgWorkflow.doneStatuses,
  };

  // Create sample tickets for NTG
  await prisma.ticket.upsert({
    where: { ticketNumber: 'NTG-2024-000001' },
    update: {},
    create: {
      tenantId: ntgTenant.id,
      ticketNumber: 'NTG-2024-000001',
      title: 'Laptop Screen Flickering',
      description: 'My laptop screen keeps flickering. This makes it difficult to work.',
      categoryId: ntgHardware.id,
      subcategoryId: laptopSubcat?.id,
      priority: TicketPriority.MEDIUM,
      status: 'NEW',
      impact: TicketImpact.MODERATE,
      requesterId: ntgUser1.id,
      workflowId: ntgWorkflow.id,
      workflowSnapshot: workflowSnapshot as any,
      workflowVersion: 1,
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      createdAt: oneDayAgo,
      },
    });

  await prisma.ticket.upsert({
    where: { ticketNumber: 'NTG-2024-000002' },
    update: {},
    create: {
      tenantId: ntgTenant.id,
      ticketNumber: 'NTG-2024-000002',
      title: 'Email Not Syncing',
      description: 'Outlook is not syncing emails properly. Missing important messages.',
      categoryId: ntgSoftware.id,
      subcategoryId: emailSubcat?.id,
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      requesterId: ntgUser2.id,
      assignedToId: ntgSupport1.id,
      workflowId: ntgWorkflow.id,
      workflowSnapshot: workflowSnapshot as any,
      workflowVersion: 1,
      dueDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      createdAt: twoDaysAgo,
      },
    });

  await prisma.ticket.upsert({
    where: { ticketNumber: 'NTG-2024-000003' },
    update: {},
    create: {
      tenantId: ntgTenant.id,
      ticketNumber: 'NTG-2024-000003',
      title: 'Password Reset Request',
      description: 'Need to reset my password. Forgot the current one.',
      categoryId: ntgAccess.id,
      subcategoryId: passwordSubcat?.id,
      priority: TicketPriority.LOW,
      status: 'RESOLVED',
      impact: TicketImpact.MINOR,
      requesterId: ntgUser1.id,
      assignedToId: ntgSupport2.id,
      resolution: 'Password reset link sent to user email. User confirmed access restored.',
      workflowId: ntgWorkflow.id,
      workflowSnapshot: workflowSnapshot as any,
      workflowVersion: 1,
      dueDate: new Date(now.getTime() + 168 * 60 * 60 * 1000),
      createdAt: twoDaysAgo,
      closedAt: oneDayAgo,
      },
    });

  console.log('   ✅ NTG Solutions sample tickets created');

  // ===== CREATE SAMPLE TICKETS FOR ACME CORP =====
  console.log('\n🎫 Creating sample tickets for Acme Corporation...');

  const acmeHardwareSubcat = await prisma.subcategory.findFirst({
    where: { name: 'general', categoryId: acmeHardware.id },
  });

  const acmeWorkflowSnapshot = {
    id: acmeWorkflow.id,
    name: acmeWorkflow.name,
    definition: acmeWorkflow.definition,
    workingStatuses: acmeWorkflow.workingStatuses,
    doneStatuses: acmeWorkflow.doneStatuses,
  };

  await prisma.ticket.upsert({
    where: { ticketNumber: 'ACME-2024-000001' },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      ticketNumber: 'ACME-2024-000001',
      title: 'Printer Not Working',
      description: 'The office printer is not responding to print jobs.',
      categoryId: acmeHardware.id,
      subcategoryId: acmeHardwareSubcat?.id,
      priority: TicketPriority.MEDIUM,
      status: 'OPEN',
      impact: TicketImpact.MODERATE,
      requesterId: acmeUser.id,
      assignedToId: acmeSupport.id,
      workflowId: acmeWorkflow.id,
      workflowSnapshot: acmeWorkflowSnapshot as any,
      workflowVersion: 1,
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      createdAt: oneDayAgo,
      },
    });

  console.log('   ✅ Acme Corporation sample tickets created');

  // ===== CREATE SYSTEM SETTINGS FOR EACH TENANT =====
  console.log('\n⚙️  Creating system settings...');

  const defaultSettings = [
    { key: 'site_name', value: 'NTG Ticket' },
    { key: 'timezone', value: 'UTC' },
    { key: 'language', value: 'en' },
    { key: 'auto_assign_tickets', value: 'true' },
    { key: 'auto_close_resolved_tickets', value: 'true' },
    { key: 'auto_close_days', value: '5' },
    { key: 'max_file_size', value: '10485760' },
    { key: 'ticket_number_counter', value: '3' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { tenantId_key: { tenantId: ntgTenant.id, key: setting.key } },
      update: { value: setting.value },
      create: { tenantId: ntgTenant.id, key: setting.key, value: setting.value },
    });
  }

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { tenantId_key: { tenantId: acmeTenant.id, key: setting.key } },
      update: { value: setting.value },
      create: { tenantId: acmeTenant.id, key: setting.key, value: setting.value },
    });
  }

  console.log('   ✅ System settings created for all organizations');

  // ===== CREATE SAMPLE INVITATION (PENDING) =====
  console.log('\n📧 Creating sample invitations...');

  await prisma.tenantInvitation.upsert({
    where: { tenantId_email: { tenantId: ntgTenant.id, email: 'newuser@example.com' } },
    update: {},
    create: {
      tenantId: ntgTenant.id,
      email: 'newuser@example.com',
      name: 'New User',
      roles: [UserRole.END_USER],
      invitedBy: ntgAdmin.id,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

  console.log('   ✅ Sample invitations created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   Organizations: 2 (NTG Solutions, Acme Corporation)');
  console.log('   Users: 10 total (6 in NTG, 4 in Acme)');
  console.log('   Categories: 8 total with subcategories');
  console.log('   Tickets: 4 sample tickets');
  console.log('   Workflows: 2 default workflows');
  console.log('\n🔑 Login Credentials:');
  console.log('   NTG Solutions Admin: admin@ntg-solutions.com / admin123');
  console.log('   Acme Corp Admin: admin@acme-corp.com / admin123');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
