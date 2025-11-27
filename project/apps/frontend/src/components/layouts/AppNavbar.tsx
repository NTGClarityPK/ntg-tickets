'use client';

import {
  AppShell,
  NavLink,
  Stack,
  Text,
  Divider,
  Badge,
  ScrollArea,
  Collapse,
  Button,
} from '@mantine/core';
import {
  IconDashboard,
  IconTicket,
  IconPlus,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconBell,
  IconFileText,
  IconClipboardList,
  IconMail,
} from '@tabler/icons-react';
import { RTLChevronDown, RTLChevronRight } from '../ui/RTLIcon';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTicketsStore } from '../../stores/useTicketsStore';
import { useNotificationsStore } from '../../stores/useNotificationsStore';
import {
  useAllTicketsForCounting,
} from '../../hooks/useTickets';
import { useRouter, usePathname } from 'next/navigation';
import { Ticket } from '../../types/unified';
import { ComponentType } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../hooks/useCanCreateTicket';

interface AppNavbarProps {
  onMobileClose?: () => void;
}

export function AppNavbar({ onMobileClose }: AppNavbarProps) {
  const t = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tTickets = useTranslations('tickets');
  const tAdmin = useTranslations('admin');
  const { primary } = useDynamicTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasRole } = useAuthStore();
  const { tickets } = useTicketsStore();
  const { unreadCount } = useNotificationsStore();
  const { canCreate: canCreateTicket } = useCanCreateTicket();

  // Use React Query hooks for accurate counts
  const { data: allTicketsData } = useAllTicketsForCounting();

  // Navigation state for collapsible sections
  const [adminExpanded, { toggle: toggleAdmin }] = useDisclosure(false); // Start collapsed
  const [ticketsExpanded, { toggle: toggleTickets }] = useDisclosure(true); // Start expanded

  // Defensive programming: ensure tickets is always an array
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  // Use React Query data for accurate counts, fallback to store data
  const allTickets = allTicketsData || safeTickets;

  // Essential navigation items (always visible) - sorted by importance and frequency
  const essentialItems: Array<{
    label: string;
    icon: ComponentType<{ size?: number }>;
    href: string;
    show: boolean;
    badge?: number;
  }> = [
    {
      label: tDashboard('title') || 'Dashboard',
      icon: IconChartBar,
      href: '/dashboard',
      show: !hasRole('ADMIN'), // Show for non-Admin users
    },
    {
      label: tDashboard('overview'),
      icon: IconDashboard,
      href: '/admin/overview',
      show: hasRole('ADMIN'), // Overview goes to overview page
    },
    {
      label: tDashboard('title') || 'Dashboard',
      icon: IconChartBar,
      href: '/dashboard',
      show: hasRole('ADMIN'), // Dashboard goes to reports page for Admin
    },
    {
      label: t('notifications'),
      icon: IconBell,
      href: '/notifications',
      show: true,
      badge: unreadCount,
    },
  ];

  // Ticket management items (collapsible on mobile) - sorted by priority and workflow
  const ticketItems: Array<{
    label: string;
    icon: ComponentType<{ size?: number }>;
    href: string;
    show: boolean;
    badge?: number;
  }> = [
    {
      label: tTickets('allTickets'),
      icon: IconTicket,
      href: '/tickets',
      show: true, // Show for all roles
      badge: allTickets.length,
    },
    {
      label: tTickets('myTickets'),
      icon: IconFileText,
      href: '/tickets/my',
      show: true, // Show for all roles - tickets created by or assigned to them
      badge: user ? allTickets.filter((t: Ticket) => 
        t.requester?.id === user.id || t.assignedTo?.id === user.id
      ).length : 0,
    },
    {
      label: tTickets('createTicket'),
      icon: IconPlus,
      href: '/tickets/create',
      show: canCreateTicket, // Show based on workflow permissions
    },
  ];

  // Admin items (collapsible on mobile, simplified) - sorted by importance and frequency
  const adminItems: Array<{
    label: string;
    icon: ComponentType<{ size?: number }>;
    href: string;
    show: boolean;
    badge?: number;
  }> = [
    {
      label: tAdmin('users'),
      icon: IconUsers,
      href: '/admin/users',
      show: hasRole('ADMIN'), // Only show for ADMIN, not SUPPORT_MANAGER
    },
    {
      label: 'Invitations',
      icon: IconMail,
      href: '/admin/invitations',
      show: hasRole('ADMIN'),
    },
  ];

  // Additional admin items (only show on desktop or when expanded) - sorted by logical grouping
  const additionalAdminItems: Array<{
    label: string;
    icon: ComponentType<{ size?: number }>;
    href: string;
    show: boolean;
    badge?: number;
  }> = [
    // Content Management
    {
      label: tTickets('category'),
      icon: IconClipboardList,
      href: '/admin/categories',
      show: hasRole('ADMIN'),
    },
    {
      label: tAdmin('customFields'),
      icon: IconSettings,
      href: '/admin/custom-fields',
      show: hasRole('ADMIN'),
    },
    {
      label: tAdmin('emailTemplates'),
      icon: IconMail,
      href: '/admin/email-templates',
      show: hasRole('ADMIN'),
    },
    // Workflow & Search
    {
      label: 'Workflows',
      icon: IconSettings,
      href: '/admin/workflows',
      show: hasRole('ADMIN'),
    },
  ];

  const isActive = (href: string) => {
    // Special handling for /tickets to avoid highlighting when on sub-pages
    if (href === '/tickets') {
      return pathname === '/tickets';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Helper function to render navigation items
  const renderNavItems = (
    items: typeof essentialItems,
    color: string = primary
  ) => {
    return items.map(item => {
      if (!item.show) return null;

      return (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          leftSection={<item.icon size={16} />}
          rightSection={
            item.badge !== undefined ? (
              <Badge size='sm' variant='light' color={color}>
                {item.badge}
              </Badge>
            ) : null
          }
          active={isActive(item.href)}
          onClick={e => {
            e.preventDefault();
            router.push(item.href);
            onMobileClose?.();
          }}
        />
      );
    });
  };

  return (
    <AppShell.Navbar p='md'>
      <ScrollArea h='100%'>
        <Stack gap='xs'>
          {/* Essential Navigation - Always visible */}
          <Text size='xs' tt='uppercase' fw={700} c='dimmed' mb='xs'>
            {t('navigation')}
          </Text>
          {renderNavItems(essentialItems)}

          {/* Ticket Management - Collapsible on all devices */}
          {ticketItems.some(item => item.show) && (
            <>
              <Divider my='sm' />
              <Button
                variant='subtle'
                leftSection={
                  ticketsExpanded ? (
                    <RTLChevronDown size={14} />
                  ) : (
                    <RTLChevronRight size={14} />
                  )
                }
                onClick={toggleTickets}
                size='sm'
                justify='flex-start'
                fullWidth
              >
                {tTickets('title')}
              </Button>
              <Collapse in={ticketsExpanded}>
                <Stack gap='xs' pl='md'>
                  {renderNavItems(ticketItems, primary)}
                </Stack>
              </Collapse>
            </>
          )}

          {/* Admin Section - Collapsible on all devices */}
          {adminItems.some(item => item.show) && (
            <>
              <Divider my='sm' />
              <Button
                variant='subtle'
                leftSection={
                  adminExpanded ? (
                    <RTLChevronDown size={14} />
                  ) : (
                    <RTLChevronRight size={14} />
                  )
                }
                onClick={toggleAdmin}
                size='sm'
                justify='flex-start'
                fullWidth
              >
                {tAdmin('title')}
              </Button>
              <Collapse in={adminExpanded}>
                <Stack gap='xs' pl='md'>
                  {renderNavItems(adminItems, primary)}
                  {renderNavItems(additionalAdminItems, primary)}
                </Stack>
              </Collapse>
            </>
          )}
        </Stack>
      </ScrollArea>
    </AppShell.Navbar>
  );
}
