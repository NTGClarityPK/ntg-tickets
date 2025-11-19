'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Modal,
  Stack,
  TextInput,
  MultiSelect,
  Button,
  Group,
  Text,
  Card,
  Badge,
  ActionIcon,
  Grid,
  NumberInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  IconSearch,
  IconX,
  IconCalendar,
  IconUser,
  IconTag,
  IconClock,
} from '@tabler/icons-react';
import { useCategories } from '../../hooks/useCategories';
import { useUsers } from '../../hooks/useUsers';
import {
  IMPACT_OPTIONS,
  PRIORITY_OPTIONS,
  SLA_LEVEL_OPTIONS,
  STATUS_OPTIONS,
  URGENCY_OPTIONS,
} from '@/lib/constants';

export interface AdvancedSearchCriteria {
  // Basic search
  query?: string;

  // Ticket fields
  status?: string[];
  priority?: string[];
  category?: string[];
  subcategory?: string[];
  impact?: string[];
  urgency?: string[];
  slaLevel?: string[];

  // User fields
  requester?: string[];
  assignedTo?: string[];

  // Date fields
  createdFrom?: Date;
  createdTo?: Date;
  dueFrom?: Date;
  dueTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;

  // Numeric fields
  minResolutionTime?: number;
  maxResolutionTime?: number;
  minSlaBreachTime?: number;
  maxSlaBreachTime?: number;

  // Custom fields
  customFields?: Record<string, unknown>;
}

interface AdvancedSearchModalProps {
  opened: boolean;
  onClose: () => void;
  onSearch: (criteria: AdvancedSearchCriteria) => void;
  initialCriteria?: AdvancedSearchCriteria;
}

