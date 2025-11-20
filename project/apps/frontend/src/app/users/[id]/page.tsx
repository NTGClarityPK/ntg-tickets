'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Grid,
  Card,
  Stack,
  Badge,
  Alert,
  Loader,
  Tabs,
  ActionIcon,
  Menu,
  useMantineTheme,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDots,
  IconCalendar,
  IconAlertCircle,
  IconUser,
  IconMail,
  IconShield,
} from '@tabler/icons-react';
import { RTLArrowLeft } from '../../../components/ui/RTLIcon';
import { notifications } from '@mantine/notifications';
import { useUser, useDeleteUser } from '../../../hooks/useUsers';
import { UserRole } from '../../../types/unified';
import { formatDistanceToNow } from 'date-fns';

import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function UserDetailPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark, primaryDarkest } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return primaryDarkest;
      case UserRole.SUPPORT_MANAGER:
        return primaryDark;
      case UserRole.SUPPORT_STAFF:
        return primaryDark;
      case UserRole.END_USER:
        return primaryLight;
      default:
        return primaryLight;
    }
  };
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUser(userId);
  const deleteUserMutation = useDeleteUser();

  const handleEdit = () => {
    router.push(`/users/${userId}/edit`);
  };

  const handleDelete = async () => {
    if (!user) return;

    if (
      confirm(
        `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        notifications.show({
          title: 'Success',
          message: 'User deleted successfully',
          color: primaryLight,
        });
        router.push('/admin/users');
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete user',
          color: primaryDark,
        });
      }
    }
  };

  if (userLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading user details...</Text>
        </Group>
      </Container>
    );
  }

  if (userError || !user) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load user: {userError?.message || 'User not found'}
        </Alert>
        <Group mt='md'>
          <Button
            variant='outline'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <Group>
          <Button
            variant='subtle'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <div>
            <Title order={1}>{user.name}</Title>
            <Text c='dimmed'>{user.email}</Text>
          </div>
        </Group>
        <Group>
          <Button leftSection={<IconEdit size={16} />} onClick={handleEdit}>
            Edit User
          </Button>
          <Menu shadow='md' width={200}>
            <Menu.Target>
              <ActionIcon variant='subtle'>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color={theme.colors[theme.primaryColor][9]}
                onClick={handleDelete}
              >
                Delete User
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value='overview'>Overview</Tabs.Tab>
              <Tabs.Tab value='activity'>Activity</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='overview' pt='md'>
              <Stack gap='md'>
                <Card withBorder p='md'>
                  <Title order={3} mb='md'>
                    User Information
                  </Title>
                  <Stack gap='sm'>
                    <Group gap='sm'>
                      <IconUser size={16} />
                      <div>
                        <Text size='sm' fw={500}>
                          Full Name
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {user.name}
                        </Text>
                      </div>
                    </Group>
                    <Group gap='sm'>
                      <IconMail size={16} />
                      <div>
                        <Text size='sm' fw={500}>
                          Email
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {user.email}
                        </Text>
                      </div>
                    </Group>
                    <Group gap='sm'>
                      <IconShield size={16} />
                      <div>
                        <Text size='sm' fw={500}>
                          {user.roles && user.roles.length > 1 ? 'Roles' : 'Role'}
                        </Text>
                        <Group gap='xs' mt='xs'>
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role: UserRole) => (
                              <Badge
                                key={role}
                                color={getRoleColor(role)}
                                variant='light'
                                size='sm'
                              >
                                {role.replace('_', ' ')}
                              </Badge>
                            ))
                          ) : (
                            <Badge color='gray' variant='light' size='sm'>
                              Unknown
                            </Badge>
                          )}
                        </Group>
                      </div>
                    </Group>
                    <Group gap='sm'>
                      <IconCalendar size={16} />
                      <div>
                        <Text size='sm' fw={500}>
                          Member Since
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                  </Stack>
                </Card>

              </Stack>
            </Tabs.Panel>


            <Tabs.Panel value='activity' pt='md'>
              <Card withBorder p='md'>
                <Title order={3} mb='md'>
                  Recent Activity
                </Title>
                <Text c='dimmed' ta='center' py='xl'>
                  Activity tracking will be implemented here.
                </Text>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack gap='md'>
            <Card withBorder p='md'>
              <Title order={4} mb='md'>
                Account Status
              </Title>
              <Stack gap='sm'>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Status
                  </Text>
                  <Badge
                    color={user.isActive ? primaryLight : primaryDark}
                    variant='light'
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Last Updated
                  </Text>
                  <Text size='sm' c='dimmed'>
                    {formatDistanceToNow(new Date(user.updatedAt), {
                      addSuffix: true,
                    })}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Card withBorder p='md'>
              <Title order={4} mb='md'>
                Quick Actions
              </Title>
              <Stack gap='sm'>
                <Button
                  variant='outline'
                  leftSection={<IconEdit size={16} />}
                  onClick={handleEdit}
                  fullWidth
                >
                  Edit User
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
