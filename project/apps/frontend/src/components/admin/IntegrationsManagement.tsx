'use client';

import { useState } from 'react';
import {
  Card,
  Text,
  Button,
  Group,
  Stack,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Switch,
  Grid,
  Alert,
  Loader,
  Center,
  Tooltip,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTestPipe,
  IconWebhook,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconPlug,
  IconApi,
  IconShield,
  IconMail,
  IconBrandSlack,
  IconBrandTeams,
  IconBrandX,
  IconDatabase,
} from '@tabler/icons-react';
import { useIntegrations } from '../../hooks/useIntegrations';
import { Integration, CreateIntegrationInput } from '../../types/unified';

interface IntegrationsManagementProps {
  opened: boolean;
  onClose: () => void;
}

export function IntegrationsManagement({
  opened,
  onClose,
}: IntegrationsManagementProps) {
  const theme = useMantineTheme();
  
  const integrationTypes = [
    { value: 'webhook', label: 'Webhook', icon: IconWebhook, color: theme.colors[theme.primaryColor][9] },
    { value: 'api', label: 'API', icon: IconApi, color: theme.primaryColor },
    { value: 'sso', label: 'SSO', icon: IconShield, color: 'purple' },
    { value: 'email', label: 'Email', icon: IconMail, color: 'orange' },
    { value: 'slack', label: 'Slack', icon: IconBrandSlack, color: 'cyan' },
    { value: 'teams', label: 'Teams', icon: IconBrandTeams, color: theme.colors[theme.primaryColor][9] },
    { value: 'jira', label: 'Jira', icon: IconBrandX, color: theme.colors[theme.primaryColor][9] },
    {
      value: 'serviceNow',
      label: 'ServiceNow',
      icon: IconDatabase,
      color: 'gray',
    },
  ];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    integrations,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
  } = useIntegrations();

  const [formData, setFormData] = useState<CreateIntegrationInput>({
    name: '',
    type: 'webhook',
    enabled: false,
    webhookUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
  });

  const handleCreate = async () => {
    try {
      // Creating integration with data
      await createIntegration(formData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {}
  };

  const handleUpdate = async () => {
    if (!selectedIntegration) return;
    try {
      await updateIntegration(selectedIntegration.id, formData);
      setShowEditModal(false);
      setSelectedIntegration(null);
      resetForm();
    } catch (error) {}
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      try {
        await deleteIntegration(id);
      } catch (error) {}
    }
  };

  const handleTest = async (integration: Integration) => {
    try {
      const result = await testIntegration(integration.id);
      setTestResult(result);
      setShowTestModal(true);
    } catch (error) {}
  };

  const resetForm = () => {
    const defaultFormData: CreateIntegrationInput = {
      name: '',
      type: 'webhook',
      enabled: false,
      webhookUrl: '',
      apiKey: '',
      clientId: '',
      clientSecret: '',
      tenantId: '',
    };
    // Resetting form with data
    setFormData(defaultFormData);
  };

  const openEditModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      enabled: integration.enabled,
      webhookUrl: integration.webhookUrl || '',
      apiKey: integration.apiKey || '',
      clientId: integration.clientId || '',
      clientSecret: integration.clientSecret || '',
      tenantId: integration.tenantId || '',
    });
    setShowEditModal(true);
  };

  const getIntegrationIcon = (type: Integration['type']) => {
    const integrationType = integrationTypes.find(t => t.value === type);
    return integrationType?.icon || IconPlug;
  };

  const getIntegrationColor = (type: Integration['type']) => {
    const integrationType = integrationTypes.find(t => t.value === type);
    return integrationType?.color || 'gray';
  };

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='Integrations Management'
        size='xl'
      >
        <Alert icon={<IconAlertCircle size={16} />} color={theme.colors[theme.primaryColor][9]} title='Error'>
          {error}
          <Text size='sm' mt='xs'>
            Please check your connection and try again.
          </Text>
        </Alert>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap='sm'>
            <IconPlug size={20} />
            <Text>Integrations Management</Text>
          </Group>
        }
        size='xl'
      >
        <Stack gap='md'>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Manage system integrations and external connections
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Integration
            </Button>
          </Group>

          {loading ? (
            <Center h={200}>
              <Loader size='md' />
            </Center>
          ) : integrations.length === 0 ? (
            <Card withBorder p='md' radius='md'>
              <Center h={200}>
                <Stack align='center' gap='md'>
                  <IconPlug size={48} color='gray' />
                  <Text size='lg' c='dimmed'>
                    No integrations found
                  </Text>
                  <Text size='sm' c='dimmed'>
                    Create your first integration to get started
                  </Text>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Card withBorder p='md' radius='md'>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {integrations.map(integration => {
                    const IconComponent = getIntegrationIcon(integration.type);
                    const color = getIntegrationColor(integration.type);

                    return (
                      <Table.Tr key={integration.id}>
                        <Table.Td>
                          <Group gap='sm'>
                            <ThemeIcon size='sm' variant='light' color={color}>
                              <IconComponent size={14} />
                            </ThemeIcon>
                            <div>
                              <Text size='sm' fw={500}>
                                {integration.name}
                              </Text>
                              <Text size='xs' c='dimmed'>
                                {integration.type}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={color} variant='light'>
                            {integration.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={integration.enabled ? theme.primaryColor : theme.colors[theme.primaryColor][9]}
                            variant='light'
                          >
                            {integration.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>
                            {new Date(
                              integration.createdAt
                            ).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap='xs'>
                            <Tooltip label='Test Connection'>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                onClick={() => handleTest(integration)}
                              >
                                <IconTestPipe size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label='Edit'>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                onClick={() => openEditModal(integration)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label='Delete'>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                color={theme.colors[theme.primaryColor][9]}
                                onClick={() => handleDelete(integration.id)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Card>
          )}
        </Stack>
      </Modal>

      {/* Create Integration Modal */}
      <Modal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Create Integration'
        size='md'
      >
        <Stack gap='md'>
          <TextInput
            label='Name'
            placeholder='Enter integration name'
            value={formData.name}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                name: event?.currentTarget?.value || '',
              }))
            }
            required
          />

          <Select
            label='Type'
            placeholder='Select integration type'
            data={integrationTypes.map(type => ({
              value: type.value,
              label: type.label,
            }))}
            value={formData.type}
            onChange={value =>
              setFormData(prev => ({
                ...prev,
                type: (value || 'webhook') as Integration['type'],
              }))
            }
            required
          />

          <Switch
            label='Enabled'
            checked={formData.enabled}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                enabled: event?.currentTarget?.checked || false,
              }))
            }
          />

          {formData.type === 'webhook' && (
            <TextInput
              label='Webhook URL'
              placeholder='https://example.com/webhook'
              value={formData.webhookUrl}
              onChange={event =>
                setFormData(prev => ({
                  ...prev,
                  webhookUrl: event?.currentTarget?.value || '',
                }))
              }
            />
          )}

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='API Key'
                placeholder='Enter API key'
                value={formData.apiKey}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    apiKey: event?.currentTarget?.value || '',
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label='Client ID'
                placeholder='Enter client ID'
                value={formData.clientId}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    clientId: event?.currentTarget?.value || '',
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label='Client Secret'
            placeholder='Enter client secret'
            type='password'
            value={formData.clientSecret}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                clientSecret: event?.currentTarget?.value || '',
              }))
            }
          />

          <TextInput
            label='Tenant ID'
            placeholder='Enter tenant ID'
            value={formData.tenantId}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                tenantId: event?.currentTarget?.value || '',
              }))
            }
          />

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Integration Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title='Edit Integration'
        size='md'
      >
        <Stack gap='md'>
          <TextInput
            label='Name'
            placeholder='Enter integration name'
            value={formData.name}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                name: event?.currentTarget?.value || '',
              }))
            }
            required
          />

          <Select
            label='Type'
            placeholder='Select integration type'
            data={integrationTypes.map(type => ({
              value: type.value,
              label: type.label,
            }))}
            value={formData.type}
            onChange={value =>
              setFormData(prev => ({
                ...prev,
                type: (value || 'webhook') as Integration['type'],
              }))
            }
            required
          />

          <Switch
            label='Enabled'
            checked={formData.enabled}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                enabled: event?.currentTarget?.checked || false,
              }))
            }
          />

          {formData.type === 'webhook' && (
            <TextInput
              label='Webhook URL'
              placeholder='https://example.com/webhook'
              value={formData.webhookUrl}
              onChange={event =>
                setFormData(prev => ({
                  ...prev,
                  webhookUrl: event?.currentTarget?.value || '',
                }))
              }
            />
          )}

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='API Key'
                placeholder='Enter API key'
                value={formData.apiKey}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    apiKey: event?.currentTarget?.value || '',
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label='Client ID'
                placeholder='Enter client ID'
                value={formData.clientId}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    clientId: event?.currentTarget?.value || '',
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label='Client Secret'
            placeholder='Enter client secret'
            type='password'
            value={formData.clientSecret}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                clientSecret: event?.currentTarget?.value || '',
              }))
            }
          />

          <TextInput
            label='Tenant ID'
            placeholder='Enter tenant ID'
            value={formData.tenantId}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                tenantId: event?.currentTarget?.value || '',
              }))
            }
          />

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Test Result Modal */}
      <Modal
        opened={showTestModal}
        onClose={() => setShowTestModal(false)}
        title='Integration Test Result'
        size='sm'
      >
        <Stack gap='md'>
          {testResult && (
            <Alert
              icon={
                testResult.success ? (
                  <IconCheck size={16} />
                ) : (
                  <IconX size={16} />
                )
              }
              color={testResult.success ? theme.primaryColor : theme.colors[theme.primaryColor][9]}
              title={testResult.success ? 'Test Successful' : 'Test Failed'}
            >
              {testResult.message}
            </Alert>
          )}
          <Group justify='flex-end'>
            <Button onClick={() => setShowTestModal(false)}>Close</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
