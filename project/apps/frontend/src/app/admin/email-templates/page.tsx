'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  ActionIcon,
  Tabs,
  Code,
  Divider,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconRefresh,
  IconSettings,
  IconTemplate,
  IconCode,
} from '@tabler/icons-react';
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  usePreviewEmailTemplate,
  useCreateDefaultTemplates,
} from '../../../hooks/useEmailTemplates';
import { notifications } from '@mantine/notifications';
import { EmailTemplateType } from '../../../types/unified';
import {
  EMAIL_TEMPLATE_TYPES,
  EMAIL_TEMPLATE_VARIABLES,
} from '@/lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

interface EmailTemplateFormData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: string;
  isActive: boolean;
  variables: string[];
}

// Using centralized constants from lib/constants.ts
const TEMPLATE_TYPES = EMAIL_TEMPLATE_TYPES;
const AVAILABLE_VARIABLES = EMAIL_TEMPLATE_VARIABLES;

export default function EmailTemplatesPage() {
  const theme = useMantineTheme();
  const { primaryDark, primaryLight, primaryLighter, textMuted } = useDynamicTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    type: string;
    isActive: boolean;
    preview?: { subject: string; html: string };
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    type: '',
    isActive: true,
    variables: [],
  });
  const [previewData] = useState<Record<string, unknown>>({});

  const { data: templates, isLoading, refetch } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();
  const previewTemplate = usePreviewEmailTemplate();
  const createDefaults = useCreateDefaultTemplates();

  const handleCreateTemplate = async () => {
    try {
      await createTemplate.mutateAsync({
        ...formData,
        html: formData.htmlContent,
        type: formData.type as EmailTemplateType,
      });
      notifications.show({
        title: 'Success',
        message: 'Email template created successfully',
        color: primaryLight,
      });
      setCreateModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create email template',
        color: primaryDark,
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        data: {
          ...formData,
          type: formData.type as EmailTemplateType,
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Email template updated successfully',
        color: primaryLight,
      });
      setEditModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update email template',
        color: primaryDark,
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteTemplate.mutateAsync(selectedTemplate.id);
      notifications.show({
        title: 'Success',
        message: 'Email template deleted successfully',
        color: primaryLight,
      });
      setDeleteModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete email template',
        color: primaryDark,
      });
    }
  };

  const handlePreviewTemplate = async (template: {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    type: string;
    isActive: boolean;
  }) => {
    try {
      const result = await previewTemplate.mutateAsync({
        id: template.id,
        variables: previewData,
      });
      setSelectedTemplate({ ...template, preview: result });
      setPreviewModalOpen(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to preview template',
        color: primaryDark,
      });
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaults.mutateAsync();
      notifications.show({
        title: 'Success',
        message: 'Default templates created successfully',
        color: primaryLight,
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create default templates',
        color: primaryDark,
      });
    }
  };

  const openEditModal = (template: {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    type: string;
    isActive: boolean;
  }) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: '',
      type: template.type,
      isActive: template.isActive,
      variables: [],
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (template: {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    type: string;
    isActive: boolean;
  }) => {
    setSelectedTemplate(template);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      type: '',
      isActive: true,
      variables: [],
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      'htmlContent'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + variable + after;

      setFormData({ ...formData, htmlContent: newText });

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
      }, 0);
    }
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Email Templates</Title>
          <Text c='dimmed' size='sm'>
            Manage email templates for automated notifications
          </Text>
        </div>
        <Group>
          <Button
            variant='light'
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant='light'
            leftSection={<IconTemplate size={16} />}
            onClick={handleCreateDefaults}
            loading={createDefaults.isPending}
          >
            Create Defaults
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Template
          </Button>
        </Group>
      </Group>

      <Card>
        <Stack>
          <Group justify='space-between'>
            <Title order={4}>Email Templates</Title>
            <TextInput
              placeholder='Search templates...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
            />
          </Group>

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {templates
                ?.filter(
                  (template: {
                    id: string;
                    name: string;
                    subject: string;
                    type: string;
                    isActive: boolean;
                    updatedAt: string;
                    isDefault?: boolean;
                  }) =>
                    template.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    template.type
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .map(
                  (template: {
                    id: string;
                    name: string;
                    subject: string;
                    type: string;
                    isActive: boolean;
                    updatedAt: string;
                    isDefault?: boolean;
                  }) => (
                    <Table.Tr key={template.id}>
                      <Table.Td>
                        <Group>
                          <Text fw={500}>{template.name}</Text>
                          {template.isDefault && (
                            <Badge color={primaryDark} variant='light' size='xs'>
                              Default
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={primaryDark} variant='light' size='sm'>
                          {template.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm' c='dimmed'>
                          {template.subject}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={template.isActive ? primaryLighter : textMuted}
                          variant='light'
                          size='sm'
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm' c='dimmed'>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap='xs'>
                          <ActionIcon
                            variant='light'
                            size='sm'
                            color={theme.colors[theme.primaryColor][9]}
                            onClick={() =>
                              handlePreviewTemplate({
                                id: template.id,
                                name: template.name,
                                subject: template.subject,
                                htmlContent: '',
                                textContent: '',
                                type: template.type,
                                isActive: template.isActive,
                              })
                            }
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant='light'
                            size='sm'
                            onClick={() =>
                              openEditModal({
                                id: template.id,
                                name: template.name,
                                subject: template.subject,
                                htmlContent: '',
                                textContent: '',
                                type: template.type,
                                isActive: template.isActive,
                              })
                            }
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant='light'
                            size='sm'
                            color={theme.colors[theme.primaryColor][9]}
                            onClick={() =>
                              openDeleteModal({
                                id: template.id,
                                name: template.name,
                                subject: template.subject,
                                htmlContent: '',
                                textContent: '',
                                type: template.type,
                                isActive: template.isActive,
                              })
                            }
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create Email Template'
        size='xl'
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='Template Name'
                placeholder='Enter template name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label='Template Type'
                placeholder='Select template type'
                data={TEMPLATE_TYPES}
                value={formData.type}
                onChange={value =>
                  setFormData({ ...formData, type: value || '' })
                }
                required
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label='Email Subject'
            placeholder='Enter email subject'
            value={formData.subject}
            onChange={e =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
          />

          <Tabs
            value={activeTab}
            onChange={value => setActiveTab(value || 'html')}
          >
            <Tabs.List>
              <Tabs.Tab value='html' leftSection={<IconCode size={16} />}>
                HTML Content
              </Tabs.Tab>
              <Tabs.Tab value='text' leftSection={<IconTemplate size={16} />}>
                Text Content
              </Tabs.Tab>
              <Tabs.Tab
                value='variables'
                leftSection={<IconSettings size={16} />}
              >
                Variables
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='html'>
              <Stack>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    HTML Content
                  </Text>
                  <Text size='xs' c='dimmed'>
                    Use variables like {`{{user.name}}`} for dynamic content
                  </Text>
                </Group>
                <Textarea
                  id='htmlContent'
                  placeholder='Enter HTML content...'
                  value={formData.htmlContent}
                  onChange={e =>
                    setFormData({ ...formData, htmlContent: e.target.value })
                  }
                  minRows={10}
                  autosize
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value='text'>
              <Stack>
                <Text size='sm' fw={500}>
                  Text Content
                </Text>
                <Textarea
                  placeholder='Enter plain text content...'
                  value={formData.textContent}
                  onChange={e =>
                    setFormData({ ...formData, textContent: e.target.value })
                  }
                  minRows={10}
                  autosize
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value='variables'>
              <Stack>
                <Text size='sm' fw={500}>
                  Available Variables
                </Text>
                <Text size='xs' c='dimmed' mb='md'>
                  Click on a variable to insert it into your template
                </Text>
                <Grid>
                  {AVAILABLE_VARIABLES.map(variable => (
                    <Grid.Col span={6} key={variable.value}>
                      <Card
                        padding='sm'
                        style={{ cursor: 'pointer' }}
                        onClick={() => insertVariable(variable.value)}
                      >
                        <Group>
                          <Code>{variable.value}</Code>
                          <Text size='sm'>{variable.label}</Text>
                        </Group>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Switch
            label='Active Template'
            description='Enable this template for use'
            checked={formData.isActive}
            onChange={e =>
              setFormData({ ...formData, isActive: e.currentTarget.checked })
            }
          />

          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              loading={createTemplate.isPending}
            >
              Create Template
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title='Edit Email Template'
        size='xl'
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='Template Name'
                placeholder='Enter template name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label='Template Type'
                placeholder='Select template type'
                data={TEMPLATE_TYPES}
                value={formData.type}
                onChange={value =>
                  setFormData({ ...formData, type: value || '' })
                }
                required
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label='Email Subject'
            placeholder='Enter email subject'
            value={formData.subject}
            onChange={e =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
          />

          <Tabs
            value={activeTab}
            onChange={value => setActiveTab(value || 'html')}
          >
            <Tabs.List>
              <Tabs.Tab value='html' leftSection={<IconCode size={16} />}>
                HTML Content
              </Tabs.Tab>
              <Tabs.Tab value='text' leftSection={<IconTemplate size={16} />}>
                Text Content
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='html'>
              <Stack>
                <Text size='sm' fw={500}>
                  HTML Content
                </Text>
                <Textarea
                  placeholder='Enter HTML content...'
                  value={formData.htmlContent}
                  onChange={e =>
                    setFormData({ ...formData, htmlContent: e.target.value })
                  }
                  minRows={10}
                  autosize
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value='text'>
              <Stack>
                <Text size='sm' fw={500}>
                  Text Content
                </Text>
                <Textarea
                  placeholder='Enter plain text content...'
                  value={formData.textContent}
                  onChange={e =>
                    setFormData({ ...formData, textContent: e.target.value })
                  }
                  minRows={10}
                  autosize
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Switch
            label='Active Template'
            description='Enable this template for use'
            checked={formData.isActive}
            onChange={e =>
              setFormData({ ...formData, isActive: e.currentTarget.checked })
            }
          />

          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              loading={updateTemplate.isPending}
            >
              Update Template
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Preview Modal */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title='Email Template Preview'
        size='xl'
      >
        <Stack>
          <Text size='sm' fw={500}>
            Subject: {selectedTemplate?.subject}
          </Text>
          <Divider />
          <div
            dangerouslySetInnerHTML={{
              __html:
                selectedTemplate?.preview?.html ||
                selectedTemplate?.htmlContent ||
                '',
            }}
            style={{
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
            }}
          />
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete Email Template'
      >
        <Stack>
          <Text>
            Are you sure you want to delete "{selectedTemplate?.name}"? This
            action cannot be undone.
          </Text>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleDeleteTemplate}
              loading={deleteTemplate.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
