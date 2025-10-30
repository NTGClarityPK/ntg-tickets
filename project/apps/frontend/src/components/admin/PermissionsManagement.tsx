'use client';

import { useState } from 'react';
import {
  Text,
  Button,
  Group,
  Stack,
  Table,
  Badge,
  Modal,
  Grid,
  Alert,
  Loader,
  Center,
  ThemeIcon,
  Accordion,
  TextInput,
} from '@mantine/core';
import {
  IconShield,
  IconUser,
  IconAlertCircle,
  IconUsers,
  IconEdit,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { usePermissions, Permission } from '../../hooks/usePermissions';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface PermissionsManagementProps {
  opened: boolean;
  onClose: () => void;
}

const roleIcons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  ADMIN: IconShield,
  SUPPORT_MANAGER: IconUsers,
  SUPPORT_STAFF: IconUser,
  END_USER: IconUser,
};

export function PermissionsManagement({
  opened,
  onClose,
}: PermissionsManagementProps) {
  const { primaryLighter, primaryDark, primaryDarker, primaryDarkest } = useDynamicTheme();
  
  const roleColors: Record<string, string> = {
    ADMIN: primaryDarkest,
    SUPPORT_MANAGER: primaryDarker,
    SUPPORT_STAFF: primaryDark,
    END_USER: primaryLighter,
  };
  
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
    conditions: '',
  });

  const { rolePermissions, loading, error } = usePermissions();

  const handleCreatePermission = () => {
    // This would typically open a form to create a new permission
    // For now, we'll just show an alert
    alert('Permission creation would be implemented here');
  };

  const handleEditPermission = (permission: Permission) => {
    setPermissionForm({
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      conditions: JSON.stringify(permission.conditions || {}),
    });
    setShowPermissionModal(true);
  };

  const handleDeletePermission = () => {
    if (confirm('Are you sure you want to delete this permission?')) {
      // Implement permission deletion
      // Delete permission
    }
  };

  const getRoleIcon = (role: string) => {
    return roleIcons[role] || IconUser;
  };

  const getRoleColor = (role: string) => {
    return roleColors[role] || 'gray';
  };

  const formatActions = (actions: string) => {
    return actions.split(',').map(action => action.trim());
  };

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='Permissions Management'
        size='xl'
      >
        <Alert icon={<IconAlertCircle size={16} />} color='red'>
          {error}
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
            <IconShield size={20} />
            <Text>Permissions Management</Text>
          </Group>
        }
        size='xl'
      >
        <Stack gap='md'>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Manage role-based permissions and access control
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreatePermission}
            >
              Add Permission
            </Button>
          </Group>

          {loading ? (
            <Center h={200}>
              <Loader size='md' />
            </Center>
          ) : rolePermissions.length === 0 ? (
            <Center h={200}>
              <Text c='dimmed'>No permissions found</Text>
            </Center>
          ) : (
            <Accordion variant='separated' radius='md'>
              {rolePermissions.map(rolePermission => {
                const RoleIcon = getRoleIcon(rolePermission.role);
                const roleColor = getRoleColor(rolePermission.role);

                return (
                  <Accordion.Item
                    key={rolePermission.role}
                    value={rolePermission.role}
                  >
                    <Accordion.Control>
                      <Group gap='sm'>
                        <ThemeIcon size='sm' variant='light' color={roleColor}>
                          <RoleIcon />
                        </ThemeIcon>
                        <div>
                          <Text fw={500}>
                            {rolePermission.role.replace('_', ' ')}
                          </Text>
                          <Text size='xs' c='dimmed'>
                            {rolePermission.permissions.length} permissions
                          </Text>
                        </div>
                        <Badge color={roleColor} variant='light' ml='auto'>
                          {rolePermission.role}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap='md'>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Permission</Table.Th>
                              <Table.Th>Resource</Table.Th>
                              <Table.Th>Actions</Table.Th>
                              <Table.Th>Conditions</Table.Th>
                              <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {rolePermission.permissions.map(permission => (
                              <Table.Tr key={permission.id}>
                                <Table.Td>
                                  <div>
                                    <Text size='sm' fw={500}>
                                      {permission.name}
                                    </Text>
                                    <Text size='xs' c='dimmed'>
                                      {permission.description}
                                    </Text>
                                  </div>
                                </Table.Td>
                                <Table.Td>
                                  <Badge variant='light' color='red'>
                                    {permission.resource}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap='xs'>
                                    {formatActions(permission.action).map(
                                      action => (
                                        <Badge
                                          key={action}
                                          size='xs'
                                          variant='light'
                                          color='green'
                                        >
                                          {action}
                                        </Badge>
                                      )
                                    )}
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  {permission.conditions ? (
                                    <Text size='xs' c='dimmed'>
                                      {JSON.stringify(permission.conditions)}
                                    </Text>
                                  ) : (
                                    <Text size='xs' c='dimmed'>
                                      None
                                    </Text>
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <Group gap='xs'>
                                    <Button
                                      variant='light'
                                      size='xs'
                                      leftSection={<IconEdit size={12} />}
                                      onClick={() =>
                                        handleEditPermission(permission)
                                      }
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant='light'
                                      size='xs'
                                      color='red'
                                      leftSection={<IconTrash size={12} />}
                                      onClick={() => handleDeletePermission()}
                                    >
                                      Delete
                                    </Button>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Stack>
      </Modal>

      {/* Permission Edit Modal */}
      <Modal
        opened={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title='Edit Permission'
        size='md'
      >
        <Stack gap='md'>
          <TextInput
            label='Permission Name'
            placeholder='Enter permission name'
            value={permissionForm.name}
            onChange={event =>
              setPermissionForm(prev => ({
                ...prev,
                name: event.currentTarget.value,
              }))
            }
            required
          />

          <TextInput
            label='Description'
            placeholder='Enter permission description'
            value={permissionForm.description}
            onChange={event =>
              setPermissionForm(prev => ({
                ...prev,
                description: event.currentTarget.value,
              }))
            }
            required
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='Resource'
                placeholder='e.g., tickets, users, reports'
                value={permissionForm.resource}
                onChange={event =>
                  setPermissionForm(prev => ({
                    ...prev,
                    resource: event.currentTarget.value,
                  }))
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label='Actions'
                placeholder='e.g., read, create, update, delete'
                value={permissionForm.action}
                onChange={event =>
                  setPermissionForm(prev => ({
                    ...prev,
                    action: event.currentTarget.value,
                  }))
                }
                required
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label='Conditions (JSON)'
            placeholder='{"assignedTo": "self"}'
            value={permissionForm.conditions}
            onChange={event =>
              setPermissionForm(prev => ({
                ...prev,
                conditions: event.currentTarget.value,
              }))
            }
          />

          <Group justify='flex-end' mt='md'>
            <Button
              variant='outline'
              onClick={() => setShowPermissionModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowPermissionModal(false)}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
