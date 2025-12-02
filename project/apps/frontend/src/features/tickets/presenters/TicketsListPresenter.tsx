'use client';

import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Grid,
  Card,
  Badge,
  Stack,
  Pagination,
  ActionIcon,
  Menu,
  Modal,
  useMantineTheme,
  Skeleton,
} from '@mantine/core';
import {
  IconFilter,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconTicket,
  IconCalendar,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { Ticket, TicketStatus, TicketPriority } from '../../../types/unified';
import { SearchBar } from '../../../components/search/SearchBar';
import { BulkActionsBar } from '../../../components/bulk/BulkActionsBar';
import { BulkSelectCheckbox } from '../../../components/bulk/BulkSelectCheckbox';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { stripHtmlTags } from '../utils/ticket.utils';
import { TicketsListPresenterProps } from '../types/tickets.types';
import { formatShortDate } from '../../../lib/utils';

export function TicketsListPresenter({
  metrics,
  pagination,
  state,
  colors,
  handlers,
  search,
  bulk,
  searchFilters,
  isLoading = false,
  onSetSelectedTicket,
  onUpdateFilters,
  onAddRecentSearch,
  onCloseAdvancedSearch,
  onCloseSimpleFilters,
}: TicketsListPresenterProps) {
  const theme = useMantineTheme();
  const t = useTranslations('tickets');

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{t('title')}</Title>
          <Text c='dimmed'>Manage and track support tickets</Text>
          {metrics.hasActiveFilters && (
            <Text size='sm' c={theme.colors[theme.primaryColor][6]} mt='xs'>
              Showing {metrics.filteredCount} of{' '}
              {pagination?.total || 0}{' '}
              tickets
            </Text>
          )}
        </div>
      </Group>

      <Grid mb='md'>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SearchBar
            key={search.searchQuery || 'empty'}
            value={search.searchQuery}
            onChange={search.onSearchChange}
            onAdvancedSearch={search.onAdvancedSearch}
            onSimpleFilters={search.onSimpleFilters}
            recentSearches={search.recentSearches}
            onRecentSearchClick={search.onRecentSearchClick}
            onClearRecentSearches={search.onClearRecentSearches}
            onRemoveRecentSearch={search.onRemoveRecentSearch}
            debounceMs={1500}
            isLoading={search.isLoading}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            fullWidth
            onClick={handlers.onAdvancedSearchOpen}
            data-testid="tickets-advanced-search-button"
          >
            Advanced
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          {metrics.hasActiveFilters && (
            <Button
              variant='outline'
              leftSection={<IconX size={16} />}
              fullWidth
              onClick={handlers.onClearFilters}
              data-testid="tickets-clear-filters-button"
            >
              Clear Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <BulkActionsBar
        selectedTickets={bulk.selectedTickets}
        onClearSelection={bulk.onClearSelection}
        onBulkUpdate={bulk.onBulkUpdate}
        totalTickets={metrics.totalCount}
        isProcessing={bulk.isProcessing}
        selectedTicketsData={bulk.selectedTicketsData}
      />

      {metrics.tickets.length > 0 && (
        <Group mb='md'>
          <BulkSelectCheckbox
            checked={bulk.isAllSelected(metrics.tickets.map((t: Ticket) => t.id))}
            indeterminate={bulk.isIndeterminate(
              metrics.tickets.map((t: Ticket) => t.id)
            )}
            onChange={checked => {
              if (checked) {
                bulk.onSelectAll(metrics.tickets.map((t: Ticket) => t.id));
              } else {
                bulk.onClearSelection();
              }
            }}
            aria-label='Select all tickets'
          />
          <Text size='sm' c='dimmed'>
            Select all tickets
          </Text>
        </Group>
      )}

      <Stack gap='md'>
        {(isLoading || (search.isLoading && search.searchQuery)) ? (
          [...Array(5)].map((_, index) => (
            <Card key={index} shadow='sm' padding='lg' radius='md' withBorder>
              <Group justify='space-between' mb='sm'>
                <Group gap='sm'>
                  <Skeleton height={20} width={20} circle />
                  <Skeleton height={24} width={80} />
                  <Skeleton height={24} width={70} />
                  <Skeleton height={20} width={100} />
                </Group>
                <Skeleton height={28} width={28} circle />
              </Group>
              <Skeleton height={24} width='80%' mb='xs' />
              <Skeleton height={16} width='100%' mb={4} />
              <Skeleton height={16} width='90%' mb='sm' />
              <Group justify='space-between'>
                <Group gap='md'>
                  <Skeleton height={20} width={120} />
                  <Skeleton height={20} width={100} />
                  <Skeleton height={20} width={150} />
                </Group>
                <Skeleton height={24} width={80} />
              </Group>
            </Card>
          ))
        ) : (
          metrics.tickets.map((ticket: Ticket) => (
            <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder>
            <Group justify='space-between' mb='sm'>
              <Group gap='sm'>
                <BulkSelectCheckbox
                  checked={bulk.isSelected(ticket.id)}
                  onChange={() => bulk.onToggleTicket(ticket.id)}
                  aria-label={`Select ticket ${ticket.ticketNumber}`}
                />
                <Badge
                  color={colors.statusColors[ticket.status as TicketStatus]}
                  variant='light'
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge
                  color={colors.priorityColors[ticket.priority as TicketPriority]}
                  variant='outline'
                >
                  {ticket.priority}
                </Badge>
                <Text size='sm' c='dimmed'>
                  {ticket.ticketNumber}
                </Text>
              </Group>
              <Menu shadow='md' width={200} data-testid={`ticket-list-menu-${ticket.id}`}>
                <Menu.Target>
                  <ActionIcon variant='subtle' data-testid={`ticket-list-menu-button-${ticket.id}`}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => handlers.onViewTicket(ticket.id)}
                    data-testid={`ticket-list-view-${ticket.id}`}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => handlers.onEditTicket(ticket.id)}
                    data-testid={`ticket-list-edit-${ticket.id}`}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={() => {
                      onSetSelectedTicket(ticket);
                    }}
                    data-testid={`ticket-list-delete-${ticket.id}`}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Text
              fw={500}
              mb='xs'
              style={{ cursor: 'pointer' }}
              onClick={() => handlers.onViewTicket(ticket.id)}
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between'>
              <Group gap='md'>
                <Group gap={4}>
                  <IconUser size={14} />
                  <Text size='sm'>{ticket.requester.name}</Text>
                </Group>
                <Group gap={4}>
                  <IconCalendar size={14} />
                  <Text size='sm'>
                    {formatShortDate(ticket.createdAt)}
                  </Text>
                </Group>
                {ticket.assignedTo && (
                  <Group gap={4}>
                    <IconTicket size={14} />
                    <Text size='sm'>Assigned to {ticket.assignedTo.name}</Text>
                  </Group>
                )}
              </Group>
              <Badge variant='light' color='gray'>
                {ticket.category?.customName || ticket.category?.name || 'Unknown'}
              </Badge>
            </Group>
          </Card>
          ))
        )}
      </Stack>

      {!isLoading &&
        !(search.isLoading && search.searchQuery) &&
        metrics.tickets.length === 0 && (
          <Card shadow='sm' padding='xl' radius='md' withBorder>
            <Stack align='center' gap='md'>
              <IconTicket size={48} color='var(--mantine-color-dimmed)' />
              <Text size='lg' fw={500}>
                No tickets found
              </Text>
              <Text c='dimmed' ta='center'>
                No tickets match your current filters.
              </Text>
            </Stack>
          </Card>
        )}

      {pagination && pagination.totalPages > 1 && (
        <Group justify='center' mt='xl'>
          <Pagination
            value={state.currentPage}
            onChange={handlers.onPageChange}
            total={pagination.totalPages}
            data-testid="tickets-pagination"
          />
        </Group>
      )}

      <Modal
        opened={state.deleteModalOpen}
        onClose={handlers.onDeleteModalClose}
        title='Delete Ticket'
        centered
        data-testid="ticket-delete-modal"
      >
        <Text mb='md'>
          Are you sure you want to delete ticket #{state.selectedTicket?.ticketNumber}
          ? This action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='light' onClick={handlers.onDeleteModalClose} data-testid="ticket-delete-modal-cancel">
            Cancel
          </Button>
          <Button
            color={theme.colors[theme.primaryColor][9]}
            onClick={() =>
              state.selectedTicket?.id && handlers.onDeleteTicket(state.selectedTicket.id)
            }
            data-testid="ticket-delete-modal-confirm"
          >
            Delete
          </Button>
        </Group>
      </Modal>

      <AdvancedSearchModal
        opened={state.advancedSearchOpen}
        onClose={onCloseAdvancedSearch}
        initialCriteria={{
          query: searchFilters.search || '',
          status: (searchFilters.status as string[]) || [],
          priority: (searchFilters.priority as string[]) || [],
          category: (searchFilters.category as string[]) || [],
          impact: (searchFilters.impact as string[]) || [],
          assignedTo: searchFilters.assignedTo || [],
          requester: searchFilters.requester || [],
          createdFrom:
            typeof searchFilters.dateFrom === 'string' && searchFilters.dateFrom
              ? new Date(searchFilters.dateFrom)
              : undefined,
          createdTo:
            typeof searchFilters.dateTo === 'string' && searchFilters.dateTo
              ? new Date(searchFilters.dateTo)
              : undefined,
          minResolutionTime: (searchFilters as { minResolutionHours?: number })
            .minResolutionHours,
          maxResolutionTime: (searchFilters as { maxResolutionHours?: number })
            .maxResolutionHours,
          minSlaBreachTime: (searchFilters as { minSlaBreachHours?: number })
            .minSlaBreachHours,
          maxSlaBreachTime: (searchFilters as { maxSlaBreachHours?: number })
            .maxSlaBreachHours,
        }}
        onSearch={advancedFilters => {
          const searchCriteria = {
            search: advancedFilters.query || '',
            status: advancedFilters.status || [],
            priority: advancedFilters.priority || [],
            category: advancedFilters.category || [],
            impact: advancedFilters.impact || [],
            slaLevel: advancedFilters.slaLevel || [],
            assignedTo: advancedFilters.assignedTo || [],
            requester: advancedFilters.requester || [],
            dateFrom: advancedFilters.createdFrom || null,
            dateTo: advancedFilters.createdTo || null,
            minResolutionHours: advancedFilters.minResolutionTime,
            maxResolutionHours: advancedFilters.maxResolutionTime,
            minSlaBreachHours: advancedFilters.minSlaBreachTime,
            maxSlaBreachHours: advancedFilters.maxSlaBreachTime,
            tags: [],
            customFields: advancedFilters.customFields || {},
          };
          onUpdateFilters(searchCriteria);
          if (advancedFilters.query) {
            onAddRecentSearch(advancedFilters.query);
          }
        }}
      />

      <SimpleFiltersModal
        opened={state.simpleFiltersOpen}
        onClose={onCloseSimpleFilters}
        initialFilters={{
          status: (searchFilters.status as string[]) || [],
          priority: (searchFilters.priority as string[]) || [],
          category: (searchFilters.category as string[]) || [],
        }}
        onApply={filters => {
          onUpdateFilters(filters);
        }}
      />
    </Container>
  );
}

