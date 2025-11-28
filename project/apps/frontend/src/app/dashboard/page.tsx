'use client';

import { useState, useMemo, useEffect } from 'react';
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
  ActionIcon,
} from '@mantine/core';
import {
  IconFileExport,
  IconRefresh,
  IconUsers,
  IconTicket,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconKey,
  IconPlayerPause,
  IconCalendar,
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
import { useWorkflows } from '../../hooks/useWorkflows';

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
  const dashboardT = useTranslations('dashboard');
  const { user } = useAuthStore();
  const isSmall = useMediaQuery('(max-width: 48em)');
  const { getEarthyColorByIndex, primaryLight, primaryLighter, primaryDark } = useDynamicTheme();
  const { getActiveWorkflow, getDashboardStats, getStaffPerformance } = useWorkflows();
  const [activeWorkflow, setActiveWorkflow] = useState<{ id?: string; workingStatuses?: string[]; doneStatuses?: string[] } | null>(null);
  const [dashboardStats, setDashboardStats] = useState<{ all: number; working: number; done: number; hold: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [staffPerformance, setStaffPerformance] = useState<Array<{
    name: string;
    all: number;
    working: number;
    done: number;
    hold: number;
    overdue: number;
    performance: number;
  }>>([]);
  const [staffPerformanceLoading, setStaffPerformanceLoading] = useState(true);

  const [filters, setFilters] = useState<ReportFilters>({});
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('custom');

  // Fetch active workflow and dashboard stats on mount
  useEffect(() => {

    let isMounted = true;

    const fetchData = async () => {
      try {
        const workflow = await getActiveWorkflow();
        if (isMounted) {
          setActiveWorkflow(workflow ? {
            id: workflow.id,
            workingStatuses: workflow.workingStatuses,
            doneStatuses: workflow.doneStatuses
          } : null);
        }

        const stats = await getDashboardStats();
        if (isMounted) {
          setDashboardStats(stats);
          setStatsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    setStatsLoading(true);
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [getActiveWorkflow, getDashboardStats, user?.activeRole]);

  // Fetch staff performance for Support Manager
  useEffect(() => {
    if (user?.activeRole !== 'SUPPORT_MANAGER') {
      setStaffPerformanceLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStaffPerformance = async () => {
      try {
        setStaffPerformanceLoading(true);
        const performance = await getStaffPerformance();
        if (isMounted) {
          setStaffPerformance(performance);
          setStaffPerformanceLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setStaffPerformanceLoading(false);
        }
      }
    };

    fetchStaffPerformance();

    return () => {
      isMounted = false;
    };
  }, [getStaffPerformance, user?.activeRole]);

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
    return true;
  });

  // Get status categorization from active workflow or use defaults
  // Check if arrays exist and have values, otherwise use defaults
  const workingStatusIds = (activeWorkflow?.workingStatuses && activeWorkflow.workingStatuses.length > 0)
    ? activeWorkflow.workingStatuses
    : ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
  const doneStatusIds = (activeWorkflow?.doneStatuses && activeWorkflow.doneStatuses.length > 0)
    ? activeWorkflow.doneStatuses
    : ['CLOSED', 'RESOLVED'];

  // Extract workflowId and statusName from workflow-specific format (workflow-{id}-{status})
  // Returns { workflowId: string | null, statusName: string }
  const extractWorkflowAndStatus = (statusId: string): { workflowId: string | null; statusName: string } => {
    if (statusId.startsWith('workflow-')) {
      // Match pattern: workflow-{workflowId}-{statusName}
      // Workflow IDs are UUIDs which may contain hyphens
      const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
      if (match && match[1] && match[2]) {
        return { workflowId: match[1], statusName: match[2] };
      }
      // Fallback: if regex doesn't match, try finding last hyphen
      const lastHyphenIndex = statusId.lastIndexOf('-');
      if (lastHyphenIndex > 0 && lastHyphenIndex < statusId.length - 1) {
        const workflowIdPart = statusId.substring(8, lastHyphenIndex); // Skip "workflow-"
        return { workflowId: workflowIdPart, statusName: statusId.substring(lastHyphenIndex + 1) };
      }
    }
    // Not a workflow-specific ID, return as plain status
    return { workflowId: null, statusName: statusId };
  };

  // Normalize status names for comparison (handle case and space differences)
  // Converts "New" -> "NEW", "In Progress" -> "IN_PROGRESS", etc.
  const normalizeStatus = (status: string): string => {
    return status
      .toUpperCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();
  };

  // Build maps: workflowId -> Set of normalized status names
  // Match backend logic: statuses without workflow prefix are mapped to active workflow ID
  const workingStatusesByWorkflow = new Map<string | null, Set<string>>();
  const doneStatusesByWorkflow = new Map<string | null, Set<string>>();

  workingStatusIds.forEach(statusId => {
    const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
    const normalized = normalizeStatus(statusName);
    // Map null workflowId to active workflow ID (like backend does)
    const mappedWorkflowId = workflowId === null && activeWorkflow?.id ? activeWorkflow.id : workflowId;
    if (!workingStatusesByWorkflow.has(mappedWorkflowId)) {
      workingStatusesByWorkflow.set(mappedWorkflowId, new Set());
    }
    const statusSet = workingStatusesByWorkflow.get(mappedWorkflowId);
    if (statusSet) {
      statusSet.add(normalized);
    }
  });

  doneStatusIds.forEach(statusId => {
    const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
    const normalized = normalizeStatus(statusName);
    // Map null workflowId to active workflow ID (like backend does)
    const mappedWorkflowId = workflowId === null && activeWorkflow?.id ? activeWorkflow.id : workflowId;
    if (!doneStatusesByWorkflow.has(mappedWorkflowId)) {
      doneStatusesByWorkflow.set(mappedWorkflowId, new Set());
    }
    const statusSet = doneStatusesByWorkflow.get(mappedWorkflowId);
    if (statusSet) {
      statusSet.add(normalized);
    }
  });

  // Helper function to check if a ticket matches a workflow-status combination
  // Matches backend logic exactly: for each categorized status, check both the categorized workflow and active workflow
  const matchesWorkflowStatus = (
    ticket: Ticket,
    workflowStatusMap: Map<string | null, Set<string>>
  ): boolean => {
    const ticketWorkflowId = ticket.workflowId || null;
    const normalizedTicketStatus = normalizeStatus(ticket.status);

    // Iterate through all workflow-status combinations in the map (like backend does)
    // For each status categorized for a workflow, check if ticket matches
    for (const [categorizedWorkflowId, statuses] of Array.from(workflowStatusMap.entries())) {
      if (!statuses.has(normalizedTicketStatus)) {
        continue; // Status doesn't match, skip
      }

      // Map null to active workflow ID (like backend does when building the map)
      const mappedCategorizedWorkflowId = categorizedWorkflowId === null && activeWorkflow?.id
        ? activeWorkflow.id
        : categorizedWorkflowId;

      // Backend logic: check if ticket's workflowId matches the categorized workflowId
      if (ticketWorkflowId === mappedCategorizedWorkflowId) {
        return true;
      }

      // Backend fallback: if categorized workflowId !== activeWorkflow.id,
      // also check if ticket's workflowId === activeWorkflow.id (for the same status)
      if (activeWorkflow?.id &&
        mappedCategorizedWorkflowId !== null &&
        mappedCategorizedWorkflowId !== activeWorkflow.id &&
        ticketWorkflowId === activeWorkflow.id) {
        return true;
      }

      // Handle null workflowId case (tickets without workflow)
      if (categorizedWorkflowId === null && ticketWorkflowId === null) {
        return true;
      }
    }

    return false;
  };

  // Use backend stats if available (for consistency), otherwise calculate locally
  // When filters are applied, we need to calculate locally based on filtered tickets
  const hasFilters = Object.keys(filters).length > 0;

  const allTickets = filteredTickets;
  const workingTickets = hasFilters
    ? filteredTickets.filter((ticket: Ticket) =>
      matchesWorkflowStatus(ticket, workingStatusesByWorkflow)
    )
    : [];
  const doneTickets = hasFilters
    ? filteredTickets.filter((ticket: Ticket) =>
      matchesWorkflowStatus(ticket, doneStatusesByWorkflow)
    )
    : [];
  const holdTickets = hasFilters
    ? filteredTickets.filter(
      (ticket: Ticket) =>
        !matchesWorkflowStatus(ticket, workingStatusesByWorkflow) &&
        !matchesWorkflowStatus(ticket, doneStatusesByWorkflow))
    : [];

  // Use backend stats when no filters are applied
  const finalStats = hasFilters
    ? {
      all: allTickets.length,
      working: workingTickets.length,
      done: doneTickets.length,
      hold: holdTickets.length,
    }
    : (dashboardStats || { all: 0, working: 0, done: 0, hold: 0 });

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

      // Filter by category
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(ticket.category?.id || '')) {
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

  // Helper functions for quick date filters
  const handleQuickFilter = (filterType: string) => {
    setSelectedQuickFilter(filterType);

    if (filterType === 'custom') {
      // Don't set dates for custom, let user select
      return;
    }

    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date;

    switch (filterType) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        dateFrom = new Date(now.getFullYear(), now.getMonth(), diff);
        dateFrom.setHours(0, 0, 0, 0);
        dateTo = new Date(dateFrom);
        dateTo.setDate(dateFrom.getDate() + 6);
        dateTo.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom.setHours(0, 0, 0, 0);
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        dateFrom.setHours(0, 0, 0, 0);
        dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        return;
    }

    setFilters({
      ...filters,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    });
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
  if (ticketsLoading || auditLogsLoading || statsLoading || (user?.activeRole === 'SUPPORT_MANAGER' && staffPerformanceLoading)) {
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
    // Define stats based on backend API (when no filters) or local calculation (when filters applied)
    const stats = [
      {
        title: dashboardT('allTickets') || 'All',
        value: finalStats.all,
        icon: IconTicket,
        color: primaryLight,
        tooltip: user?.activeRole === 'END_USER'
          ? 'Total number of tickets you have created'
          : user?.activeRole === 'SUPPORT_STAFF'
            ? 'Total tickets assigned to you'
            : 'Total tickets in the system',
      },
      {
        title: dashboardT('workingTickets') || 'Working',
        value: finalStats.working,
        icon: IconClock,
        color: primaryLight,
        tooltip: 'Tickets in working statuses (based on active workflow)',
      },
      {
        title: dashboardT('doneTickets') || 'Done',
        value: finalStats.done,
        icon: IconCheck,
        color: primaryLight,
        tooltip: 'Tickets in done statuses (based on active workflow)',
      },
      {
        title: dashboardT('holdTickets') || 'Hold',
        value: finalStats.hold,
        icon: IconPlayerPause,
        color: primaryLight,
        tooltip: 'Tickets in hold statuses (not working or done)',
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
              <ActionIcon
                variant='light'
                size='lg'
                onClick={() => window.location.reload()}
                title='Refresh'
              >
                <IconRefresh size={20} />
              </ActionIcon>
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={() => setExportModalOpen(true)}
              >
                Export Report
              </Button>
            </Group>
          </Group>

          {/* Filters */}
          <Card className="pdf-hide-elements" withBorder>
            <Stack gap="md">
              {/* Quick Filters Section */}
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Quick Filters:
                </Text>
                <Group gap="xs">
                  <Button
                    variant={selectedQuickFilter === 'today' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('today')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'today' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisWeek' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisWeek')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisWeek' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisMonth' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisMonth')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisMonth' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Month
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisYear' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisYear')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisYear' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Year
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'custom' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => {
                      setSelectedQuickFilter('custom');
                      handleQuickFilter('custom');
                    }}
                    style={{
                      backgroundColor: selectedQuickFilter === 'custom' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    Custom Range
                  </Button>
                </Group>
              </div>

              {/* Date Range Inputs - Only show when Custom Range is selected */}
              {selectedQuickFilter === 'custom' && (
                <Grid>
                  <Grid.Col span={6}>
                    <DatePickerInput
                      label="From"
                      placeholder="Select start date"
                      value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                      onChange={(date: Date | null) => {
                        setSelectedQuickFilter('custom');
                        setFilters({ ...filters, dateFrom: date?.toISOString() });
                      }}
                      clearable
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <DatePickerInput
                      label="To"
                      placeholder="Select end date"
                      value={filters.dateTo ? new Date(filters.dateTo) : null}
                      onChange={(date: Date | null) => {
                        setSelectedQuickFilter('custom');
                        setFilters({ ...filters, dateTo: date?.toISOString() });
                      }}
                      clearable
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Grid.Col>
                </Grid>
              )}

              {/* Additional Filters - Category, Status, Priority */}
              <Grid>
                <Grid.Col span={4}>
                  <MultiSelect
                    label="Category"
                    placeholder="Select category"
                    data={categoryOptions}
                    value={filters.category || []}
                    onChange={value =>
                      setFilters({ ...filters, category: value })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <MultiSelect
                    label="Status"
                    placeholder="Select status"
                    data={STATUS_OPTIONS}
                    value={filters.status || []}
                    onChange={value =>
                      setFilters({ ...filters, status: value })
                    }
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <MultiSelect
                    label="Priority"
                    placeholder="Select priority"
                    data={PRIORITY_OPTIONS}
                    value={filters.priority || []}
                    onChange={value =>
                      setFilters({ ...filters, priority: value })
                    }
                    clearable
                  />
                </Grid.Col>
              </Grid>

              {/* Clear Filters Button */}
              <Group justify="flex-end">
                <Button
                  variant="outline"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    setFilters({});
                    setSelectedQuickFilter('custom');
                  }}
                  disabled={Object.keys(filters).length === 0}
                >
                  Clear All Filters
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Summary Count Boxes */}
          <div id="report-overview-section">
            <Grid>
              {stats.map(stat => (
                <Grid.Col
                  key={stat.title}
                  span={{
                    base: 12,
                    sm: user?.activeRole === 'END_USER' ? 6 : 6,
                    md: user?.activeRole === 'END_USER' ? 3 : 3,
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
              <div id="report-content-section" style={{ marginTop: '1.5rem' }}>
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

                  {/* Right Column - Status */}
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
                    </Stack>
                  </Grid.Col>
                </Grid>
              </div>
            )}

          {/* Staff Performance Section - Support Manager Only */}
          {user?.activeRole === 'SUPPORT_MANAGER' && (
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
                        All
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
                        Working
                        <Tooltip
                          label='Tickets in working status (based on active workflow)'
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
                        Done
                        <Tooltip
                          label='Tickets in done status (based on active workflow)'
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
                        Hold
                        <Tooltip
                          label='Tickets in hold status (not working or done)'
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
                          label='Tickets in Working state that have passed their due date'
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
                          label='Percentage of all tickets to tickets where status is Done but were completed before due date, or are in Working state and not past due date'
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
                  {staffPerformance.length > 0 ? (
                    staffPerformance.map(staff => {
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
                              {staff.all}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' color='dynamic'>
                              {staff.working}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' color='dynamic'>
                              {staff.done}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' color='dynamic'>
                              {staff.hold}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant='light' style={{ backgroundColor: getEarthyColorByIndex(0), color: 'white' }}>
                              {staff.overdue}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant='light'
                              style={{
                                backgroundColor: staff.performance >= 90
                                  ? primaryLight
                                  : staff.performance >= 70
                                    ? primaryLighter
                                    : primaryDark,
                                color: 'white'
                              }}
                            >
                              {staff.performance}%
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                        <Text c='dimmed'>No staff performance data available</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
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
          <ActionIcon
            variant='light'
            size='lg'
            onClick={() => window.location.reload()}
            title='Refresh'
          >
            <IconRefresh size={20} />
          </ActionIcon>
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
          <Card className="pdf-hide-elements" withBorder>
            <Stack gap="md">
              {/* Quick Filters Section */}
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Quick Filters:
                </Text>
                <Group gap="xs">
                  <Button
                    variant={selectedQuickFilter === 'today' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('today')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'today' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisWeek' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisWeek')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisWeek' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisMonth' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisMonth')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisMonth' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Month
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'thisYear' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => handleQuickFilter('thisYear')}
                    style={{
                      backgroundColor: selectedQuickFilter === 'thisYear' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    This Year
                  </Button>
                  <Button
                    variant={selectedQuickFilter === 'custom' ? 'filled' : 'light'}
                    size="sm"
                    onClick={() => {
                      setSelectedQuickFilter('custom');
                      handleQuickFilter('custom');
                    }}
                    style={{
                      backgroundColor: selectedQuickFilter === 'custom' ? primaryDark : primaryLighter,
                      color: 'white',
                    }}
                  >
                    Custom Range
                  </Button>
                </Group>
              </div>

              {/* Date Range Inputs - Only show when Custom Range is selected */}
              {selectedQuickFilter === 'custom' && (
                <Grid>
                  <Grid.Col span={6}>
                    <DatePickerInput
                      label="From"
                      placeholder="Select start date"
                      value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                      onChange={(date: Date | null) => {
                        setSelectedQuickFilter('custom');
                        setFilters({ ...filters, dateFrom: date?.toISOString() });
                      }}
                      clearable
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <DatePickerInput
                      label="To"
                      placeholder="Select end date"
                      value={filters.dateTo ? new Date(filters.dateTo) : null}
                      onChange={(date: Date | null) => {
                        setSelectedQuickFilter('custom');
                        setFilters({ ...filters, dateTo: date?.toISOString() });
                      }}
                      clearable
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Grid.Col>
                </Grid>
              )}

              <Grid>
                <Grid.Col span={12}>
                  <MultiSelect
                    label="Category"
                    placeholder="Select category"
                    data={categoryOptions}
                    value={filters.category || []}
                    onChange={value =>
                      setFilters({ ...filters, category: value })
                    }
                    clearable
                  />
                </Grid.Col>
             
              </Grid>


              {/* Clear Filters Button */}
              <Group justify="flex-end">
                <Button
                  variant="outline"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    setFilters({});
                    setSelectedQuickFilter('custom');
                  }}
                  disabled={Object.keys(filters).length === 0}
                >
                  Clear All Filters
                </Button>
              </Group>
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
