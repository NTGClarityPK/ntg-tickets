import {
  PrismaClient,
  UserRole,
  TicketPriority,
  TicketImpact,
  TicketUrgency,
  TicketCategory,
  CustomFieldType,
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

// Helper function to create user in Supabase Auth and database
async function createUserWithSupabase(
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
    // Note: We can't change the ID if user already exists, but we can update other fields
    user = await prisma.user.update({
      where: { email },
      data: {
        name,
        password: null, // Clear password - Supabase handles it
        roles,
        isActive: true,
      },
    });

    // If Supabase user ID is different, log a warning
    if (supabaseUserId && supabaseUserId !== existingUser.id) {
      console.warn(`   ⚠️  Warning: User ${email} has different ID in database (${existingUser.id}) vs Supabase (${supabaseUserId})`);
      console.warn(`   ⚠️  Keeping existing database ID. Make sure Supabase user ID matches.`);
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        id: supabaseUserId || undefined, // Use Supabase ID if available, otherwise let Prisma generate
        email,
        name,
        password: null, // No password stored - Supabase handles it
        roles,
        isActive: true,
      },
    });
  }

  return user;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create comprehensive user data with multi-role support using Supabase Auth
  console.log('\n👥 Creating users in Supabase Auth and database...');
  
  const admin = await createUserWithSupabase(
    'admin@ntg-ticket.com',
    'admin123',
    'Ahmad Muhammad Ali',
    [UserRole.ADMIN]
  );

  const manager = await createUserWithSupabase(
    'manager@ntg-ticket.com',
    'manager123',
    'Fatima Abd al-Rahman',
    [UserRole.SUPPORT_MANAGER]
  );

  const supportStaff1 = await createUserWithSupabase(
    'support1@ntg-ticket.com',
    'support123',
    'Muhammad Hassan Ibrahim',
    [UserRole.SUPPORT_STAFF]
  );

  const supportStaff2 = await createUserWithSupabase(
    'support2@ntg-ticket.com',
    'support123',
    'Aisha Ahmad Mahmoud',
    [UserRole.SUPPORT_STAFF]
  );

  const supportStaff3 = await createUserWithSupabase(
    'support3@ntg-ticket.com',
    'support123',
    'Khalid Abd Allah al-Saeed',
    [UserRole.SUPPORT_STAFF]
  );

  const supportStaff4 = await createUserWithSupabase(
    'support4@ntg-ticket.com',
    'support123',
    'Nur al-Din Muhammad',
    [UserRole.SUPPORT_STAFF]
  );

  const endUser1 = await createUserWithSupabase(
    'user1@company.com',
    'user123',
    'Maryam Ali Hassan',
    [UserRole.END_USER]
  );

  const endUser2 = await createUserWithSupabase(
    'user2@company.com',
    'user123',
    'Yusuf Abd al-Aziz',
    [UserRole.END_USER]
  );

  const endUser3 = await createUserWithSupabase(
    'user3@company.com',
    'user123',
    'Zaynab Muhammad Abd al-Rahman',
    [UserRole.END_USER]
  );

  const endUser4 = await createUserWithSupabase(
    'user4@company.com',
    'user123',
    'Umar Ahmad al-Sharif',
    [UserRole.END_USER]
  );

  const endUser5 = await createUserWithSupabase(
    'user5@company.com',
    'user123',
    'Sara Mahmoud Ibrahim',
    [UserRole.END_USER]
  );

  const endUser6 = await createUserWithSupabase(
    'user6@company.com',
    'user123',
    'Tariq Muhammad Ali',
    [UserRole.END_USER]
  );

  // Create multi-role users with Arabic/Egyptian names
  const multiRoleUser1 = await createUserWithSupabase(
    'ahmed@company.com',
    'user123',
    'Ahmed Hassan al-Masri',
    [UserRole.END_USER, UserRole.SUPPORT_STAFF]
  );

  const multiRoleUser2 = await createUserWithSupabase(
    'nour@company.com',
    'user123',
    'Nour al-Din Abd al-Malik',
    [UserRole.SUPPORT_STAFF, UserRole.SUPPORT_MANAGER]
  );

  const multiRoleUser3 = await createUserWithSupabase(
    'layla@company.com',
    'user123',
    'Layla Muhammad al-Zahra',
    [UserRole.ADMIN, UserRole.SUPPORT_MANAGER]
  );

  const multiRoleUser4 = await createUserWithSupabase(
    'omar@company.com',
    'user123',
    'Omar Abd al-Rahman al-Farouk',
    [UserRole.END_USER, UserRole.SUPPORT_STAFF, UserRole.SUPPORT_MANAGER]
  );

  const multiRoleUser5 = await createUserWithSupabase(
    'fatima@company.com',
    'user123',
    'Fatima Zahra al-Batoul',
    [UserRole.END_USER, UserRole.ADMIN]
  );

  console.log('\n✅ Users created in Supabase Auth and database');
  
  if (!supabase) {
    console.log('\n⚠️  WARNING: Supabase not configured. Users were created in database only.');
    console.log('   To enable Supabase Auth, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  // Create categories
  let hardwareCategory = await prisma.category.findFirst({
    where: { name: 'HARDWARE' },
  });
  
  if (!hardwareCategory) {
    hardwareCategory = await prisma.category.create({
      data: {
        name: 'HARDWARE',
        description: 'Hardware-related issues',
        isActive: true,
        createdBy: admin.id,
      },
    });
  }

  let softwareCategory = await prisma.category.findFirst({
    where: { name: 'SOFTWARE' },
  });
  
  if (!softwareCategory) {
    softwareCategory = await prisma.category.create({
      data: {
        name: 'SOFTWARE',
        description: 'Software-related issues',
        isActive: true,
        createdBy: admin.id,
      },
    });
  }

  let networkCategory = await prisma.category.findFirst({
    where: { name: 'NETWORK' },
  });
  
  if (!networkCategory) {
    networkCategory = await prisma.category.create({
      data: {
        name: 'NETWORK',
        description: 'Network-related issues',
        isActive: true,
        createdBy: admin.id,
      },
    });
  }

  let accessCategory = await prisma.category.findFirst({
    where: { name: 'ACCESS' },
  });
  
  if (!accessCategory) {
    accessCategory = await prisma.category.create({
      data: {
        name: 'ACCESS',
        description: 'Access and permissions issues',
        isActive: true,
        createdBy: admin.id,
      },
    });
  }

  let otherCategory = await prisma.category.findFirst({
    where: { name: 'OTHER' },
  });
  
  if (!otherCategory) {
    otherCategory = await prisma.category.create({
      data: {
        name: 'OTHER',
        description: 'Other issues',
        isActive: true,
        createdBy: admin.id,
      },
    });
  }

  // Create subcategories for OTHER category
  const otherSubcategories = [
    { name: 'general', description: 'General Issues' },
    { name: 'training', description: 'Training Requests' },
    { name: 'other', description: 'Other' },
  ];

  for (const sub of otherSubcategories) {
    await prisma.subcategory.upsert({
      where: {
        name_categoryId: {
          name: sub.name,
          categoryId: otherCategory.id,
        },
      },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        category: {
          connect: { id: otherCategory.id },
        },
        isActive: true,
        creator: {
          connect: { id: admin.id },
        },
      },
    });
  }

  console.log('✅ Categories created');

  // Create subcategories
  const hardwareSubcategories = [
    { name: 'desktop', description: 'Desktop Computer' },
    { name: 'laptop', description: 'Laptop Computer' },
    { name: 'printer', description: 'Printer' },
    { name: 'monitor', description: 'Monitor' },
    { name: 'keyboard', description: 'Keyboard/Mouse' },
    { name: 'other', description: 'Other Hardware' },
  ];

  for (const sub of hardwareSubcategories) {
    await prisma.subcategory.upsert({
      where: {
        name_categoryId: {
          name: sub.name,
          categoryId: hardwareCategory.id,
        },
      },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        category: {
          connect: { id: hardwareCategory.id },
        },
        isActive: true,
        creator: {
          connect: { id: admin.id },
        },
      },
    });
  }

  const softwareSubcategories = [
    { name: 'operating_system', description: 'Operating System' },
    { name: 'email_client', description: 'Email Client' },
    { name: 'browser', description: 'Web Browser' },
    { name: 'office_suite', description: 'Office Suite' },
    { name: 'antivirus', description: 'Antivirus' },
    { name: 'other', description: 'Other Software' },
  ];

  for (const sub of softwareSubcategories) {
    await prisma.subcategory.upsert({
      where: {
        name_categoryId: {
          name: sub.name,
          categoryId: softwareCategory.id,
        },
      },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        category: {
          connect: { id: softwareCategory.id },
        },
        isActive: true,
        creator: {
          connect: { id: admin.id },
        },
      },
    });
  }

  const networkSubcategories = [
    { name: 'internet', description: 'Internet Connection' },
    { name: 'wifi', description: 'WiFi' },
    { name: 'vpn', description: 'VPN' },
    { name: 'email_server', description: 'Email Server' },
    { name: 'file_server', description: 'File Server' },
    { name: 'other', description: 'Other Network' },
  ];

  for (const sub of networkSubcategories) {
    await prisma.subcategory.upsert({
      where: {
        name_categoryId: {
          name: sub.name,
          categoryId: networkCategory.id,
        },
      },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        category: {
          connect: { id: networkCategory.id },
        },
        isActive: true,
        creator: {
          connect: { id: admin.id },
        },
      },
    });
  }

  const accessSubcategories = [
    { name: 'user_account', description: 'User Account' },
    { name: 'password_reset', description: 'Password Reset' },
    { name: 'permissions', description: 'Permissions' },
    { name: 'application_access', description: 'Application Access' },
    { name: 'other', description: 'Other Access' },
  ];

  for (const sub of accessSubcategories) {
    await prisma.subcategory.upsert({
      where: {
        name_categoryId: {
          name: sub.name,
          categoryId: accessCategory.id,
        },
      },
      update: {},
      create: {
        name: sub.name,
        description: sub.description,
        category: {
          connect: { id: accessCategory.id },
        },
        isActive: true,
        creator: {
          connect: { id: admin.id },
        },
      },
    });
  }

  console.log('✅ Subcategories created');

  // Custom fields are now managed through the admin panel
  // No default custom fields are created - administrators can add them as needed
  console.log('✅ Custom fields system ready (no default fields)');

  // Create comprehensive ticket data covering all scenarios
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Helper function to calculate due date based on priority and creation time
  function calculateDueDate(priority: TicketPriority, createdAt: Date): Date {
    let hoursToAdd: number;
    switch (priority) {
      case TicketPriority.CRITICAL:
        hoursToAdd = 4; // 4 hours
        break;
      case TicketPriority.HIGH:
        hoursToAdd = 8; // 8 hours
        break;
      case TicketPriority.MEDIUM:
        hoursToAdd = 48; // 2 days
        break;
      case TicketPriority.LOW:
      default:
        hoursToAdd = 168; // 7 days
        break;
    }
    return new Date(createdAt.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  const tickets = [
    // OVERDUE TICKETS (SLA BREACHED)
    {
      ticketNumber: 'TKT-2024-000001',
      title: 'Critical Database Server Down - OVERDUE',
      description:
        'The main database server has been down for 3 days. All users are unable to access the system. This is a critical business impact.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.CRITICAL,
      status: 'OPEN',
      impact: TicketImpact.CRITICAL,
      urgency: TicketUrgency.IMMEDIATE,
      requesterId: manager.id,
      assignedToId: supportStaff1.id,
      dueDate: threeDaysAgo, // Overdue by 3 days
      createdAt: oneWeekAgo,
    },
    {
      ticketNumber: 'TKT-2024-000002',
      title: 'Email Server Outage - SLA BREACHED',
      description:
        'Email server has been down for 2 days. Users cannot send or receive emails. Business operations are severely impacted.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'email_client',
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: endUser1.id,
      assignedToId: supportStaff2.id,
      dueDate: twoDaysAgo, // Overdue by 2 days
      createdAt: new Date('2025-10-01T10:00:00Z'), // Changed from Sep 24, 2025 to Oct 1, 2025
    },
    {
      ticketNumber: 'TKT-2024-000003',
      title: 'Network Infrastructure Failure - OVERDUE',
      description:
        'Core network switch has failed. Multiple departments are without internet connectivity.',
      category: TicketCategory.NETWORK,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'OPEN',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: admin.id,
      assignedToId: supportStaff3.id,
      dueDate: oneDayAgo, // Overdue by 1 day
      createdAt: twoWeeksAgo,
    },

    // TICKETS APPROACHING SLA DEADLINE
    {
      ticketNumber: 'TKT-2024-000004',
      title: 'Printer Network Issues - SLA WARNING',
      description:
        'Network printers are intermittently failing. Users are experiencing print job failures.',
      category: TicketCategory.HARDWARE,
      subcategory: 'printer',
      priority: TicketPriority.MEDIUM,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser2.id,
      assignedToId: supportStaff4.id,
      dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Due in 2 hours
      createdAt: oneDayAgo,
    },
    {
      ticketNumber: 'TKT-2024-000005',
      title: 'VPN Connection Problems - APPROACHING DEADLINE',
      description:
        'Remote users cannot connect to VPN. This affects work-from-home employees.',
      category: TicketCategory.NETWORK,
      subcategory: 'vpn',
      priority: TicketPriority.MEDIUM,
      status: 'OPEN',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser3.id,
      assignedToId: supportStaff1.id,
      dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Due in 4 hours
      createdAt: oneDayAgo,
    },

    // NEW TICKETS (RECENTLY CREATED)
    {
      ticketNumber: 'TKT-2024-000006',
      title: 'Laptop Screen Flickering',
      description:
        'My laptop screen keeps flickering and sometimes goes black. This makes it difficult to work.',
      category: TicketCategory.HARDWARE,
      subcategory: 'laptop',
      priority: TicketPriority.MEDIUM,
      status: 'NEW',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser4.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      dueDate: calculateDueDate(
        TicketPriority.MEDIUM,
        new Date(now.getTime() - 2 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000007',
      title: 'Software License Renewal',
      description:
        'Need to renew Microsoft Office licenses for the entire department. Current licenses expire next week.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'office_suite',
      priority: TicketPriority.HIGH,
      status: 'NEW',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: manager.id,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      dueDate: calculateDueDate(
        TicketPriority.HIGH,
        new Date(now.getTime() - 1 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000008',
      title: 'WiFi Password Reset',
      description:
        'Need to reset the WiFi password for the guest network. Current password has been compromised.',
      category: TicketCategory.NETWORK,
      subcategory: 'wifi',
      priority: TicketPriority.LOW,
      status: 'NEW',
      impact: TicketImpact.MINOR,
      urgency: TicketUrgency.LOW,
      requesterId: endUser5.id,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      dueDate: calculateDueDate(
        TicketPriority.LOW,
        new Date(now.getTime() - 30 * 60 * 1000)
      ),
    },

    // IN PROGRESS TICKETS
    {
      ticketNumber: 'TKT-2024-000009',
      title: 'Server Performance Issues',
      description:
        'File server is running slowly. Users are experiencing delays when accessing shared files.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: endUser6.id,
      assignedToId: supportStaff2.id,
      createdAt: twoDaysAgo,
      dueDate: calculateDueDate(TicketPriority.HIGH, twoDaysAgo),
    },
    {
      ticketNumber: 'TKT-2024-000010',
      title: 'Keyboard Replacement Needed',
      description:
        'Office keyboard has several keys that are not working properly. Need replacement.',
      category: TicketCategory.HARDWARE,
      subcategory: 'keyboard',
      priority: TicketPriority.LOW,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MINOR,
      urgency: TicketUrgency.LOW,
      requesterId: endUser1.id,
      assignedToId: supportStaff3.id,
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneDayAgo),
    },

    // ON HOLD TICKETS
    {
      ticketNumber: 'TKT-2024-000011',
      title: 'Software Upgrade Project',
      description:
        'Planning to upgrade all workstations to Windows 11. Waiting for management approval and budget allocation.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'operating_system',
      priority: TicketPriority.MEDIUM,
      status: 'ON_HOLD',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: admin.id,
      assignedToId: supportStaff1.id,
      createdAt: oneWeekAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneWeekAgo),
    },
    {
      ticketNumber: 'TKT-2024-000012',
      title: 'New Server Installation',
      description:
        'Install new backup server. Currently waiting for hardware delivery and data center approval.',
      category: TicketCategory.HARDWARE,
      subcategory: 'other',
      priority: TicketPriority.MEDIUM,
      status: 'ON_HOLD',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: manager.id,
      assignedToId: supportStaff4.id,
      createdAt: twoWeeksAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, twoWeeksAgo),
    },

    // RESOLVED TICKETS
    {
      ticketNumber: 'TKT-2024-000013',
      title: 'Password Reset Request',
      description:
        'User forgot password and needs reset to access their account.',
      category: TicketCategory.ACCESS,
      subcategory: 'password_reset',
      priority: TicketPriority.LOW,
      status: 'RESOLVED',
      impact: TicketImpact.MINOR,
      urgency: TicketUrgency.LOW,
      requesterId: endUser2.id,
      assignedToId: supportStaff1.id,
      resolution:
        'Password reset link sent to user email. User has successfully reset their password and can now access their account.',
      createdAt: oneDayAgo,
      closedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneDayAgo),
    },
    {
      ticketNumber: 'TKT-2024-000014',
      title: 'Monitor Display Issues',
      description:
        'Monitor screen was showing distorted colors and flickering. User reported this issue.',
      category: TicketCategory.HARDWARE,
      subcategory: 'monitor',
      priority: TicketPriority.MEDIUM,
      status: 'RESOLVED',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser3.id,
      assignedToId: supportStaff2.id,
      resolution:
        'Replaced monitor cable and updated display drivers. Monitor is now working properly.',
      createdAt: twoDaysAgo,
      closedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      dueDate: calculateDueDate(TicketPriority.MEDIUM, twoDaysAgo),
    },

    // CLOSED TICKETS
    {
      ticketNumber: 'TKT-2024-000015',
      title: 'Office Suite Installation',
      description:
        'Need to install Microsoft Office on new workstation for new employee.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'office_suite',
      priority: TicketPriority.MEDIUM,
      status: 'CLOSED',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser4.id,
      assignedToId: supportStaff3.id,
      resolution:
        'Microsoft Office 365 installed successfully. User has been provided with login credentials and training materials.',
      createdAt: oneWeekAgo,
      closedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneWeekAgo),
    },
    {
      ticketNumber: 'TKT-2024-000016',
      title: 'Internet Connectivity Issues',
      description:
        'Intermittent internet connectivity issues in the marketing department.',
      category: TicketCategory.NETWORK,
      subcategory: 'internet',
      priority: TicketPriority.MEDIUM,
      status: 'CLOSED',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser5.id,
      assignedToId: supportStaff4.id,
      resolution:
        'Replaced faulty network switch in marketing department. Internet connectivity is now stable.',
      createdAt: twoWeeksAgo,
      closedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: calculateDueDate(TicketPriority.MEDIUM, twoWeeksAgo),
    },

    // REOPENED TICKETS
    {
      ticketNumber: 'TKT-2024-000017',
      title: 'Email Client Configuration - REOPENED',
      description:
        'Email client was not syncing properly. Issue was supposedly resolved but has returned.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'email_client',
      priority: TicketPriority.MEDIUM,
      status: 'REOPENED',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser6.id,
      assignedToId: supportStaff1.id,
      createdAt: oneMonthAgo,
      closedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Was closed 3 days ago
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneMonthAgo),
    },

    // TICKETS ASSIGNED TO DIFFERENT USERS
    {
      ticketNumber: 'TKT-2024-000018',
      title: 'Security Audit Request',
      description:
        'Need to conduct security audit of all user accounts and permissions.',
      category: TicketCategory.ACCESS,
      subcategory: 'permissions',
      priority: TicketPriority.HIGH,
      status: 'OPEN',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: admin.id,
      assignedToId: manager.id, // Assigned to manager
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.HIGH, oneDayAgo),
    },
    {
      ticketNumber: 'TKT-2024-000019',
      title: 'System Backup Verification',
      description:
        'Verify that all system backups are working correctly and data is being backed up properly.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: manager.id,
      assignedToId: admin.id, // Assigned to admin
      createdAt: twoDaysAgo,
      dueDate: calculateDueDate(TicketPriority.HIGH, twoDaysAgo),
    },
    {
      ticketNumber: 'TKT-2024-000020',
      title: 'User Training Session',
      description:
        'Conduct training session for new employees on IT policies and procedures.',
      category: TicketCategory.OTHER,
      subcategory: 'training',
      priority: TicketPriority.MEDIUM,
      status: 'OPEN',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser1.id,
      assignedToId: supportStaff2.id,
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneDayAgo),
    },

    // ADDITIONAL SCENARIOS
    {
      ticketNumber: 'TKT-2024-000021',
      title: 'Antivirus Update Issues',
      description:
        'Antivirus software is not updating automatically. Some workstations are showing outdated virus definitions.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'antivirus',
      priority: TicketPriority.HIGH,
      status: 'OPEN',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: endUser2.id,
      assignedToId: supportStaff3.id,
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.HIGH, oneDayAgo),
    },
    {
      ticketNumber: 'TKT-2024-000022',
      title: 'File Server Access Denied',
      description:
        'Users in the finance department cannot access shared folders on the file server.',
      category: TicketCategory.ACCESS,
      subcategory: 'permissions',
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: endUser3.id,
      assignedToId: supportStaff4.id,
      createdAt: twoDaysAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, twoDaysAgo),
    },
    {
      ticketNumber: 'TKT-2024-000023',
      title: 'Browser Compatibility Issues',
      description:
        'Company web application is not working properly in the latest version of Chrome browser.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'browser',
      priority: TicketPriority.MEDIUM,
      status: 'NEW',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser4.id,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      dueDate: calculateDueDate(
        TicketPriority.MEDIUM,
        new Date(now.getTime() - 3 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000024',
      title: 'Mobile Device Setup',
      description:
        'Need to configure company email and security policies on new employee mobile device.',
      category: TicketCategory.ACCESS,
      subcategory: 'application_access',
      priority: TicketPriority.MEDIUM,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser5.id,
      assignedToId: supportStaff1.id,
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneDayAgo),
    },
    {
      ticketNumber: 'TKT-2024-000025',
      title: 'Conference Room AV System',
      description:
        'Audio-visual system in conference room is not working. Cannot display presentations or make video calls.',
      category: TicketCategory.HARDWARE,
      subcategory: 'other',
      priority: TicketPriority.MEDIUM,
      status: 'OPEN',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: endUser6.id,
      assignedToId: supportStaff2.id,
      createdAt: oneDayAgo,
      dueDate: calculateDueDate(TicketPriority.MEDIUM, oneDayAgo),
    },

    // ADMIN-SPECIFIC TICKETS
    {
      ticketNumber: 'TKT-2024-000026',
      title: 'System Security Audit - ADMIN ASSIGNED',
      description:
        'Comprehensive security audit of all systems, user accounts, and access permissions. This is a high-priority administrative task.',
      category: TicketCategory.ACCESS,
      subcategory: 'permissions',
      priority: TicketPriority.CRITICAL,
      status: 'IN_PROGRESS',
      impact: TicketImpact.CRITICAL,
      urgency: TicketUrgency.IMMEDIATE,
      requesterId: manager.id,
      assignedToId: admin.id,
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due in 1 day
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      ticketNumber: 'TKT-2024-000027',
      title: 'Database Backup Verification - ADMIN TASK',
      description:
        'Verify all database backups are working correctly and test restore procedures. Critical for business continuity.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'OPEN',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: manager.id,
      assignedToId: admin.id,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      ticketNumber: 'TKT-2024-000028',
      title: 'User Account Cleanup - ADMIN MAINTENANCE',
      description:
        'Review and clean up inactive user accounts, update permissions, and ensure compliance with security policies.',
      category: TicketCategory.ACCESS,
      subcategory: 'user_account',
      priority: TicketPriority.MEDIUM,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: admin.id,
      assignedToId: admin.id,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      dueDate: calculateDueDate(
        TicketPriority.MEDIUM,
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000029',
      title: 'System Performance Monitoring Setup - ADMIN PROJECT',
      description:
        'Implement comprehensive system monitoring and alerting for all critical infrastructure components.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'ON_HOLD',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: admin.id,
      assignedToId: admin.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: calculateDueDate(
        TicketPriority.HIGH,
        new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000030',
      title: 'Disaster Recovery Plan Review - ADMIN CRITICAL',
      description:
        'Review and update disaster recovery procedures, test backup systems, and ensure business continuity plans are current.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.CRITICAL,
      status: 'OPEN',
      impact: TicketImpact.CRITICAL,
      urgency: TicketUrgency.IMMEDIATE,
      requesterId: admin.id,
      assignedToId: admin.id,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      ticketNumber: 'TKT-2024-000031',
      title: 'Network Security Assessment - ADMIN SECURITY',
      description:
        'Conduct comprehensive network security assessment, identify vulnerabilities, and implement security improvements.',
      category: TicketCategory.NETWORK,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'IN_PROGRESS',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: manager.id,
      assignedToId: admin.id,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      dueDate: calculateDueDate(
        TicketPriority.HIGH,
        new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000032',
      title: 'Software License Audit - ADMIN COMPLIANCE',
      description:
        'Audit all software licenses, ensure compliance, and identify any unauthorized software installations.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.MEDIUM,
      status: 'RESOLVED',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: admin.id,
      assignedToId: admin.id,
      resolution:
        'License audit completed. All software is properly licensed. Compliance report generated and filed.',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      closedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: calculateDueDate(
        TicketPriority.MEDIUM,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000033',
      title: 'IT Policy Documentation Update - ADMIN TASK',
      description:
        'Update IT policies and procedures documentation to reflect current best practices and regulatory requirements.',
      category: TicketCategory.OTHER,
      subcategory: 'general',
      priority: TicketPriority.MEDIUM,
      status: 'OPEN',
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      requesterId: admin.id,
      assignedToId: admin.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: calculateDueDate(
        TicketPriority.MEDIUM,
        new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000034',
      title: 'Server Hardware Upgrade Planning - ADMIN PROJECT',
      description:
        'Plan and coordinate server hardware upgrades for improved performance and reliability.',
      category: TicketCategory.HARDWARE,
      subcategory: 'other',
      priority: TicketPriority.HIGH,
      status: 'ON_HOLD',
      impact: TicketImpact.MAJOR,
      urgency: TicketUrgency.HIGH,
      requesterId: admin.id,
      assignedToId: admin.id,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: calculateDueDate(
        TicketPriority.HIGH,
        new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      ticketNumber: 'TKT-2024-000035',
      title: 'Emergency System Maintenance - ADMIN URGENT',
      description:
        'Emergency maintenance required for critical system components. This requires immediate attention.',
      category: TicketCategory.SOFTWARE,
      subcategory: 'other',
      priority: TicketPriority.CRITICAL,
      status: 'IN_PROGRESS',
      impact: TicketImpact.CRITICAL,
      urgency: TicketUrgency.IMMEDIATE,
      requesterId: manager.id,
      assignedToId: admin.id,
      dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Due in 4 hours
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  ];

  // Get or create default workflow BEFORE creating tickets
  console.log('🔍 Checking for default workflow...');
  let defaultWorkflow = await prisma.workflow.findFirst({
    where: { isSystemDefault: true },
  });

  if (!defaultWorkflow) {
    // Create default workflow if it doesn't exist
    console.log('📝 Creating system default workflow...');
    
    const defaultDefinition = {
      nodes: [
        {
          id: 'create',
          type: 'statusNode',
          position: { x: 50, y: 80 },
          data: { label: 'Create Ticket', color: '#4caf50', isInitial: true },
        },
        {
          id: 'new',
          type: 'statusNode',
          position: { x: 280, y: 80 },
          data: { label: 'New', color: '#ff9800' },
        },
        {
          id: 'open',
          type: 'statusNode',
          position: { x: 510, y: 80 },
          data: { label: 'Open', color: '#2196f3' },
        },
        {
          id: 'in_progress',
          type: 'statusNode',
          position: { x: 510, y: 200 },
          data: { label: 'In Progress', color: '#ff9800' },
        },
        {
          id: 'resolved',
          type: 'statusNode',
          position: { x: 740, y: 80 },
          data: { label: 'Resolved', color: '#4caf50' },
        },
        {
          id: 'closed',
          type: 'statusNode',
          position: { x: 970, y: 80 },
          data: { label: 'Closed', color: '#9e9e9e' },
        },
        {
          id: 'reopened',
          type: 'statusNode',
          position: { x: 1100, y: 280 },
          data: { label: 'Reopened', color: '#f44336' },
        },
        {
          id: 'on_hold',
          type: 'statusNode',
          position: { x: 510, y: 320 },
          data: { label: 'On Hold', color: '#9e9e9e' },
        },
      ],
      edges: [
        {
          id: 'e0-create',
          source: 'create',
          target: 'new',
          label: 'Create Ticket',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['END_USER'],
            conditions: [],
            actions: [],
            isCreateTransition: true,
          },
        },
        {
          id: 'e1',
          source: 'new',
          target: 'open',
          label: 'Open',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e2',
          source: 'open',
          target: 'in_progress',
          label: 'Start Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3',
          source: 'in_progress',
          target: 'resolved',
          label: 'Resolve',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3-hold',
          source: 'in_progress',
          target: 'on_hold',
          label: 'Put On Hold',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3-resume',
          source: 'on_hold',
          target: 'in_progress',
          label: 'Resume Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e4',
          source: 'resolved',
          target: 'closed',
          label: 'Close',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e5',
          source: 'closed',
          target: 'reopened',
          label: 'Reopen',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['END_USER', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e6',
          source: 'reopened',
          target: 'in_progress',
          label: 'Resume Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
      ],
    };
    
    defaultWorkflow = await prisma.workflow.create({
      data: {
        name: 'Default Workflow',
        description: 'System default workflow for ticket management. This workflow cannot be edited or deleted.',
        status: 'ACTIVE',
        isDefault: true,
        isSystemDefault: true,
        isActive: true,
        version: 1,
        definition: defaultDefinition as any,
        createdBy: admin.id,
        workingStatuses: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
        doneStatuses: ['CLOSED', 'RESOLVED'],
      },
    });
    
    console.log('✅ Successfully created system default workflow!');
    console.log(`   ID: ${defaultWorkflow.id}`);
  } else {
    console.log(`✅ System default workflow already exists: "${defaultWorkflow.name}" (ID: ${defaultWorkflow.id})`);
  }

  for (const ticketData of tickets) {
    // Find the category and subcategory
    const category = await prisma.category.findFirst({
      where: { name: ticketData.category },
    });

    if (!category) {
      console.error(
        `Category not found for ticket ${ticketData.ticketNumber}: ${ticketData.category}`
      );
      continue;
    }

    const subcategory = await prisma.subcategory.findFirst({
      where: {
        name: ticketData.subcategory,
        categoryId: category.id,
      },
    });

    if (!subcategory) {
      console.error(
        `Subcategory not found for ticket ${ticketData.ticketNumber}: ${ticketData.subcategory} in category ${category.name}`
      );
      continue;
    }

    // Create workflow snapshot for this ticket
    const workflowSnapshot = {
      id: defaultWorkflow.id,
      name: defaultWorkflow.name,
      description: defaultWorkflow.description,
      status: defaultWorkflow.status,
      isActive: defaultWorkflow.isActive,
      isDefault: defaultWorkflow.isDefault,
      isSystemDefault: defaultWorkflow.isSystemDefault,
      version: defaultWorkflow.version,
      definition: defaultWorkflow.definition,
      workingStatuses: defaultWorkflow.workingStatuses,
      doneStatuses: defaultWorkflow.doneStatuses,
    };

    await prisma.ticket.upsert({
      where: { ticketNumber: ticketData.ticketNumber },
      update: {
        workflow: {
          connect: { id: defaultWorkflow.id },
        },
        // Update snapshot if workflow changed
        workflowSnapshot: workflowSnapshot as any,
        workflowVersion: defaultWorkflow.version,
      },
      create: {
        ticketNumber: ticketData.ticketNumber,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: ticketData.status,
        impact: ticketData.impact,
        urgency: ticketData.urgency,
        dueDate: ticketData.dueDate,
        resolution: ticketData.resolution,
        closedAt: ticketData.closedAt,
        createdAt: ticketData.createdAt,
        workflow: {
          connect: { id: defaultWorkflow.id },
        },
        workflowSnapshot: workflowSnapshot as any, // Store snapshot at creation time
        workflowVersion: defaultWorkflow.version,
        requester: {
          connect: { id: ticketData.requesterId },
        },
        assignedTo: ticketData.assignedToId
          ? {
              connect: { id: ticketData.assignedToId },
            }
          : undefined,
        category: {
          connect: { id: category.id },
        },
        subcategory: {
          connect: { id: subcategory.id },
        },
      },
    });
  }


  // Create comprehensive comments and ticket history
  const overdueTicket1 = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000001' },
  });
  const overdueTicket2 = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000002' },
  });
  const slaWarningTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000004' },
  });
  const inProgressTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000009' },
  });
  const resolvedTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000013' },
  });
  const reopenedTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000017' },
  });

  // Comments for overdue ticket (Critical Database Server Down)
  if (overdueTicket1) {
    await prisma.comment.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: supportStaff1.id,
        content:
          'Initial assessment: Database server is completely unresponsive. Checking hardware status.',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: supportStaff1.id,
        content:
          'Hardware check complete. Server appears to have failed. Need to contact vendor for replacement.',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: manager.id,
        content:
          'This is a critical business impact. All operations are halted. Please escalate to vendor immediately.',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: supportStaff1.id,
        content:
          'Vendor contacted. Replacement server ordered but delivery is delayed due to supply chain issues.',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    });

    // Ticket history for overdue ticket
    await prisma.ticketHistory.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: supportStaff1.id,
        fieldName: 'status',
        oldValue: 'NEW',
        newValue: 'OPEN',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: overdueTicket1.id,
        userId: supportStaff1.id,
        fieldName: 'priority',
        oldValue: 'HIGH',
        newValue: 'CRITICAL',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Comments for SLA breached ticket (Email Server Outage)
  if (overdueTicket2) {
    await prisma.comment.create({
      data: {
        ticketId: overdueTicket2.id,
        userId: supportStaff2.id,
        content:
          'Email server diagnostics show multiple service failures. Investigating root cause.',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket2.id,
        userId: endUser1.id,
        content:
          'This is severely impacting our business communications. When can we expect resolution?',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket2.id,
        userId: supportStaff2.id,
        content:
          'Found corrupted email database. Attempting recovery from backup.',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: overdueTicket2.id,
        userId: supportStaff2.id,
        content:
          'Backup recovery in progress. Estimated completion time: 8-12 hours.',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Comments for SLA warning ticket
  if (slaWarningTicket) {
    await prisma.comment.create({
      data: {
        ticketId: slaWarningTicket.id,
        userId: supportStaff4.id,
        content:
          'Investigating printer network connectivity issues. Checking network configuration.',
        createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000), // 20 hours ago
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: slaWarningTicket.id,
        userId: endUser2.id,
        content:
          'Print jobs are still failing intermittently. This is affecting our daily operations.',
        createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10 hours ago
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: slaWarningTicket.id,
        userId: supportStaff4.id,
        content:
          'Found network switch configuration issue. Updating settings now.',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    });
  }

  // Comments for in-progress ticket
  if (inProgressTicket) {
    await prisma.comment.create({
      data: {
        ticketId: inProgressTicket.id,
        userId: supportStaff2.id,
        content:
          'Server performance analysis shows high CPU usage. Investigating running processes.',
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: inProgressTicket.id,
        userId: endUser6.id,
        content:
          'File access is still slow. Users are complaining about the delays.',
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: inProgressTicket.id,
        userId: supportStaff2.id,
        content:
          'Identified memory leak in file indexing service. Restarting service and monitoring.',
      },
    });
  }

  // Comments for resolved ticket
  if (resolvedTicket) {
    await prisma.comment.create({
      data: {
        ticketId: resolvedTicket.id,
        userId: supportStaff1.id,
        content: 'Password reset link sent to user email address.',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: resolvedTicket.id,
        userId: endUser2.id,
        content: 'Thank you! I was able to reset my password successfully.',
        createdAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
      },
    });
  }

  // Comments for reopened ticket
  if (reopenedTicket) {
    await prisma.comment.create({
      data: {
        ticketId: reopenedTicket.id,
        userId: endUser6.id,
        content:
          'The email sync issue has returned. Emails are not syncing properly again.',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: reopenedTicket.id,
        userId: supportStaff1.id,
        content:
          'Ticket reopened. Investigating the recurring email sync issue.',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Comments for admin tickets
  const adminSecurityTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000026' },
  });
  const adminBackupTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000027' },
  });
  const adminEmergencyTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TKT-2024-000035' },
  });

  if (adminSecurityTicket) {
    await prisma.comment.create({
      data: {
        ticketId: adminSecurityTicket.id,
        userId: admin.id,
        content:
          'Starting comprehensive security audit. Reviewing user accounts, permissions, and access logs.',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: adminSecurityTicket.id,
        userId: manager.id,
        content:
          'This audit is critical for compliance. Please prioritize and provide regular updates.',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: adminSecurityTicket.id,
        userId: admin.id,
        content:
          'Audit in progress. Found several accounts with excessive permissions. Reviewing and updating access levels.',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    });
  }

  if (adminBackupTicket) {
    await prisma.comment.create({
      data: {
        ticketId: adminBackupTicket.id,
        userId: admin.id,
        content:
          'Verifying backup systems. Testing restore procedures for critical databases.',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: adminBackupTicket.id,
        userId: manager.id,
        content:
          'Backup verification is essential for business continuity. Please ensure all systems are covered.',
        createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      },
    });
  }

  if (adminEmergencyTicket) {
    await prisma.comment.create({
      data: {
        ticketId: adminEmergencyTicket.id,
        userId: manager.id,
        content:
          'URGENT: Critical system components require immediate maintenance. This cannot wait.',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: adminEmergencyTicket.id,
        userId: admin.id,
        content:
          'Acknowledged. Starting emergency maintenance procedures. Will provide updates every hour.',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    });
  }

  console.log('✅ Sample comments created');

  // Create comprehensive notifications for all scenarios
  const notifications = [
    // SLA Breach Notifications
    {
      userId: supportStaff1.id,
      ticketId: overdueTicket1?.id,
      type: 'TICKET_ESCALATED',
      title: 'SLA Breach Alert',
      message:
        'Ticket TKT-2024-000001 has breached its SLA deadline by 3 days. Immediate action required.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: manager.id,
      ticketId: overdueTicket1?.id,
      type: 'TICKET_ESCALATED',
      title: 'SLA Breach Alert',
      message:
        'Critical ticket TKT-2024-000001 has breached SLA. This requires immediate escalation.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: supportStaff2.id,
      ticketId: overdueTicket2?.id,
      type: 'TICKET_ESCALATED',
      title: 'SLA Breach Alert',
      message:
        'Ticket TKT-2024-000002 has breached its SLA deadline by 2 days.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: endUser1.id,
      ticketId: overdueTicket2?.id,
      type: 'TICKET_ESCALATED',
      title: 'SLA Breach Alert',
      message:
        'Your ticket TKT-2024-000002 has exceeded the expected resolution time.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },

    // SLA Warning Notifications
    {
      userId: supportStaff4.id,
      ticketId: slaWarningTicket?.id,
      type: 'TICKET_DUE',
      title: 'SLA Warning',
      message:
        'Ticket TKT-2024-000004 is approaching its SLA deadline. Due in 2 hours.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: endUser2.id,
      ticketId: slaWarningTicket?.id,
      type: 'TICKET_DUE',
      title: 'SLA Warning',
      message:
        'Your ticket TKT-2024-000004 is approaching its resolution deadline.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // Ticket Assignment Notifications
    {
      userId: supportStaff1.id,
      ticketId: overdueTicket1?.id,
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned',
      message: 'You have been assigned critical ticket TKT-2024-000001.',
      isRead: true,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      userId: supportStaff2.id,
      ticketId: overdueTicket2?.id,
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned',
      message: 'You have been assigned ticket TKT-2024-000002.',
      isRead: true,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      userId: supportStaff3.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000003' } })
        .then(t => t?.id),
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned',
      message: 'You have been assigned ticket TKT-2024-000003.',
      isRead: true,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      userId: supportStaff4.id,
      ticketId: slaWarningTicket?.id,
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned',
      message: 'You have been assigned ticket TKT-2024-000004.',
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },

    // Ticket Created Notifications
    {
      userId: endUser1.id,
      ticketId: overdueTicket2?.id,
      type: 'TICKET_CREATED',
      title: 'Ticket Created',
      message: 'Your ticket TKT-2024-000002 has been created successfully.',
      isRead: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: endUser2.id,
      ticketId: slaWarningTicket?.id,
      type: 'TICKET_CREATED',
      title: 'Ticket Created',
      message: 'Your ticket TKT-2024-000004 has been created successfully.',
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: endUser4.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000006' } })
        .then(t => t?.id),
      type: 'TICKET_CREATED',
      title: 'Ticket Created',
      message: 'Your ticket TKT-2024-000006 has been created successfully.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: manager.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000007' } })
        .then(t => t?.id),
      type: 'TICKET_CREATED',
      title: 'Ticket Created',
      message: 'Your ticket TKT-2024-000007 has been created successfully.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // Comment Added Notifications
    {
      userId: endUser1.id,
      ticketId: overdueTicket2?.id,
      type: 'COMMENT_ADDED',
      title: 'New Comment Added',
      message: 'A new comment has been added to your ticket TKT-2024-000002.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: endUser2.id,
      ticketId: slaWarningTicket?.id,
      type: 'COMMENT_ADDED',
      title: 'New Comment Added',
      message: 'A new comment has been added to your ticket TKT-2024-000004.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: endUser6.id,
      ticketId: inProgressTicket?.id,
      type: 'COMMENT_ADDED',
      title: 'New Comment Added',
      message: 'A new comment has been added to your ticket TKT-2024-000009.',
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },

    // Status Change Notifications
    {
      userId: endUser2.id,
      ticketId: resolvedTicket?.id,
      type: 'TICKET_STATUS_CHANGED',
      title: 'Ticket Status Updated',
      message:
        'Your ticket TKT-2024-000013 status has been changed to RESOLVED.',
      isRead: true,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      userId: endUser3.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000014' } })
        .then(t => t?.id),
      type: 'TICKET_STATUS_CHANGED',
      title: 'Ticket Status Updated',
      message:
        'Your ticket TKT-2024-000014 status has been changed to RESOLVED.',
      isRead: true,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      userId: endUser6.id,
      ticketId: reopenedTicket?.id,
      type: 'TICKET_STATUS_CHANGED',
      title: 'Ticket Status Updated',
      message:
        'Your ticket TKT-2024-000017 status has been changed to REOPENED.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },

    // Escalation Notifications
    {
      userId: manager.id,
      ticketId: overdueTicket1?.id,
      type: 'TICKET_ESCALATED',
      title: 'Ticket Escalated',
      message:
        'Critical ticket TKT-2024-000001 has been escalated due to SLA breach.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: overdueTicket1?.id,
      type: 'TICKET_ESCALATED',
      title: 'Ticket Escalated',
      message:
        'Critical ticket TKT-2024-000001 has been escalated to management attention.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },

    // Due Date Notifications
    {
      userId: supportStaff1.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000005' } })
        .then(t => t?.id),
      type: 'TICKET_DUE',
      title: 'Ticket Due Soon',
      message: 'Ticket TKT-2024-000005 is due in 4 hours.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      userId: endUser3.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000005' } })
        .then(t => t?.id),
      type: 'TICKET_DUE',
      title: 'Ticket Due Soon',
      message: 'Your ticket TKT-2024-000005 is due in 4 hours.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ADMIN-SPECIFIC NOTIFICATIONS
    {
      userId: admin.id,
      ticketId: adminSecurityTicket?.id,
      type: 'TICKET_ASSIGNED',
      title: 'Critical Ticket Assigned',
      message:
        'You have been assigned critical security audit ticket TKT-2024-000026.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminBackupTicket?.id,
      type: 'TICKET_ASSIGNED',
      title: 'High Priority Ticket Assigned',
      message:
        'You have been assigned backup verification ticket TKT-2024-000027.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminEmergencyTicket?.id,
      type: 'TICKET_ASSIGNED',
      title: 'URGENT: Emergency Ticket Assigned',
      message:
        'You have been assigned emergency maintenance ticket TKT-2024-000035. Immediate action required.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminSecurityTicket?.id,
      type: 'COMMENT_ADDED',
      title: 'New Comment on Security Audit',
      message:
        'A new comment has been added to your security audit ticket TKT-2024-000026.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminBackupTicket?.id,
      type: 'COMMENT_ADDED',
      title: 'New Comment on Backup Verification',
      message:
        'A new comment has been added to your backup verification ticket TKT-2024-000027.',
      isRead: false,
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminEmergencyTicket?.id,
      type: 'COMMENT_ADDED',
      title: 'URGENT: New Comment on Emergency Ticket',
      message:
        'A new comment has been added to your emergency maintenance ticket TKT-2024-000035.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminSecurityTicket?.id,
      type: 'TICKET_DUE',
      title: 'SLA Warning - Security Audit',
      message:
        'Your security audit ticket TKT-2024-000026 is approaching its SLA deadline. Due in 1 day.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: adminEmergencyTicket?.id,
      type: 'TICKET_DUE',
      title: 'SLA Warning - Emergency Maintenance',
      message:
        'Your emergency maintenance ticket TKT-2024-000035 is approaching its SLA deadline. Due in 4 hours.',
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000030' } })
        .then(t => t?.id),
      type: 'TICKET_CREATED',
      title: 'Disaster Recovery Plan Review',
      message:
        'Your disaster recovery plan review ticket TKT-2024-000030 has been created.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000033' } })
        .then(t => t?.id),
      type: 'TICKET_CREATED',
      title: 'IT Policy Documentation Update',
      message:
        'Your IT policy documentation update ticket TKT-2024-000033 has been created.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      ticketId: await prisma.ticket
        .findUnique({ where: { ticketNumber: 'TKT-2024-000032' } })
        .then(t => t?.id),
      type: 'TICKET_STATUS_CHANGED',
      title: 'License Audit Completed',
      message:
        'Your software license audit ticket TKT-2024-000032 has been resolved.',
      isRead: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const notification of notifications) {
    if (notification.ticketId) {
      await prisma.notification.create({
        data: {
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          user: {
            connect: { id: notification.userId },
          },
          ticket: {
            connect: { id: notification.ticketId },
          },
        },
      });
    }
  }

  console.log('✅ Sample notifications created');

  // Custom field values are now managed dynamically through the admin panel
  console.log('✅ Custom field values system ready');

  // Create system settings
  const systemSettings = [
    { key: 'site_name', value: 'NTG Ticket' },
    { key: 'site_description', value: 'IT Support - Ticket Management System' },
    { key: 'timezone', value: 'UTC' },
    { key: 'language', value: 'en' },
    { key: 'auto_assign_tickets', value: 'true' },
    { key: 'auto_close_resolved_tickets', value: 'true' },
    { key: 'auto_close_days', value: '5' },
    { key: 'max_file_size', value: '10485760' }, // 10MB
    { key: 'max_files_per_ticket', value: '10' },
    { key: 'standard_response_time', value: '8' },
    { key: 'standard_resolution_time', value: '40' },
    { key: 'premium_response_time', value: '4' },
    { key: 'premium_resolution_time', value: '16' },
    { key: 'critical_response_time', value: '0' },
    { key: 'critical_resolution_time', value: '4' },
    { key: 'sla_warning_threshold', value: '0.8' }, // 80% of SLA time
    { key: 'auto_escalation_enabled', value: 'true' },
    { key: 'escalation_interval_hours', value: '24' },
    { key: 'email_notifications_enabled', value: 'true' },
    { key: 'smtp_host', value: 'smtp.gmail.com' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_username', value: '' },
    { key: 'smtp_password', value: '' },
    { key: 'from_email', value: 'noreply@ntg-ticket.com' },
    { key: 'from_name', value: 'NTG Ticket' },
    { key: 'websocket_enabled', value: 'true' },
    { key: 'file_upload_enabled', value: 'true' },
    {
      key: 'allowed_file_types',
      value: 'jpg,jpeg,png,gif,pdf,doc,docx,txt,zip',
    },
    { key: 'max_comment_length', value: '5000' },
    { key: 'ticket_auto_close_days', value: '7' },
    { key: 'dashboard_refresh_interval', value: '30' }, // seconds
    { key: 'ticket_number_counter', value: '35' }, // Initialize counter to highest ticket number in seed (35)
  ];

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ System settings created');

  // Create email templates
  const emailTemplates = [
    {
      name: 'Ticket Assigned',
      type: 'TICKET_ASSIGNED',
      subject: 'Ticket Assigned - {{ticket.ticketNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Assigned</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px; }
            .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Ticket Assigned</h2>
            </div>
            <div class="content">
              <p>Hello {{assignee.name}},</p>
              <p>A new ticket has been assigned to you for resolution.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                <p><strong>Title:</strong> {{ticket.title}}</p>
                <p><strong>Priority:</strong> {{ticket.priority}}</p>
                <p><strong>Requester:</strong> {{requester.name}} ({{requester.email}})</p>
                <p><strong>Category:</strong> {{ticket.category}}</p>
                <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
              </div>
              
              <p>Please review the ticket and begin working on it as soon as possible.</p>
              <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from the NTG Ticket.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    {
      name: 'Comment Added',
      type: 'COMMENT_ADDED',
      subject: 'New Comment Added - {{ticket.ticketNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Comment Added</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px; }
            .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .comment-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; border-radius: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Comment Added</h2>
            </div>
            <div class="content">
              <p>Hello {{user.name}},</p>
              <p>A new comment has been added to ticket <strong>{{ticket.ticketNumber}}</strong>.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                <p><strong>Title:</strong> {{ticket.title}}</p>
                <p><strong>Priority:</strong> {{ticket.priority}}</p>
                <p><strong>Status:</strong> {{ticket.status}}</p>
              </div>
              
              <div class="comment-box">
                <h3>New Comment</h3>
                <p><strong>Comment by:</strong> {{comment.author}} ({{comment.authorEmail}})</p>
                <p><strong>Comment:</strong></p>
                <p>{{comment.content}}</p>
                <p><small>Posted on: {{comment.createdAt}}</small></p>
              </div>
              
              <p>You can view the full conversation and respond by clicking the button below:</p>
              <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from the NTG Ticket.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    {
      name: 'Ticket Update',
      type: 'TICKET_UPDATE',
      subject: 'Ticket Updated - {{ticket.ticketNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Updated</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px; }
            .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .update-box { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Ticket Updated</h2>
            </div>
            <div class="content">
              <p>Hello {{requester.name}},</p>
              <p>Your ticket has been updated.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                <p><strong>Title:</strong> {{ticket.title}}</p>
                <p><strong>Priority:</strong> {{ticket.priority}}</p>
                <p><strong>Status:</strong> {{ticket.status}}</p>
                <p><strong>Category:</strong> {{ticket.category}}</p>
                <p><strong>Last Updated:</strong> {{ticket.updatedAt}}</p>
              </div>
              
              <p>You can view the updated ticket by clicking the button below:</p>
              <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the NTG Ticket.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  ];

  for (const template of emailTemplates) {
    // Check if a template of this type already exists
    const existing = await prisma.emailTemplate.findFirst({
      where: { type: template.type },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          name: template.name,
          type: template.type,
          subject: template.subject,
          html: template.html,
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Email templates created');

  // Create saved searches
  const savedSearches = [
    {
      name: 'My Open Tickets',
      description: 'All tickets assigned to me that are currently open',
      searchCriteria: JSON.stringify({
        assignedTo: 'me',
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
      }),
      userId: supportStaff1.id,
      isPublic: false,
    },
    {
      name: 'High Priority Tickets',
      description: 'All high and critical priority tickets',
      searchCriteria: JSON.stringify({
        priority: ['HIGH', 'CRITICAL'],
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
      }),
      userId: manager.id,
      isPublic: true,
    },
    {
      name: 'Overdue Tickets',
      description: 'Tickets that are past their due date',
      searchCriteria: JSON.stringify({
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
        dueDate: {
          operator: 'lt',
          value: new Date().toISOString(),
        },
      }),
      userId: manager.id,
      isPublic: true,
    },
    {
      name: 'Hardware Issues',
      description: 'All hardware-related tickets',
      searchCriteria: JSON.stringify({
        category: ['HARDWARE'],
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
      }),
      userId: supportStaff2.id,
      isPublic: false,
    },
    {
      name: 'My Submitted Tickets',
      description: 'All tickets I have submitted',
      searchCriteria: JSON.stringify({
        requester: 'me',
      }),
      userId: endUser1.id,
      isPublic: false,
    },
    {
      name: 'Resolved This Week',
      description: 'Tickets resolved in the last 7 days',
      searchCriteria: JSON.stringify({
        status: ['RESOLVED', 'CLOSED'],
        resolvedAt: {
          operator: 'gte',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
      userId: supportStaff1.id,
      isPublic: false,
    },
    // Admin-specific saved searches
    {
      name: 'My Admin Tasks',
      description: 'All tickets assigned to me as admin',
      searchCriteria: JSON.stringify({
        assignedTo: 'me',
        status: ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'],
      }),
      userId: admin.id,
      isPublic: false,
    },
    {
      name: 'Critical Admin Issues',
      description: 'All critical priority tickets requiring admin attention',
      searchCriteria: JSON.stringify({
        priority: ['CRITICAL'],
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
      }),
      userId: admin.id,
      isPublic: true,
    },
    {
      name: 'Security & Compliance',
      description: 'Security, audit, and compliance related tickets',
      searchCriteria: JSON.stringify({
        category: ['ACCESS'],
        status: ['NEW', 'OPEN', 'IN_PROGRESS'],
      }),
      userId: admin.id,
      isPublic: false,
    },
    {
      name: 'System Maintenance',
      description: 'System maintenance and infrastructure tickets',
      searchCriteria: JSON.stringify({
        category: ['SOFTWARE', 'HARDWARE'],
        status: ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'],
      }),
      userId: admin.id,
      isPublic: false,
    },
  ];

  for (const search of savedSearches) {
    await prisma.savedSearch.create({
      data: {
        name: search.name,
        description: search.description,
        searchCriteria: search.searchCriteria,
        user: {
          connect: { id: search.userId },
        },
        isPublic: search.isPublic,
      },
    });
  }

  console.log('✅ Saved searches created');

  // Default workflow is already created before tickets, so just verify it exists
  const existingDefaultWorkflow = await prisma.workflow.findFirst({
    where: { isSystemDefault: true },
  });
  
  if (!existingDefaultWorkflow) {
    console.log('⚠️  Warning: Default workflow was not created before tickets. This should not happen.');
    // Fallback: create it now if somehow it doesn't exist
    const workflowCount = await prisma.workflow.count();
    
    if (workflowCount === 0) {
    console.log('📝 No workflows found, creating system default workflow...');
    
    // Create default workflow definition
    const defaultDefinition = {
      nodes: [
        {
          id: 'create',
          type: 'statusNode',
          position: { x: 50, y: 80 },
          data: { label: 'Create Ticket', color: '#4caf50', isInitial: true },
        },
        {
          id: 'new',
          type: 'statusNode',
          position: { x: 280, y: 80 },
          data: { label: 'New', color: '#ff9800' },
        },
        {
          id: 'open',
          type: 'statusNode',
          position: { x: 510, y: 80 },
          data: { label: 'Open', color: '#2196f3' },
        },
        {
          id: 'resolved',
          type: 'statusNode',
          position: { x: 740, y: 80 },
          data: { label: 'Resolved', color: '#4caf50' },
        },
        {
          id: 'closed',
          type: 'statusNode',
          position: { x: 970, y: 80 },
          data: { label: 'Closed', color: '#9e9e9e' },
        },
        {
          id: 'reopened',
          type: 'statusNode',
          position: { x: 1100, y: 280 },
          data: { label: 'Reopened', color: '#ff6f00' },
        },
        {
          id: 'in_progress',
          type: 'statusNode',
          position: { x: 630, y: 280 },
          data: { label: 'In Progress', color: '#9c27b0' },
        },
        {
          id: 'on_hold',
          type: 'statusNode',
          position: { x: 510, y: 430 },
          data: { label: 'On Hold', color: '#ff5722' },
        },
      ],
      edges: [
        {
          id: 'e0-create',
          source: 'create',
          target: 'new',
          label: 'Create Ticket',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['END_USER'],
            conditions: [],
            actions: [],
            isCreateTransition: true,
          },
        },
        {
          id: 'e1',
          source: 'new',
          target: 'open',
          label: 'Open',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_MANAGER', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e2',
          source: 'open',
          target: 'in_progress',
          label: 'Start Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3',
          source: 'in_progress',
          target: 'resolved',
          label: 'Resolve',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3-hold',
          source: 'in_progress',
          target: 'on_hold',
          label: 'Put On Hold',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e3-resume',
          source: 'on_hold',
          target: 'in_progress',
          label: 'Resume Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e4',
          source: 'resolved',
          target: 'closed',
          label: 'Close',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e5',
          source: 'closed',
          target: 'reopened',
          label: 'Reopen',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['END_USER', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
        {
          id: 'e6',
          source: 'reopened',
          target: 'in_progress',
          label: 'Resume Work',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
      ],
    };
    
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Default Workflow',
        description: 'System default workflow for ticket management. This workflow cannot be edited or deleted.',
        status: WorkflowStatus.ACTIVE,
        isDefault: true,
        isSystemDefault: true,
        isActive: true,
        version: 1,
        definition: defaultDefinition as any,
        createdBy: admin.id,
      },
    });
    
    console.log('✅ Successfully created system default workflow!');
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Status: ${workflow.status}`);
    console.log(`   Is System Default: ${workflow.isSystemDefault}`);
  } else {
    // Check if system default exists
    const systemDefault = await prisma.workflow.findFirst({
      where: { isSystemDefault: true },
    });
    
    if (systemDefault) {
      console.log(`✅ System default workflow already exists: "${systemDefault.name}"`);
    } else {
      console.log('⚠️  Workflows exist but no system default found. Marking oldest workflow as system default...');
      const oldestWorkflow = await prisma.workflow.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      
      if (oldestWorkflow) {
        await prisma.workflow.update({
          where: { id: oldestWorkflow.id },
          data: { 
            isSystemDefault: true,
            isDefault: true,
            status: WorkflowStatus.ACTIVE,
          },
        });
        console.log(`✅ Marked "${oldestWorkflow.name}" as system default`);
      }
    }
    }
  } else {
    console.log(`✅ Default workflow verified: "${existingDefaultWorkflow.name}" (ID: ${existingDefaultWorkflow.id})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