export function AdvancedSearchModal({
  opened,
  onClose,
  onSearch,
  initialCriteria = {},
}: AdvancedSearchModalProps) {
  const t = useTranslations('common');
  const tTickets = useTranslations('tickets');
  // activeFilters is now computed using useMemo

  const { data: categories } = useCategories();
  const { data: users } = useUsers();

  const form = useForm<AdvancedSearchCriteria>({
    initialValues: {
      query: initialCriteria.query || '',
      status: initialCriteria.status || [],
      priority: initialCriteria.priority || [],
      category: initialCriteria.category || [],
      subcategory: initialCriteria.subcategory || [],
      impact: initialCriteria.impact || [],
      urgency: initialCriteria.urgency || [],
      slaLevel: initialCriteria.slaLevel || [],
      requester: initialCriteria.requester || [],
      assignedTo: initialCriteria.assignedTo || [],
      createdFrom: initialCriteria.createdFrom,
      createdTo: initialCriteria.createdTo,
      dueFrom: initialCriteria.dueFrom,
      dueTo: initialCriteria.dueTo,
      updatedFrom: initialCriteria.updatedFrom,
      updatedTo: initialCriteria.updatedTo,
      minResolutionTime: initialCriteria.minResolutionTime,
      maxResolutionTime: initialCriteria.maxResolutionTime,
      minSlaBreachTime: initialCriteria.minSlaBreachTime,
      maxSlaBreachTime: initialCriteria.maxSlaBreachTime,
      customFields: initialCriteria.customFields || {},
    },
  });

  // Memoize the form setter to avoid infinite re-renders
  const setFormValues = useCallback((values: AdvancedSearchCriteria) => {
    form.setValues(values);
  }, [form]);

  // Track previous initialCriteria to avoid unnecessary updates
  const prevInitialCriteriaRef = useRef<AdvancedSearchCriteria>(initialCriteria);

  // Update form values when modal opens with new initialCriteria
  useEffect(() => {
    if (opened) {
      // Only update if initialCriteria has actually changed
      const hasChanged = JSON.stringify(prevInitialCriteriaRef.current) !== JSON.stringify(initialCriteria);
      
      if (hasChanged) {
        const newValues = {
          query: initialCriteria.query || '',
          status: initialCriteria.status || [],
          priority: initialCriteria.priority || [],
          category: initialCriteria.category || [],
          subcategory: initialCriteria.subcategory || [],
          impact: initialCriteria.impact || [],
          urgency: initialCriteria.urgency || [],
          slaLevel: initialCriteria.slaLevel || [],
          requester: initialCriteria.requester || [],
          assignedTo: initialCriteria.assignedTo || [],
          createdFrom: initialCriteria.createdFrom,
          createdTo: initialCriteria.createdTo,
          dueFrom: initialCriteria.dueFrom,
          dueTo: initialCriteria.dueTo,
          updatedFrom: initialCriteria.updatedFrom,
          updatedTo: initialCriteria.updatedTo,
          minResolutionTime: initialCriteria.minResolutionTime,
          maxResolutionTime: initialCriteria.maxResolutionTime,
          minSlaBreachTime: initialCriteria.minSlaBreachTime,
          maxSlaBreachTime: initialCriteria.maxSlaBreachTime,
          customFields: initialCriteria.customFields || {},
        };
        
        setFormValues(newValues);
        prevInitialCriteriaRef.current = initialCriteria;
      }
    }
  }, [opened, initialCriteria, setFormValues]);

  // Update active filters when form values change
  const activeFilters = useMemo(() => {
    const filters: Array<{ id: string; label: string }> = [];
    const values = form.values;
    if (values.query) filters.push({ id: 'query', label: 'Search Query' });
    if (values.status?.length)
      filters.push({ id: 'status', label: `${values.status.length} Status` });
    if (values.priority?.length)
      filters.push({
        id: 'priority',
        label: `${values.priority.length} Priority`,
      });
    if (values.category?.length)
      filters.push({
        id: 'category',
        label: `${values.category.length} Category`,
      });
    if (values.subcategory?.length)
      filters.push({
        id: 'subcategory',
        label: `${values.subcategory.length} Subcategory`,
      });
    if (values.impact?.length)
      filters.push({ id: 'impact', label: `${values.impact.length} Impact` });
    if (values.urgency?.length)
      filters.push({
        id: 'urgency',
        label: `${values.urgency.length} Urgency`,
      });
    if (values.slaLevel?.length)
      filters.push({
        id: 'slaLevel',
        label: `${values.slaLevel.length} SLA Level`,
      });
    if (values.requester?.length)
      filters.push({
        id: 'requester',
        label: `${values.requester.length} Requester`,
      });
    if (values.assignedTo?.length)
      filters.push({
        id: 'assignedTo',
        label: `${values.assignedTo.length} Assignee`,
      });
    if (values.createdFrom || values.createdTo)
      filters.push({ id: 'createdDate', label: 'Created Date' });
    if (values.dueFrom || values.dueTo)
      filters.push({ id: 'dueDate', label: 'Due Date' });
    if (values.updatedFrom || values.updatedTo)
      filters.push({ id: 'updatedDate', label: 'Updated Date' });
    if (values.minResolutionTime || values.maxResolutionTime)
      filters.push({ id: 'resolutionTime', label: 'Resolution Time' });
    if (values.minSlaBreachTime || values.maxSlaBreachTime)
      filters.push({ id: 'slaBreachTime', label: 'SLA Breach Duration' });

    return filters;
  }, [form.values]);

  const handleSubmit = (values: AdvancedSearchCriteria) => {
    // Remove empty values
    const cleanValues = Object.fromEntries(
      Object.entries(values).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value instanceof Date) return true;
        if (typeof value === 'number') return value > 0;
        return Boolean(value);
      })
    );

    onSearch(cleanValues as AdvancedSearchCriteria);
    onClose();
  };

  const removeFilter = (filterId: string) => {
    const next = { ...form.values } as AdvancedSearchCriteria;
    switch (filterId) {
      case 'query':
        next.query = '';
        break;
      case 'status':
        next.status = [];
        break;
      case 'priority':
        next.priority = [];
        break;
      case 'category':
        next.category = [];
        next.subcategory = [];
        break;
      case 'subcategory':
        next.subcategory = [];
        break;
      case 'impact':
        next.impact = [];
        break;
      case 'urgency':
        next.urgency = [];
        break;
      case 'slaLevel':
        next.slaLevel = [];
        break;
      case 'requester':
        next.requester = [];
        break;
      case 'assignedTo':
        next.assignedTo = [];
        break;
      case 'createdDate':
        next.createdFrom = undefined;
        next.createdTo = undefined;
        break;
      case 'dueDate':
        next.dueFrom = undefined;
        next.dueTo = undefined;
        break;
      case 'updatedDate':
        next.updatedFrom = undefined;
        next.updatedTo = undefined;
        break;
      case 'resolutionTime':
        next.minResolutionTime = undefined;
        next.maxResolutionTime = undefined;
        break;
      case 'slaBreachTime':
        next.minSlaBreachTime = undefined;
        next.maxSlaBreachTime = undefined;
        break;
      default:
        break;
    }

    form.setValues(next);

    const cleanValues = Object.fromEntries(
      Object.entries(next).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value instanceof Date) return true;
        if (typeof value === 'number') return value > 0;
        return Boolean(value);
      })
    ) as AdvancedSearchCriteria;
    onSearch(cleanValues);
  };

  const statusOptions = STATUS_OPTIONS.map(option => ({
    ...option,
    label: t(option.value.toLowerCase().replace('_', '_')),
  }));

  const priorityOptions = PRIORITY_OPTIONS.map(option => ({
    ...option,
    label: t(option.value.toLowerCase()),
  }));

  const impactOptions = IMPACT_OPTIONS.map(option => ({
    ...option,
    label: t(option.value.toLowerCase()),
  }));

  const urgencyOptions = URGENCY_OPTIONS.map(option => ({
    ...option,
    label: t(option.value.toLowerCase()),
  }));

  const slaLevelOptions = SLA_LEVEL_OPTIONS.map(option => ({
    ...option,
    label: t(option.value.toLowerCase().replace('_', '_')),
  }));

  const categoryOptions =
    categories?.map(cat => ({
      value: cat.id, // Use category ID instead of name
      label: cat.customName || cat.name.replace('_', ' '),
    })) || [];

  const subcategoryOptions =
    categories
      ?.filter(cat => form.values.category?.includes(cat.id))
      ?.flatMap(
        cat =>
          (
            cat as {
              subcategories?: Array<{ name: string; description?: string }>;
            }
          ).subcategories?.map(sub => ({
            value: sub.name,
            label: sub.description || sub.name,
          })) || []
      ) || [];

  const userOptions =
    users?.map(user => ({
      value: user.id,
      label: user.name,
    })) || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={tTickets('advancedSearch')}
      size='lg'
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md'>
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <Card withBorder p='md' radius='md'>
              <Group justify='space-between' mb='sm'>
                <Text size='sm' fw={500}>
                  {t('activeFilters')} ({activeFilters.length})
                </Text>
              </Group>
              <Group gap='xs'>
                {activeFilters.map(filter => (
                  <Badge
                    key={`filter-${filter.id}`}
                    variant='light'
                    color='red'
                    rightSection={
                      <ActionIcon
                        size='xs'
                        color='red'
                        variant='transparent'
                        onClick={() => removeFilter(filter.id)}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    }
                  >
                    {filter.label}
                  </Badge>
                ))}
              </Group>
            </Card>
          )}

          {/* Basic Search */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconSearch size={16} />
              <Text size='sm' fw={500}>
                {t('basicSearch')}
              </Text>
            </Group>
            <TextInput
              label={t('searchQuery')}
              placeholder={tTickets('searchPlaceholder')}
              leftSection={<IconSearch size={16} />}
              {...form.getInputProps('query')}
            />
          </Card>

          {/* Ticket Properties */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconTag size={16} />
              <Text size='sm' fw={500}>
                {tTickets('ticketProperties')}
              </Text>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('status')}
                  placeholder={t('selectStatus')}
                  data={statusOptions}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('priority')}
                  placeholder={t('selectPriority')}
                  data={priorityOptions}
                  {...form.getInputProps('priority')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('category')}
                  placeholder={t('selectCategory')}
                  data={categoryOptions}
                  {...form.getInputProps('category')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('subcategory')}
                  placeholder={t('selectSubcategory')}
                  data={subcategoryOptions}
                  {...form.getInputProps('subcategory')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('impact')}
                  placeholder={t('selectImpact')}
                  data={impactOptions}
                  {...form.getInputProps('impact')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('urgency')}
                  placeholder={t('selectUrgency')}
                  data={urgencyOptions}
                  {...form.getInputProps('urgency')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <MultiSelect
                  label={tTickets('slaLevel')}
                  placeholder={t('selectSlaLevel')}
                  data={slaLevelOptions}
                  {...form.getInputProps('slaLevel')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* User Assignment */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconUser size={16} />
              <Text size='sm' fw={500}>
                {tTickets('userAssignment')}
              </Text>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('requester')}
                  placeholder={t('selectRequesters')}
                  data={userOptions}
                  searchable
                  {...form.getInputProps('requester')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label={tTickets('assignedTo')}
                  placeholder={t('selectAssignees')}
                  data={userOptions}
                  searchable
                  {...form.getInputProps('assignedTo')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Date Ranges */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconCalendar size={16} />
              <Text size='sm' fw={500}>
                {tTickets('dateRanges')}
              </Text>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('createdFrom')}
                  placeholder={t('selectStartDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('createdFrom')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('createdTo')}
                  placeholder={t('selectEndDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('createdTo')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('dueFrom')}
                  placeholder={t('selectStartDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('dueFrom')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('dueTo')}
                  placeholder={t('selectEndDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('dueTo')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('updatedFrom')}
                  placeholder={t('selectStartDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('updatedFrom')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label={tTickets('updatedTo')}
                  placeholder={t('selectEndDate')}
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('updatedTo')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Resolution Time */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconClock size={16} />
              <Text size='sm' fw={500}>
                {tTickets('resolutionTime')} ({t('hours')})
              </Text>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label={t('minimum')}
                  placeholder={t('minHours')}
                  min={0}
                  {...form.getInputProps('minResolutionTime')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label={t('maximum')}
                  placeholder={t('maxHours')}
                  min={0}
                  {...form.getInputProps('maxResolutionTime')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* SLA Breach Duration */}
          <Card withBorder p='md' radius='md'>
            <Group mb='sm'>
              <IconClock size={16} />
              <Text size='sm' fw={500}>
                SLA Breach Duration ({t('hours')})
              </Text>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label={t('minimum')}
                  placeholder={t('minHours')}
                  min={0}
                  {...form.getInputProps('minSlaBreachTime')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label={t('maximum')}
                  placeholder={t('maxHours')}
                  min={0}
                  {...form.getInputProps('maxSlaBreachTime')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Actions */}
          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type='submit' leftSection={<IconSearch size={16} />}>
              {t('search')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
