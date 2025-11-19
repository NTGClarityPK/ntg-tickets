'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Card,
  List,
  ThemeIcon,
  Badge,
  Anchor,
  Divider,
  Grid,
  Alert,
  useMantineTheme,
} from '@mantine/core';
import {
  IconHelp,
  IconQuestionMark,
  IconBook,
  IconMail,
  IconPhone,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { RTLChevronRight } from '../ui/RTLIcon';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface HelpSystemProps {
  opened: boolean;
  onClose: () => void;
}

const getHelpSections = (t: (key: string) => string, primaryLight: string, primaryDark: string) => [
  {
    id: 'getting-started',
    title: t('gettingStarted'),
    icon: IconBook,
    content: {
      overview: t('welcomeMessage'),
      steps: [
        t('createFirstTicket'),
        t('fillRequiredInfo'),
        t('setPriorityImpact'),
        t('submitAndWait'),
        t('trackProgress'),
      ],
      tips: [
        t('beSpecific'),
        t('attachFiles'),
        t('chooseCategory'),
        t('setPriority'),
      ],
    },
  },
  {
    id: 'ticket-lifecycle',
    title: t('ticketLifecycle'),
    icon: IconQuestionMark,
    content: {
      overview: t('lifecycleOverview'),
      stages: [
        {
          status: 'NEW',
          description: t('newStatus'),
          color: primaryDark,
        },
        {
          status: 'OPEN',
          description: t('openStatus'),
          color: 'cyan',
        },
        {
          status: 'IN_PROGRESS',
          description: t('inProgressStatus'),
          color: 'orange',
        },
        {
          status: 'ON_HOLD',
          description: t('onHoldStatus'),
          color: primaryLight,
        },
        {
          status: 'RESOLVED',
          description: t('resolvedStatus'),
          color: primaryLight,
        },
        {
          status: 'CLOSED',
          description: t('closedStatus'),
          color: 'gray',
        },
        {
          status: 'REOPENED',
          description: t('reopenedStatus'),
          color: 'red',
        },
      ],
    },
  },
  {
    id: 'user-roles',
    title: t('userRolesPermissions'),
    icon: IconHelp,
    content: {
      overview: t('rolesOverview'),
      roles: [
        {
          role: t('endUserRole'),
          description: t('endUserDesc'),
          permissions: [
            t('createTickets'),
            t('viewOwnTickets'),
            t('addComments'),
            t('updateProfile'),
          ],
        },
        {
          role: t('supportStaffRole'),
          description: t('supportStaffDesc'),
          permissions: [
            t('viewAllTickets'),
            t('manageAssignedTickets'),
            t('addComments'),
            t('updateStatus'),
          ],
        },
        {
          role: t('supportManagerRole'),
          description: t('supportManagerDesc'),
          permissions: [
            t('manageAllTickets'),
            t('assignTickets'),
            t('viewReports'),
            t('manageStaff'),
          ],
        },
        {
          role: t('administratorRole'),
          description: t('administratorDesc'),
          permissions: [
            t('allPermissions'),
            t('systemConfiguration'),
            t('userManagement'),
            t('viewReports'),
          ],
        },
      ],
    },
  },
  {
    id: 'sla-management',
    title: t('slaResponseTimes'),
    icon: IconQuestionMark,
    content: {
      overview: t('slaOverview'),
      slaLevels: [
        {
          level: t('standardLevel'),
          responseTime: '8 business hours',
          resolutionTime: '5 business days',
          description: t('generalInquiries'),
        },
        {
          level: t('premiumLevel'),
          responseTime: '4 business hours',
          resolutionTime: '2 business days',
          description: t('higherUrgency'),
        },
        {
          level: t('criticalSupportLevel'),
          responseTime: t('immediate247'),
          resolutionTime: '4 business hours',
          description: t('criticalFailures'),
        },
      ],
    },
  },
  {
    id: 'best-practices',
    title: t('bestPractices'),
    icon: IconBook,
    content: {
      overview: t('practicesOverview'),
      practices: [
        {
          category: t('ticketCreation'),
          items: [
            t('useClearTitles'),
            t('provideDetailedDescription'),
            t('includeSteps'),
            t('attachScreenshots'),
            t('setAppropriatePriority'),
          ],
        },
        {
          category: t('communication'),
          items: [
            t('respondPromptly'),
            t('beSpecific'),
            t('provideFeedback'),
            t('useProfessionalLanguage'),
          ],
        },
        {
          category: t('followUp'),
          items: [
            t('checkTicketStatus'),
            t('confirmResolved'),
            t('provideSupportFeedback'),
            t('closeTickets'),
          ],
        },
      ],
    },
  },
  {
    id: 'troubleshooting',
    title: t('troubleshooting'),
    icon: IconQuestionMark,
    content: {
      overview: t('troubleshootingOverview'),
      issues: [
        {
          problem: t('cannotLogin'),
          solution: t('checkEmailPassword'),
          severity: t('highSeverity'),
        },
        {
          problem: t('ticketNotUpdating'),
          solution: t('refreshPage'),
          severity: t('mediumSeverity'),
        },
        {
          problem: t('fileUploadFails'),
          solution: t('checkFileSize'),
          severity: t('mediumSeverity'),
        },
        {
          problem: t('notificationsNotReceived'),
          solution: t('checkEmailSettings'),
          severity: t('lowSeverity'),
        },
      ],
    },
  },
];

const getQuickActions = (
  tTickets: (key: string) => string,
  tHelp: (key: string) => string
) => [
  {
    title: tTickets('createTicket'),
    description: tHelp('submitNewRequest'),
    action: 'navigate',
    target: '/tickets/create',
  },
  {
    title: tTickets('myTickets'),
    description: tHelp('checkTicketStatus'),
    action: 'navigate',
    target: '/tickets',
  },
  {
    title: tHelp('contactSupport'),
    description: tHelp('getImmediateHelp'),
    action: 'contact',
    target: 'support@ntg-ticket.com',
  },
];

export function HelpSystem({ opened, onClose }: HelpSystemProps) {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const t = useTranslations('help');
  const tTickets = useTranslations('tickets');
  const [activeSection, setActiveSection] = useState<string | null>(
    'getting-started'
  );

  const helpSections = getHelpSections(t, primaryLight, primaryDark);
  const quickActions = getQuickActions(tTickets, t);

  const handleQuickAction = (action: string, target: string) => {
    if (action === 'navigate') {
      window.location.href = target;
    } else if (action === 'contact') {
      window.location.href = `mailto:${target}`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return theme.primaryColor;
      default:
        return 'gray';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return IconX;
      case 'medium':
        return IconAlertTriangle;
      case 'low':
        return IconInfoCircle;
      default:
        return IconInfoCircle;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='sm'>
          <ThemeIcon size='sm' variant='light' color='red'>
            <IconHelp size={16} />
          </ThemeIcon>
          <Text size='lg' fw={600}>
            {t('title')}
          </Text>
        </Group>
      }
      size='xl'
      centered
    >
      <Grid>
        {/* Navigation Sidebar */}
        <Grid.Col span={4}>
          <Stack gap='sm'>
            <Text size='sm' fw={500} c='dimmed' mb='xs'>
              {t('helpTopics')}
            </Text>
            {helpSections.map(section => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'light' : 'subtle'}
                color={activeSection === section.id ? theme.primaryColor : 'gray'}
                justify='flex-start'
                leftSection={<section.icon size={16} />}
                onClick={() => setActiveSection(section.id)}
                fullWidth
              >
                {section.title}
              </Button>
            ))}

            <Divider my='md' />

            <Text size='sm' fw={500} c='dimmed' mb='xs'>
              Quick Actions
            </Text>
            {quickActions.map(action => (
              <Card
                key={`quick-action-${action.title}-${action.target}`}
                withBorder
                p='sm'
                radius='md'
                style={{ cursor: 'pointer' }}
                onClick={() => handleQuickAction(action.action, action.target)}
              >
                <Group justify='space-between'>
                  <div>
                    <Text size='sm' fw={500}>
                      {action.title}
                    </Text>
                    <Text size='xs' c='dimmed'>
                      {action.description}
                    </Text>
                  </div>
                  <RTLChevronRight size={16} />
                </Group>
              </Card>
            ))}

            <Divider my='md' />

            <Alert
              icon={<IconMail size={16} />}
              title={t('needMoreHelp')}
              color='red'
              variant='light'
            >
              <Text size='xs' mb='sm'>
                Contact our support team for personalized assistance.
              </Text>
              <Group gap='xs'>
                <Anchor href='mailto:support@ntg-ticket.com' size='xs'>
                  <IconMail size={12} style={{ marginRight: 4 }} />
                  Email Support
                </Anchor>
                <Anchor href='tel:+1-555-0123' size='xs'>
                  <IconPhone size={12} style={{ marginRight: 4 }} />
                  Call Support
                </Anchor>
              </Group>
            </Alert>
          </Stack>
        </Grid.Col>

        {/* Content Area */}
        <Grid.Col span={8}>
          <Stack gap='md'>
            {helpSections.map(
              section =>
                activeSection === section.id && (
                  <div key={section.id}>
                    <Group mb='md'>
                      <ThemeIcon size='lg' variant='light' color='red'>
                        <section.icon size={20} />
                      </ThemeIcon>
                      <div>
                        <Text size='xl' fw={600}>
                          {section.title}
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {section.content.overview}
                        </Text>
                      </div>
                    </Group>

                    {/* Getting Started */}
                    {section.id === 'getting-started' && (
                      <Stack gap='md'>
                        <Card withBorder p='md' radius='md'>
                          <Text size='sm' fw={500} mb='sm'>
                            Step-by-Step Guide
                          </Text>
                          <List spacing='sm' size='sm'>
                            {section.content.steps?.map((step, index) => (
                              <List.Item
                                key={`step-${step}`}
                                icon={
                                  <ThemeIcon
                                    size='sm'
                                    variant='light'
                                    color='red'
                                  >
                                    <Text size='xs' fw={600}>
                                      {index + 1}
                                    </Text>
                                  </ThemeIcon>
                                }
                              >
                                {step}
                              </List.Item>
                            ))}
                          </List>
                        </Card>

                        <Card withBorder p='md' radius='md' bg='green.0'>
                          <Text size='sm' fw={500} mb='sm' c='green.7'>
                            Pro Tips
                          </Text>
                          <List spacing='xs' size='sm'>
                            {section.content.tips?.map(tip => (
                              <List.Item
                                key={`tip-${tip}`}
                                icon={
                                  <ThemeIcon
                                    size='sm'
                                    variant='light'
                                    color='green'
                                  >
                                    <IconCheck size={12} />
                                  </ThemeIcon>
                                }
                              >
                                {tip}
                              </List.Item>
                            ))}
                          </List>
                        </Card>
                      </Stack>
                    )}

                    {/* Ticket Lifecycle */}
                    {section.id === 'ticket-lifecycle' && (
                      <Stack gap='sm'>
                        {section.content.stages?.map(stage => (
                          <Card
                            key={`stage-${stage.status}`}
                            withBorder
                            p='md'
                            radius='md'
                          >
                            <Group justify='space-between'>
                              <div>
                                <Badge
                                  color={stage.color}
                                  variant='light'
                                  mb='xs'
                                >
                                  {stage.status}
                                </Badge>
                                <Text size='sm'>{stage.description}</Text>
                              </div>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    {/* User Roles */}
                    {section.id === 'user-roles' && (
                      <Stack gap='md'>
                        {section.content.roles?.map(role => (
                          <Card
                            key={`role-${role.role}`}
                            withBorder
                            p='md'
                            radius='md'
                          >
                            <Text size='sm' fw={500} mb='xs'>
                              {role.role}
                            </Text>
                            <Text size='sm' c='dimmed' mb='sm'>
                              {role.description}
                            </Text>
                            <Text size='xs' fw={500} mb='xs'>
                              Permissions:
                            </Text>
                            <Group gap='xs'>
                              {role.permissions?.map(permission => (
                                <Badge
                                  key={`permission-${permission}`}
                                  size='xs'
                                  variant='light'
                                  color='red'
                                >
                                  {permission}
                                </Badge>
                              ))}
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    {/* SLA Management */}
                    {section.id === 'sla-management' && (
                      <Stack gap='md'>
                        {section.content.slaLevels?.map(sla => (
                          <Card
                            key={`sla-${sla.level}`}
                            withBorder
                            p='md'
                            radius='md'
                          >
                            <Text size='sm' fw={500} mb='xs'>
                              {sla.level} Support
                            </Text>
                            <Text size='sm' c='dimmed' mb='sm'>
                              {sla.description}
                            </Text>
                            <Grid>
                              <Grid.Col span={6}>
                                <Text size='xs' fw={500}>
                                  Response Time:
                                </Text>
                                <Text size='sm'>{sla.responseTime}</Text>
                              </Grid.Col>
                              <Grid.Col span={6}>
                                <Text size='xs' fw={500}>
                                  Resolution Time:
                                </Text>
                                <Text size='sm'>{sla.resolutionTime}</Text>
                              </Grid.Col>
                            </Grid>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    {/* Best Practices */}
                    {section.id === 'best-practices' && (
                      <Stack gap='md'>
                        {section.content.practices?.map(practice => (
                          <Card
                            key={`practice-${practice.category}`}
                            withBorder
                            p='md'
                            radius='md'
                          >
                            <Text size='sm' fw={500} mb='sm'>
                              {practice.category}
                            </Text>
                            <List spacing='xs' size='sm'>
                              {practice.items?.map(item => (
                                <List.Item
                                  key={`practice-item-${item}`}
                                  icon={
                                    <ThemeIcon
                                      size='sm'
                                      variant='light'
                                      color='green'
                                    >
                                      <IconCheck size={12} />
                                    </ThemeIcon>
                                  }
                                >
                                  {item}
                                </List.Item>
                              ))}
                            </List>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    {/* Troubleshooting */}
                    {section.id === 'troubleshooting' && (
                      <Stack gap='md'>
                        {section.content.issues?.map(issue => {
                          const SeverityIcon = getSeverityIcon(issue.severity);
                          return (
                            <Card
                              key={`troubleshooting-${issue.problem}`}
                              withBorder
                              p='md'
                              radius='md'
                            >
                              <Group mb='sm'>
                                <ThemeIcon
                                  size='sm'
                                  variant='light'
                                  color={getSeverityColor(issue.severity)}
                                >
                                  <SeverityIcon size={14} />
                                </ThemeIcon>
                                <Text size='sm' fw={500}>
                                  {issue.problem}
                                </Text>
                                <Badge
                                  size='xs'
                                  color={getSeverityColor(issue.severity)}
                                  variant='light'
                                >
                                  {issue.severity}
                                </Badge>
                              </Group>
                              <Text size='sm' c='dimmed'>
                                <strong>Solution:</strong> {issue.solution}
                              </Text>
                            </Card>
                          );
                        })}
                      </Stack>
                    )}
                  </div>
                )
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  );
}
