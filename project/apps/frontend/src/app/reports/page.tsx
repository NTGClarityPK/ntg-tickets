'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Button,
  Card,
  Group,
  Text,
  Stack,
  Grid,
  Table,
  Modal,
  MultiSelect,
  Select,
  Loader,
  Avatar,
  Badge,
  Paper,
  Tooltip,
} from '@mantine/core';
import {
  IconRefresh,
  IconUsers,
  IconTicket,
  IconClock,
  IconCheck,
  IconX,
  IconChartBar,
  IconAlertCircle,
  IconFileExport,
  IconTrendingUp,
  IconStar,
  IconStarFilled,
  IconInfoCircle,
  IconKey,
} from '@tabler/icons-react';
import { useExportReport } from '../../hooks/useReports';
import { useMediaQuery } from '@mantine/hooks';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTickets, useAllTicketsForCounting } from '../../hooks/useTickets';
import { useSystemAuditLogs } from '../../hooks/useAuditLogs';
import { Ticket, UserRole, ReportFilters } from '../../types/unified';
import { notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/constants';
import { useActiveCategories } from '../../hooks/useCategories';
import { exportReportWithDashboardToPDF } from '../../lib/pdfExport';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  tooltip: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  tooltip,
}: MetricCardProps) {
  return (
    <Card withBorder>
      <Group>
        <Avatar color={color} size='lg'>
          <Icon size={24} />
        </Avatar>
        <div style={{ flex: 1 }}>
          <Group gap='xs' align='center'>
            <Text size='lg' fw={600}>
              {value}
            </Text>
            <Tooltip label={tooltip} position='top' withArrow>
              <IconInfoCircle
                size={14}
                color='var(--mantine-color-dimmed)'
                style={{ cursor: 'help' }}
              />
            </Tooltip>
          </Group>
          <Text size='sm' c='dimmed'>
            {title}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

// Using centralized constants from lib/constants.ts

export default function ReportsPage() {
  const t = useTranslations('reports');
  const { user } = useAuthStore();
  const isSmall = useMediaQuery('(max-width: 48em)');
  const { getEarthyColorByIndex, primaryLight, primaryLighter, primaryDark } = useDynamicTheme();

  const [filters, setFilters] = useState<ReportFilters>({});
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  // For End Users and Support Staff, we'll use their own tickets data
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  // For Support Manager and Admin, use the same approach as Manager Dashboard
  const { data: allTicketsForStats } = useAllTicketsForCounting();
  // Load active categories for filtering
  const { data: categories = [] } = useActiveCategories();
  
  // Create category options from the loaded categories
  const categoryOptions = categories.map(cat => ({
    value: cat.id, // Use category ID instead of name
    label: cat.customName || cat.name.replace('_', ' '),
  }));
  const { data: users } = useUsers({ limit: 1000 });
  const exportReport = useExportReport();

  // Calculate date range for audit logs (last 30 days for Reports)
  const nowForAudit = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => new Date(nowForAudit.getTime() - 30 * 24 * 60 * 60 * 1000), [nowForAudit]);
  const auditDateFrom = useMemo(() => thirtyDaysAgo.toISOString().split('T')[0], [thirtyDaysAgo]);

  // Fetch recent audit logs for Admin reports (failed logins and password resets)
  const {
    data: recentAuditLogs,
    isLoading: auditLogsLoading,
  } = useSystemAuditLogs(1, 1000, auditDateFrom || '');

  // Filter tickets based on user active role
  const myTickets = useMemo(() => {
    if (!user) return [];

    switch (user.activeRole) {
      case 'END_USER':
        if (!tickets) return [];
        return tickets.filter(
          (ticket: Ticket) => ticket.requester.id === user.id
        );
      case 'SUPPORT_STAFF':
        if (!tickets) return [];
        return tickets.filter(
          (ticket: Ticket) => ticket.assignedTo?.id === user.id
        );
      case 'SUPPORT_MANAGER':
      case 'ADMIN':
        // Use allTicketsForStats for managers and admins (same as Manager Dashboard)
        return allTicketsForStats || [];
      default:
        return [];
    }
  }, [tickets, allTicketsForStats, user]);

  // Generate available month-year options from user's tickets with counts
  const availableMonthYears = useMemo(() => {
    if (!myTickets || myTickets.length === 0) return [];

    const monthYearCounts = new Map<string, number>();
    myTickets.forEach((ticket: Ticket) => {
      const ticketDate = new Date(ticket.createdAt);
      const monthYear = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, '0')}`;
      monthYearCounts.set(monthYear, (monthYearCounts.get(monthYear) || 0) + 1);
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return Array.from(monthYearCounts.entries())
      .map(([monthYear, count]) => {
        const [year, month] = monthYear.split('-');
        const displayFormat = `${monthNames[parseInt(month) - 1]}-${year}`;
        return {
          value: monthYear,
          label: `${displayFormat} (${count} tickets)`,
        };
      })
      .sort((a, b) => b.value.localeCompare(a.value)); // Sort newest first
  }, [myTickets]);

  // Apply additional filters for all roles
  const filteredTickets = myTickets.filter((ticket: Ticket) => {
    if (
      filters.status &&
      filters.status.length > 0 &&
      !filters.status.includes(ticket.status)
    ) {
      return false;
    }
    if (
      filters.priority &&
      filters.priority.length > 0 &&
      !filters.priority.includes(ticket.priority)
    ) {
      return false;
    }
    if (
      filters.category &&
      filters.category.length > 0 &&
      !filters.category.includes(ticket.category?.id || '')
    ) {
      return false;
    }
    if (
      filters.dateFrom &&
      new Date(ticket.createdAt) < new Date(filters.dateFrom)
    ) {
      return false;
    }
    if (
      filters.dateTo &&
      new Date(ticket.createdAt) > new Date(filters.dateTo)
    ) {
      return false;
    }
    // Month-Year filter (multiple selection)
    if (filters.monthYear && filters.monthYear.length > 0) {
      const ticketDate = new Date(ticket.createdAt);
      const ticketMonthYear = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, '0')}`;
      if (!filters.monthYear.includes(ticketMonthYear)) {
        return false;
      }
    }
    return true;
  });

  // Calculate summary counts based on user role
  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter((ticket: Ticket) =>
    ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
  );
  const resolvedTickets = filteredTickets.filter(
    (ticket: Ticket) => ticket.status === 'RESOLVED'
  );
  const overdueTickets = filteredTickets.filter((ticket: Ticket) => {
    if (!ticket.dueDate) return false;
    return (
      new Date(ticket.dueDate) < new Date() &&
      !['RESOLVED', 'CLOSED'].includes(ticket.status)
    );
  });
  const closedTickets = filteredTickets.filter(
    (ticket: Ticket) => ticket.status === 'CLOSED'
  );

  // Additional breakdown calculations for Support Staff and Manager
  // Use filteredTickets for calculations, but ensure consistency with overview when no filters
  const ticketsForBreakdown = useMemo(() => {
    // For Support Manager, when no filters are applied, use allTicketsForStats for consistency with overview
    if (
      user?.activeRole === 'SUPPORT_MANAGER' &&
      Object.keys(filters).length === 0
    ) {
      return allTicketsForStats || [];
    }
    return filteredTickets;
  }, [filteredTickets, allTicketsForStats, user?.activeRole, filters]);

  // Admin-specific filtering logic
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const userDate = new Date(user.createdAt);
        if (filters.dateFrom && userDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && userDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      // Month-Year filter (multiple selection)
      if (filters.monthYear && filters.monthYear.length > 0) {
        const userDate = new Date(user.createdAt);
        const userMonthYear = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.monthYear.includes(userMonthYear)) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  const filteredTicketsForAdmin = useMemo(() => {
    if (!allTicketsForStats) return [];

    return allTicketsForStats.filter(ticket => {
      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const ticketDate = new Date(ticket.createdAt);
        if (filters.dateFrom && ticketDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && ticketDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      // Month-Year filter (multiple selection)
      if (filters.monthYear && filters.monthYear.length > 0) {
        const ticketDate = new Date(ticket.createdAt);
        const ticketMonthYear = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.monthYear.includes(ticketMonthYear)) {
          return false;
        }
      }

      // Filter by category
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(ticket.category?.customName || ticket.category?.name || '')) {
          return false;
        }
      }

      return true;
    });
  }, [allTicketsForStats, filters]);

  // Calculate Admin report metrics (moved after filteredUsers and filteredTicketsForAdmin declarations)
  const adminReportStats = useMemo(() => {
    if (user?.activeRole !== 'ADMIN') return [];

    // Calculate New Users (users created in current month)
    const now = new Date();
    const newUsers = filteredUsers.filter(user => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === now.getMonth() &&
        userDate.getFullYear() === now.getFullYear()
      );
    }).length;

    // Calculate Failed Logins from audit logs
    const auditLogItems = recentAuditLogs?.items || [];
    const failedLogins = auditLogItems.filter(
      log => log.action === 'LOGIN' && log.metadata && 
      (log.metadata as { success?: boolean })?.success === false
    ).length;

    // Calculate New Tickets (tickets created in current month)
    const newTickets = filteredTicketsForAdmin.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      return (
        ticketDate.getMonth() === now.getMonth() &&
        ticketDate.getFullYear() === now.getFullYear()
      );
    }).length;

    // Calculate Password Resets from audit logs
    const passwordResets = auditLogItems.filter(
      log => log.action === 'UPDATE' && log.resource === 'user' && 
      log.fieldName === 'password'
    ).length;

    return [
      {
        title: 'New User',
        value: newUsers,
        icon: IconUsers,
        color: primaryLight,
        tooltip: 'New users registered in the current month',
      },
      {
        title: 'Failed login',
        value: failedLogins,
        icon: IconAlertCircle,
        color: primaryLight,
        tooltip: 'Failed login attempts in the last 30 days',
      },
      {
        title: 'New Ticket',
        value: newTickets,
        icon: IconTicket,
        color: primaryLight,
        tooltip: 'New tickets created in the current month',
      },
      {
        title: 'pwd reset',
        value: passwordResets,
        icon: IconKey,
        color: primaryLight,
        tooltip: 'Password reset requests in the last 30 days',
      },
    ];
  }, [user?.activeRole, filteredUsers, filteredTicketsForAdmin, recentAuditLogs, primaryLight]);

  const priorityBreakdown = useMemo(() => {
    const breakdown = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    ticketsForBreakdown.forEach((ticket: Ticket) => {
      if (ticket.priority && ticket.priority in breakdown) {
        breakdown[ticket.priority as keyof typeof breakdown]++;
      } else {
        breakdown.UNKNOWN++;
      }
    });
    return breakdown;
  }, [ticketsForBreakdown]);

  const statusBreakdown = useMemo(() => {
    const breakdown = {
      NEW: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };
    ticketsForBreakdown.forEach((ticket: Ticket) => {
      if (ticket.status in breakdown) {
        breakdown[ticket.status as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  }, [ticketsForBreakdown]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>();
    ticketsForBreakdown.forEach((ticket: Ticket) => {
      const category = ticket.category?.customName || ticket.category?.name || 'Unknown';
      breakdown.set(category, (breakdown.get(category) || 0) + 1);
    });
    return Array.from(breakdown.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 categories to match overview
  }, [ticketsForBreakdown]);

  const impactBreakdown = useMemo(() => {
    const breakdown = {
      CRITICAL: 0,
      MAJOR: 0,
      MODERATE: 0,
      MINOR: 0,
      UNKNOWN: 0,
    };
    ticketsForBreakdown.forEach((ticket: Ticket) => {
      if (ticket.impact && ticket.impact in breakdown) {
        breakdown[ticket.impact as keyof typeof breakdown]++;
      } else {
        breakdown.UNKNOWN++;
      }
    });
    return breakdown;
  }, [ticketsForBreakdown]);

  const urgencyBreakdown = useMemo(() => {
    const breakdown = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    ticketsForBreakdown.forEach((ticket: Ticket) => {
      if (ticket.urgency && ticket.urgency in breakdown) {
        breakdown[ticket.urgency as keyof typeof breakdown]++;
      } else {
        breakdown.UNKNOWN++;
      }
    });
    return breakdown;
  }, [ticketsForBreakdown]);

  // Staff performance calculation for Support Manager
  const staffPerformance = useMemo(() => {
    if (user?.activeRole !== 'SUPPORT_MANAGER') return [];

    const staffMap = new Map<
      string,
      {
        name: string;
        assignedTickets: number;
        resolvedTickets: number;
        openTickets: number;
        overdueTickets: number;
        slaBreachedTickets: number;
        avgResolutionTime: number;
      }
    >();

    filteredTickets.forEach((ticket: Ticket) => {
      if (!ticket.assignedTo) return;

      const staffId = ticket.assignedTo.id;
      const staffName = ticket.assignedTo.name;

      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          name: staffName,
          assignedTickets: 0,
          resolvedTickets: 0,
          openTickets: 0,
          overdueTickets: 0,
          slaBreachedTickets: 0,
          avgResolutionTime: 0,
        });
      }

      const staff = staffMap.get(staffId);
      if (!staff) {
        return;
      }
      staff.assignedTickets++;

      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
        staff.resolvedTickets++;
      }

      if (['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)) {
        staff.openTickets++;
      }

      if (
        ticket.dueDate &&
        new Date(ticket.dueDate) < new Date() &&
        !['RESOLVED', 'CLOSED'].includes(ticket.status)
      ) {
        staff.overdueTickets++;
      }

      if (
        ticket.dueDate &&
        ticket.closedAt &&
        new Date(ticket.closedAt) > new Date(ticket.dueDate)
      ) {
        staff.slaBreachedTickets++;
      }
    });

    return Array.from(staffMap.values()).sort(
      (a, b) => b.assignedTickets - a.assignedTickets
    );
  }, [filteredTickets, user]);

  const handlePDFExport = async () => {
    try {
      const filename = `${user?.activeRole || 'USER'}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Use the new function that captures dashboard as second page (if not end user)
      await exportReportWithDashboardToPDF('reports-page-container', {
        filename,
        quality: 0.98,
      }, user?.activeRole);

      setExportModalOpen(false);

      notifications.show({
        title: 'Success',
        message: 'PDF report with dashboard overview exported successfully',
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to export PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: getEarthyColorByIndex(0),
      });
    }
  };

  const handleExportReport = async (format: string) => {
    try {
      // Handle PDF export with client-side generation
      if (format === 'pdf') {
        await handlePDFExport();
        return;
      }

      // Special handling for Administrator reports
      if (user?.activeRole === 'ADMIN') {
        await handleAdminExport();
        return;
      }

      // Set export filters based on user role
      let exportFilters: ReportFilters;

      if (user?.activeRole === 'END_USER') {
        exportFilters = {
          ...filters,
          requesterId: user.id, // Only export current user's tickets
          userRole: user.activeRole, // Add user role for filename
        };
      } else if (user?.activeRole === 'SUPPORT_STAFF') {
        exportFilters = {
          ...filters,
          assignedTo: user.id, // Only export tickets assigned to current staff
          userRole: user.activeRole, // Add user role for filename
        };
      } else {
        // For Support Manager - export all filtered tickets
        exportFilters = {
          ...filters,
          assignedTo: filters.assignedTo,
          userRole: user?.activeRole, // Add user role for filename
        };
      }

      // Debug logging removed for production

      const blob = await exportReport.mutateAsync({
        type: 'tickets', // Always export tickets data
        format,
        filters: exportFilters,
        data: undefined, // No structured data for regular ticket exports
      });

      // Create role-based filename since we can't access headers with blob response
      // Ensure we get the correct file extension based on format
      const fileExtension =
        format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `${user?.activeRole || 'USER'}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      // Debug logging removed for production

      // Create download link for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportModalOpen(false);

      notifications.show({
        title: 'Success',
        message: 'Report exported successfully',
        color: primaryLight,
      });
    } catch (error) {
      // Error logging removed for production

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as {
          data?: { message?: string };
          statusText?: string;
        };
        if (errorResponse.data?.message) {
          errorMessage = errorResponse.data.message;
        } else if (errorResponse.statusText) {
          errorMessage = errorResponse.statusText;
        }
      }

      notifications.show({
        title: 'Error',
        message: `Failed to export report: ${errorMessage}`,
        color: getEarthyColorByIndex(0),
      });
    }
  };

  const handleAdminExport = async () => {
    try {
      // Handle PDF export for admin users
      if (exportFormat === 'pdf') {
        await handlePDFExport();
        return;
      }


      // Create structured data for Excel export
      const exportData = {
        summaryCards: [
          {
            title: 'New Users',
            value: filteredUsers.filter(user => {
              const userDate = new Date(user.createdAt);
              const now = new Date();
              return (
                userDate.getMonth() === now.getMonth() &&
                userDate.getFullYear() === now.getFullYear()
              );
            }).length,
          },
          { title: 'Failed Logins', value: 0 },
          {
            title: 'New Tickets',
            value: filteredTicketsForAdmin.filter(ticket => {
              const ticketDate = new Date(ticket.createdAt);
              const now = new Date();
              return (
                ticketDate.getMonth() === now.getMonth() &&
                ticketDate.getFullYear() === now.getFullYear()
              );
            }).length,
          },
          { title: 'Password Resets', value: 0 },
        ],
        usersByRole: [
          {
            role: 'END_USER',
            count: filteredUsers.filter(u =>
              u.roles?.includes(UserRole.END_USER)
            ).length,
          },
          {
            role: 'SUPPORT_STAFF',
            count: filteredUsers.filter(u =>
              u.roles?.includes(UserRole.SUPPORT_STAFF)
            ).length,
          },
          {
            role: 'SUPPORT_MANAGER',
            count: filteredUsers.filter(u =>
              u.roles?.includes(UserRole.SUPPORT_MANAGER)
            ).length,
          },
          {
            role: 'ADMIN',
            count: filteredUsers.filter(u => u.roles?.includes(UserRole.ADMIN))
              .length,
          },
        ],
        usersByRegistrationPeriod: Array.from({ length: 4 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthYear = date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          const count = filteredUsers.filter(user => {
            const userDate = new Date(user.createdAt);
            return (
              userDate.getMonth() === date.getMonth() &&
              userDate.getFullYear() === date.getFullYear()
            );
          }).length;
          return { monthYear, count };
        }),
        usersByStatus: [
          {
            status: 'Active',
            count: filteredUsers.filter(u => u.isActive).length,
          },
          {
            status: 'Inactive',
            count: filteredUsers.filter(u => !u.isActive).length,
          },
        ],
        ticketsByPriority: [
          {
            priority: 'CRITICAL',
            count: filteredTicketsForAdmin.filter(
              t => t.priority === 'CRITICAL'
            ).length,
          },
          {
            priority: 'HIGH',
            count: filteredTicketsForAdmin.filter(t => t.priority === 'HIGH')
              .length,
          },
          {
            priority: 'MEDIUM',
            count: filteredTicketsForAdmin.filter(t => t.priority === 'MEDIUM')
              .length,
          },
          {
            priority: 'LOW',
            count: filteredTicketsForAdmin.filter(t => t.priority === 'LOW')
              .length,
          },
        ],
        ticketsByCategory: Object.entries(
          filteredTicketsForAdmin.reduce(
            (acc, ticket) => {
              const category = ticket.category?.customName || ticket.category?.name || 'Unknown';
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([category, count]) => ({ category, count })),
        loginActivity: [
          { metric: 'Failed Login Attempts', count: 0, status: 'Normal' },
          {
            metric: 'Successful Logins',
            count: filteredUsers.length,
            status: 'Active',
          },
          { metric: 'Password Resets', count: 0, status: 'Pending' },
          { metric: 'Active Sessions', count: 0, status: 'Online' },
        ],
        auditTrail: [
          {
            activityType: 'User Registrations',
            count: filteredUsers.length,
            lastActivity:
              filteredUsers.length > 0
                ? new Date(
                    Math.max(
                      ...filteredUsers.map(u => new Date(u.createdAt).getTime())
                    )
                  ).toLocaleDateString()
                : 'N/A',
          },
          {
            activityType: 'Ticket Creations',
            count: filteredTicketsForAdmin.length,
            lastActivity:
              filteredTicketsForAdmin.length > 0
                ? new Date(
                    Math.max(
                      ...filteredTicketsForAdmin.map(t =>
                        new Date(t.createdAt).getTime()
                      )
                    )
                  ).toLocaleDateString()
                : 'N/A',
          },
          { activityType: 'System Changes', count: 0, lastActivity: 'N/A' },
          { activityType: 'Security Events', count: 0, lastActivity: 'N/A' },
        ],
      };

      // Call the backend with structured data
      const blob = await exportReport.mutateAsync({
        type: 'admin-report',
        format: 'excel',
        data: exportData,
      });

      // Create download link for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `administrative-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportModalOpen(false);

      notifications.show({
        title: 'Success',
        message:
          'Administrative report exported successfully as Excel with structured sheets',
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to export administrative report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: getEarthyColorByIndex(0),
      });
    }
  };

  // Show loading state
  if (ticketsLoading || auditLogsLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
          <Text>Loading report data...</Text>
        </Group>
      </Container>
    );
  }

  // For End Users, Support Staff, and Support Manager, show simplified report with filters and summary boxes
  if (
    ['END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER'].includes(
      user?.activeRole || ''
    )
  ) {
    // Define stats based on user active role
    const stats =
      user?.activeRole === 'END_USER'
        ? [
            {
              title: 'Total Tickets',
              value: totalTickets,
              icon: IconTicket,
              color: primaryLight,
              tooltip: 'Total number of tickets you have created',
            },
            {
              title: 'Open Tickets',
              value: openTickets.length,
              icon: IconClock,
              color: primaryLight,
              tooltip:
                'Tickets that are currently open, in progress, or newly created',
            },
            {
              title: 'Resolved Tickets',
              value: resolvedTickets.length,
              icon: IconCheck,
              color: primaryLight,
              tooltip: 'Tickets that have been resolved but not yet closed',
            },
            {
              title: 'Closed Tickets',
              value: closedTickets.length,
              icon: IconX,
              color: primaryLight,
              tooltip: 'Tickets that have been permanently closed',
            },
          ]
        : [
            // Support Staff and Manager stats (same as their dashboards)
            {
              title: 'Total',
              value: totalTickets,
              icon: IconTicket,
              color: primaryLight,
              tooltip:
                user?.activeRole === 'SUPPORT_STAFF'
                  ? 'Total tickets assigned to you'
                  : 'Total tickets in the system',
            },
            {
              title: 'Open',
              value: openTickets.length,
              icon: IconClock,
              color: primaryLight,
              tooltip:
                'Tickets that are currently open, in progress, or newly created',
            },
            {
              title: 'Resolved',
              value: resolvedTickets.length,
              icon: IconCheck,
              color: primaryLight,
              tooltip: 'Tickets that have been resolved but not yet closed',
            },
            {
              title: 'Overdue',
              value: overdueTickets.length,
              icon: IconAlertCircle,
              color: primaryLight,
              tooltip:
                'Tickets that have passed their due date and are not yet resolved',
            },
            // Additional breakdown boxes
            {
              title: 'Critical Priority',
              value: priorityBreakdown.CRITICAL,
              icon: IconStarFilled,
              color: primaryLight,
              tooltip: 'Tickets with critical priority level',
            },
            {
              title: 'High Priority',
              value: priorityBreakdown.HIGH,
              icon: IconStar,
              color: primaryLight,
              tooltip: 'Tickets with high priority level',
            },
            {
              title: 'Major Impact',
              value: impactBreakdown.MAJOR,
              icon: IconTrendingUp,
              color: primaryLight,
              tooltip: 'Tickets with major business impact',
            },
            {
              title: 'High Urgency',
              value: urgencyBreakdown.HIGH,
              icon: IconTrendingUp,
              color: primaryLight, // Cycle back to start
              tooltip: 'Tickets with high urgency level',
            },
            {
              title: 'Top Category',
              value: categoryBreakdown[0]?.[1] || 0,
              icon: IconChartBar,
              color: primaryLight, // Cycle back to start
              tooltip: 'Count of tickets in the most common category',
            },
          ];

    return (
      <Container id="reports-page-container" size='xl' py='md'>
        <Stack gap='md'>
          {/* Header */}
          <Group justify='space-between' data-section="reports-header">
            <div>
              <Title order={2}>
                {user?.activeRole === 'END_USER'
                  ? 'End User Reports'
                  : user?.activeRole === 'SUPPORT_STAFF'
                    ? 'Support Staff Reports'
                    : 'Manager Reports'}
              </Title>
              <Text c='dimmed' size='sm'>
                {user?.activeRole === 'END_USER'
                  ? 'View and filter your ticket statistics'
                  : user?.activeRole === 'SUPPORT_STAFF'
                    ? 'View and filter your assigned ticket statistics'
                    : 'View and filter team ticket statistics'}
              </Text>
            </div>
            <Group className="pdf-hide-elements">
              <Button
                variant='light'
                leftSection={<IconRefresh size={16} />}
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={() => setExportModalOpen(true)}
              >
                Export Report
              </Button>
            </Group>
          </Group>

          {/* Filters */}
          <Card className="pdf-hide-elements">
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Filter Options</Title>
                <Button
                  variant='outline'
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => setFilters({})}
                  disabled={Object.keys(filters).length === 0}
                >
                  Clear All Filters
                </Button>
              </Group>
              <Grid>
                {/* Top Row - 3 filters */}
                <Grid.Col span={3}>
                  <DatePickerInput
                    label='From Date'
                    placeholder='Select start date'
                    value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateFrom: date?.toISOString() })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label='To Date'
                    placeholder='Select end date'
                    value={filters.dateTo ? new Date(filters.dateTo) : null}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateTo: date?.toISOString() })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Month-Year'
                    placeholder='Select month-years'
                    data={availableMonthYears}
                    value={filters.monthYear || []}
                    onChange={value =>
                      setFilters({ ...filters, monthYear: value })
                    }
                    clearable
                    searchable
                    size='sm'
                    styles={{
                      input: {
                        height: '36px', // Match DatePickerInput height
                        fontSize: '14px',
                      },
                    }}
                  />
                </Grid.Col>
                {/* Bottom Row - 3 filters */}
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Status'
                    placeholder='Select status'
                    data={STATUS_OPTIONS}
                    value={filters.status || []}
                    onChange={value =>
                      setFilters({ ...filters, status: value })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Priority'
                    placeholder='Select priority'
                    data={PRIORITY_OPTIONS}
                    value={filters.priority || []}
                    onChange={value =>
                      setFilters({ ...filters, priority: value })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Category'
                    placeholder='Select category'
                    data={categoryOptions}
                    value={filters.category || []}
                    onChange={value =>
                      setFilters({ ...filters, category: value })
                    }
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          {/* Summary Count Boxes */}
          <div id="report-overview-section" style={{ marginBottom: '2rem' }}>
            <Grid>
              {stats.map(stat => (
                <Grid.Col
                  key={stat.title}
                  span={{
                    base: 12,
                    sm: user?.activeRole === 'END_USER' ? 6 : 6,
                    md: user?.activeRole === 'END_USER' ? 3 : 2.4,
                  }}
                >
                  <MetricCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    tooltip={stat.tooltip}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </div>

          {/* Breakdown Tables - Support Staff and Manager */}
          {['SUPPORT_STAFF', 'SUPPORT_MANAGER'].includes(
            user?.activeRole || ''
          ) && (
            <div id="report-content-section" style={{ marginTop: '2rem' }}>
              <Grid>
              {/* Left Column - Category, Impact, and Priority stacked with spacing */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap='sm'>
                  <Paper withBorder p='md'>
                    <Title order={4} mb='md'>
                      Tickets by Category
                    </Title>
                    <Stack gap={0}>
                      {categoryBreakdown.map(
                        ([category, count]: [string, number], index: number) => (
                          <div
                            key={category}
                            style={{
                              padding: '12px 16px',
                              borderBottom:
                                index < categoryBreakdown.length - 1
                                  ? '1px solid var(--mantine-color-gray-2)'
                                  : 'none',
                              backgroundColor:
                                index % 2 === 0
                                  ? 'var(--mantine-color-gray-0)'
                                  : 'transparent',
                            }}
                          >
                            <Group justify='space-between' align='center'>
                              <Text size='sm'>{category}</Text>
                              <Badge variant='light' color='dynamic'>
                                {count}
                              </Badge>
                            </Group>
                          </div>
                        )
                      )}
                    </Stack>
                  </Paper>
                  
                  <Paper withBorder p='md'>
                    <Title order={4} mb='md'>
                      Tickets by Impact
                    </Title>
                    <Stack gap={0}>
                      {Object.entries(impactBreakdown).map(
                        ([impact, count]: [string, number], index: number) => (
                          <div
                            key={impact}
                            style={{
                              padding: '12px 16px',
                              borderBottom:
                                index < Object.entries(impactBreakdown).length - 1
                                  ? '1px solid var(--mantine-color-gray-2)'
                                  : 'none',
                              backgroundColor:
                                index % 2 === 0
                                  ? 'var(--mantine-color-gray-0)'
                                  : 'transparent',
                            }}
                          >
                            <Group justify='space-between' align='center'>
                              <Text size='sm'>{impact}</Text>
                              <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(0), color: 'white' }}>
                                {count}
                              </Badge>
                            </Group>
                          </div>
                        )
                      )}
                    </Stack>
                  </Paper>

                  <Paper withBorder p='md'>
                    <Title order={4} mb='md'>
                      Tickets by Priority
                    </Title>
                    <Stack gap={0}>
                      {Object.entries(priorityBreakdown).map(
                        ([priority, count]: [string, number], index: number) => (
                          <div
                            key={priority}
                            style={{
                              padding: '12px 16px',
                              borderBottom:
                                index <
                                Object.entries(priorityBreakdown).length - 1
                                  ? '1px solid var(--mantine-color-gray-2)'
                                  : 'none',
                              backgroundColor:
                                index % 2 === 0
                                  ? 'var(--mantine-color-gray-0)'
                                  : 'transparent',
                            }}
                          >
                            <Group justify='space-between' align='center'>
                              <Text size='sm'>{priority}</Text>
                              <Badge variant='light' color='dynamic'>
                                {count}
                              </Badge>
                            </Group>
                          </div>
                        )
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>

              {/* Right Column - Status and Urgency stacked */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap='md'>
                  <Paper withBorder p='md'>
                    <Title order={4} mb='md'>
                      Tickets by Status
                    </Title>
                    <Stack gap={0}>
                      {Object.entries(statusBreakdown).map(
                        ([status, count]: [string, number], index: number) => (
                          <div
                            key={status}
                            style={{
                              padding: '12px 16px',
                              borderBottom:
                                index < Object.entries(statusBreakdown).length - 1
                                  ? '1px solid var(--mantine-color-gray-2)'
                                  : 'none',
                              backgroundColor:
                                index % 2 === 0
                                  ? 'var(--mantine-color-gray-0)'
                                  : 'transparent',
                            }}
                          >
                            <Group justify='space-between' align='center'>
                              <Text size='sm'>{status.replace('_', ' ')}</Text>
                              <Badge variant='light' color='dynamic'>
                                {count}
                              </Badge>
                            </Group>
                          </div>
                        )
                      )}
                    </Stack>
                  </Paper>
                  
                  <Paper withBorder p='md'>
                    <Title order={4} mb='md'>
                      Tickets by Urgency
                    </Title>
                    <Stack gap={0}>
                      {Object.entries(urgencyBreakdown).map(
                        ([urgency, count]: [string, number], index: number) => (
                          <div
                            key={urgency}
                            style={{
                              padding: '12px 16px',
                              borderBottom:
                                index <
                                Object.entries(urgencyBreakdown).length - 1
                                  ? '1px solid var(--mantine-color-gray-2)'
                                  : 'none',
                              backgroundColor:
                                index % 2 === 0
                                  ? 'var(--mantine-color-gray-0)'
                                  : 'transparent',
                            }}
                          >
                            <Group justify='space-between' align='center'>
                              <Text size='sm'>{urgency}</Text>
                              <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(1), color: 'white' }}>
                                {count}
                              </Badge>
                            </Group>
                          </div>
                        )
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
            </Grid>
            </div>
          )}

          {/* Staff Performance Section - Support Manager Only */}
          {user?.activeRole === 'SUPPORT_MANAGER' &&
            staffPerformance.length > 0 && (
              <Paper withBorder p='md' data-section="staff-performance">
                <Title order={3} mb='md'>
                  Staff Performance
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Staff Member</Table.Th>
                      <Table.Th>
                        <Group gap='xs' align='center'>
                          Assigned
                          <Tooltip
                            label='Total tickets assigned to this staff member'
                            position='top'
                            withArrow
                          >
                            <IconInfoCircle
                              size={12}
                              color='var(--mantine-color-dimmed)'
                              style={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap='xs' align='center'>
                          Resolved
                          <Tooltip
                            label='Tickets resolved or closed by this staff member'
                            position='top'
                            withArrow
                          >
                            <IconInfoCircle
                              size={12}
                              color='var(--mantine-color-dimmed)'
                              style={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap='xs' align='center'>
                          Open
                          <Tooltip
                            label='Currently open tickets assigned to this staff member'
                            position='top'
                            withArrow
                          >
                            <IconInfoCircle
                              size={12}
                              color='var(--mantine-color-dimmed)'
                              style={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap='xs' align='center'>
                          Overdue
                          <Tooltip
                            label='Open tickets that have passed their due date'
                            position='top'
                            withArrow
                          >
                            <IconInfoCircle
                              size={12}
                              color='var(--mantine-color-dimmed)'
                              style={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap='xs' align='center'>
                          Performance
                          <Tooltip
                            label='SLA compliance percentage based on resolved tickets only'
                            position='top'
                            withArrow
                          >
                            <IconInfoCircle
                              size={12}
                              color='var(--mantine-color-dimmed)'
                              style={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        </Group>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {staffPerformance.map(staff => {
                      const slaCompliance =
                        staff.resolvedTickets > 0
                          ? Math.round(
                              ((staff.resolvedTickets -
                                staff.slaBreachedTickets) /
                                staff.resolvedTickets) *
                                100
                            )
                          : 100;

                      return (
                        <Table.Tr key={staff.name}>
                          <Table.Td>
                            <Group gap='sm'>
                              <Avatar size='sm' color='dynamic'>
                                {staff.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Text fw={500}>{staff.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' color='dynamic'>
                              {staff.assignedTickets}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' color='dynamic'>
                              {staff.resolvedTickets}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(1), color: 'white' }}>
                              {staff.openTickets}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(0), color: 'white' }}>
                              {staff.overdueTickets}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(0), color: 'white' }}>
                              {staff.slaBreachedTickets}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant='light'
                              style={{
                                backgroundColor: slaCompliance >= 90
                                  ? primaryLight
                                  : slaCompliance >= 70
                                    ? primaryLighter
                                    : primaryDark,
                                color: 'white'
                              }}
                            >
                              {slaCompliance}%
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
        </Stack>

        {/* Export Modal */}
        <Modal
          opened={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          title='Export Report'
        >
          <Stack>
            <Select
              label='Export Format'
              placeholder='Select format'
              data={[
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel' },
              ]}
              value={exportFormat}
              onChange={value => setExportFormat(value || 'pdf')}
            />
            <Group justify='flex-end'>
              <Button variant='light' onClick={() => setExportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleExportReport(exportFormat)}
                loading={exportReport.isPending}
              >
                Export
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    );
  }

  // For other roles, show the full administrative reports (existing functionality)
  return (
    <Container id="reports-page-container" size='xl' py='md'>
      <Group justify='space-between' mb='xl' data-section="reports-header">
        <div>
          <Title order={2}>Administrative Reports</Title>
          <Text c='dimmed' size='sm'>
            User management, ticket analytics, and SLA compliance reports
          </Text>
        </div>
        <Group className="pdf-hide-elements">
          <Button
            variant='light'
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconFileExport size={16} />}
            onClick={() => setExportModalOpen(true)}
          >
            {t('exportReport')}
          </Button>
        </Group>
      </Group>

      {/* Administrator Reports */}
      {user?.activeRole === 'ADMIN' && (
        <Stack gap='md'>
          {/* Filters */}
          <Card className="pdf-hide-elements">
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Filter Options</Title>
                <Button
                  variant='outline'
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => setFilters({})}
                  disabled={Object.keys(filters).length === 0}
                >
                  Clear All Filters
                </Button>
              </Group>
              <Grid>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label='From Date'
                    placeholder='Select start date'
                    value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateFrom: date?.toISOString() })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label='To Date'
                    placeholder='Select end date'
                    value={filters.dateTo ? new Date(filters.dateTo) : null}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateTo: date?.toISOString() })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Month-Year'
                    placeholder='Select month-years'
                    data={availableMonthYears}
                    value={filters.monthYear || []}
                    onChange={value =>
                      setFilters({ ...filters, monthYear: value })
                    }
                    clearable
                    searchable
                    size='sm'
                    styles={{
                      input: {
                        height: '36px', // Match DatePickerInput height
                        fontSize: '14px',
                      },
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MultiSelect
                    label='Category'
                    placeholder='Select category'
                    data={categoryOptions}
                    value={filters.category || []}
                    onChange={value =>
                      setFilters({ ...filters, category: value })
                    }
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          {/* Summary Cards */}
          <div id="report-overview-section">
            <Grid>
              {adminReportStats.map(stat => (
                <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    tooltip={stat.tooltip}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </div>

          {/* Breakdown Tables - Masonry two-column layout */}
          <div id="report-content-section" style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              columnCount: isSmall ? 1 : 2,
              columnGap: '16px',
            }}
          >
            <div
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                display: 'inline-block',
                width: '100%',
                verticalAlign: 'top',
              }}
            >
              <Paper withBorder p='md'>
                <Title order={4} mb='md'>
                  Users by Role
                </Title>
                <Stack gap={0}>
                  {Object.entries({
                    END_USER: filteredUsers.filter(u =>
                      u.roles?.includes(UserRole.END_USER)
                    ).length,
                    SUPPORT_STAFF: filteredUsers.filter(u =>
                      u.roles?.includes(UserRole.SUPPORT_STAFF)
                    ).length,
                    SUPPORT_MANAGER: filteredUsers.filter(u =>
                      u.roles?.includes(UserRole.SUPPORT_MANAGER)
                    ).length,
                    ADMIN: filteredUsers.filter(u =>
                      u.roles?.includes(UserRole.ADMIN)
                    ).length,
                  }).map(([role, count], index, array) => (
                    <div
                      key={role}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          index < array.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                      }}
                    >
                      <Group justify='space-between' align='center'>
                        <Text size='sm'>{role.replace('_', ' ')}</Text>
                        <Badge variant='light' color={primaryLight}>
                          {count}
                        </Badge>
                      </Group>
                    </div>
                  ))}
                </Stack>
              </Paper>
            </div>

            <div
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                display: 'inline-block',
                width: '100%',
                verticalAlign: 'top',
              }}
            >
              <Paper withBorder p='md'>
                <Title order={4} mb='md'>
                  Users by Registration Period
                </Title>
                <Stack gap={0}>
                  {Array.from({ length: 4 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthYear = date.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    });
                    const count = filteredUsers.filter(user => {
                      const userDate = new Date(user.createdAt);
                      return (
                        userDate.getMonth() === date.getMonth() &&
                        userDate.getFullYear() === date.getFullYear()
                      );
                    }).length;
                    return { monthYear, count };
                  }).map(({ monthYear, count }, index, array) => (
                    <div
                      key={monthYear}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          index < array.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                      }}
                    >
                      <Group justify='space-between' align='center'>
                        <Text size='sm'>{monthYear}</Text>
                        <Badge variant='light' color='dynamic'>
                          {count}
                        </Badge>
                      </Group>
                    </div>
                  ))}
                </Stack>
              </Paper>
            </div>

            <div
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                display: 'inline-block',
                width: '100%',
                verticalAlign: 'top',
              }}
            >
              <Paper withBorder p='md'>
                <Title order={4} mb='md'>
                  Users by Status
                </Title>
                <Stack gap={0}>
                  {Object.entries({
                    Active: filteredUsers.filter(u => u.isActive).length,
                    Inactive: filteredUsers.filter(u => !u.isActive).length,
                  }).map(([status, count], index, array) => (
                    <div
                      key={status}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          index < array.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                      }}
                    >
                      <Group justify='space-between' align='center'>
                        <Text size='sm'>{status}</Text>
                        <Badge
                          variant='light'
                          style={{
                            backgroundColor: status === 'Active' ? primaryLight : primaryDark,
                            color: 'white'
                          }}
                        >
                          {count}
                        </Badge>
                      </Group>
                    </div>
                  ))}
                </Stack>
              </Paper>
            </div>

            <div
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                display: 'inline-block',
                width: '100%',
                verticalAlign: 'top',
              }}
            >
              <Paper withBorder p='md'>
                <Title order={4} mb='md'>
                  Tickets by Priority
                </Title>
                <Stack gap={0}>
                  {Object.entries({
                    CRITICAL: filteredTicketsForAdmin.filter(
                      t => t.priority === 'CRITICAL'
                    ).length,
                    HIGH: filteredTicketsForAdmin.filter(
                      t => t.priority === 'HIGH'
                    ).length,
                    MEDIUM: filteredTicketsForAdmin.filter(
                      t => t.priority === 'MEDIUM'
                    ).length,
                    LOW: filteredTicketsForAdmin.filter(
                      t => t.priority === 'LOW'
                    ).length,
                  }).map(([priority, count], index, array) => (
                    <div
                      key={priority}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          index < array.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                      }}
                    >
                      <Group justify='space-between' align='center'>
                        <Text size='sm'>{priority}</Text>
                        <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(1), color: 'white' }}>
                          {count}
                        </Badge>
                      </Group>
                    </div>
                  ))}
                </Stack>
              </Paper>
            </div>

            <div
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                display: 'inline-block',
                width: '100%',
                verticalAlign: 'top',
              }}
            >
              <Paper withBorder p='md'>
                <Title order={4} mb='md'>
                  Tickets by Category
                </Title>
                <Stack gap={0}>
                  {Object.entries(
                    filteredTicketsForAdmin.reduce(
                      (acc, ticket) => {
                        const category = ticket.category?.customName || ticket.category?.name || 'Unknown';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  ).map(([category, count], index, array) => (
                    <div
                      key={category}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          index < array.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                      }}
                    >
                      <Group justify='space-between' align='center'>
                        <Text size='sm'>{category}</Text>
                        <Badge variant='light' color={primaryLighter}>
                          {count}
                        </Badge>
                      </Group>
                    </div>
                  ))}
                </Stack>
              </Paper>
            </div>
          </div>

          {/* Security & Compliance Breakdown Tables */}
          <div>
            <Title order={3} mb='md'>
              Security & Compliance Analysis
            </Title>
            <Grid>
              <Grid.Col span={12}>
                <Card withBorder>
                  <Card.Section withBorder inheritPadding py='xs'>
                    <Text fw={500}>Login Activity Summary</Text>
                  </Card.Section>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Metric</Table.Th>
                        <Table.Th>Count</Table.Th>
                        <Table.Th>
                          <Group gap={6} align='center'>
                            <Text>Status</Text>
                            <Tooltip
                              label='Qualitative state for each metric (e.g., Normal, Active, Pending, Online) based on thresholds or current activity'
                              withArrow
                              position='top'
                            >
                              <IconInfoCircle
                                size={14}
                                style={{ cursor: 'help' }}
                                color='var(--mantine-color-dimmed)'
                              />
                            </Tooltip>
                          </Group>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>Failed Login Attempts</Table.Td>
                        <Table.Td>0</Table.Td>
                        <Table.Td>
                          <Badge style={{ backgroundColor: primaryLight, color: 'white' }} variant='light'>
                            Normal
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Successful Logins</Table.Td>
                        <Table.Td>{filteredUsers.length}</Table.Td>
                        <Table.Td>
                          <Badge color='dynamic' variant='light'>
                            Active
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Password Resets</Table.Td>
                        <Table.Td>0</Table.Td>
                        <Table.Td>
                          <Badge style={{ backgroundColor: getEarthyColorByIndex(1), color: 'white' }} variant='light'>
                            Pending
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Active Sessions</Table.Td>
                        <Table.Td>0</Table.Td>
                        <Table.Td>
                          <Badge style={{ backgroundColor: primaryLight, color: 'white' }} variant='light'>
                            Online
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Card>
              </Grid.Col>

              <Grid.Col span={12}>
                <Card withBorder>
                  <Card.Section withBorder inheritPadding py='xs'>
                    <Text fw={500}>Audit Trail Summary</Text>
                  </Card.Section>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Activity Type</Table.Th>
                        <Table.Th>Count</Table.Th>
                        <Table.Th>Last Activity</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>User Registrations</Table.Td>
                        <Table.Td>{filteredUsers.length}</Table.Td>
                        <Table.Td>
                          {filteredUsers.length > 0
                            ? new Date(
                                Math.max(
                                  ...filteredUsers.map(u =>
                                    new Date(u.createdAt).getTime()
                                  )
                                )
                              ).toLocaleDateString()
                            : 'N/A'}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Ticket Creations</Table.Td>
                        <Table.Td>{filteredTicketsForAdmin.length}</Table.Td>
                        <Table.Td>
                          {filteredTicketsForAdmin.length > 0
                            ? new Date(
                                Math.max(
                                  ...filteredTicketsForAdmin.map(t =>
                                    new Date(t.createdAt).getTime()
                                  )
                                )
                              ).toLocaleDateString()
                            : 'N/A'}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>
                          <Group gap={6} align='center'>
                            <Text>System Changes</Text>
                            <Tooltip
                              label='Administrative configuration updates such as role/permission changes, policy edits, or settings updates'
                              withArrow
                              position='top'
                            >
                              <IconInfoCircle
                                size={14}
                                style={{ cursor: 'help' }}
                                color='var(--mantine-color-dimmed)'
                              />
                            </Tooltip>
                          </Group>
                        </Table.Td>
                        <Table.Td>0</Table.Td>
                        <Table.Td>N/A</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>
                          <Group gap={6} align='center'>
                            <Text>Security Events</Text>
                            <Tooltip
                              label='Security-relevant activities such as lockouts, suspicious login patterns, MFA changes, or policy violations'
                              withArrow
                              position='top'
                            >
                              <IconInfoCircle
                                size={14}
                                style={{ cursor: 'help' }}
                                color='var(--mantine-color-dimmed)'
                              />
                            </Tooltip>
                          </Group>
                        </Table.Td>
                        <Table.Td>0</Table.Td>
                        <Table.Td>N/A</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Card>
              </Grid.Col>
            </Grid>
          </div>
          </div>
        </Stack>
      )}

      {/* Export Modal */}
      <Modal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title='Export Report'
      >
        <Stack>
          <Select
            label='Export Format'
            placeholder='Select format'
            data={[
              { value: 'pdf', label: 'PDF' },
              { value: 'excel', label: 'Excel' },
            ]}
            value={exportFormat}
            onChange={value => setExportFormat(value || 'pdf')}
          />
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleExportReport(exportFormat)}
              loading={exportReport.isPending}
            >
              Export
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
