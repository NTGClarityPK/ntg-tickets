'use client';

import { useState } from 'react';
import {
  TextInput,
  // Select, // Removed unused import
  MultiSelect,
  Button,
  Group,
  Stack,
  Grid,
  Switch,
  PasswordInput,
  Alert,
  useMantineTheme,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showErrorNotification } from '@/lib/notifications';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import { VALIDATION_RULES } from '../../lib/constants';
import { useAuthUser } from '../../stores/useAuthStore';

import { UserFormData, User, UserRole } from '../../types/unified';

// Re-export for backward compatibility
export type { UserFormData, User };

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  initialData?: User;
  isEditing?: boolean;
}

const roles = [
  { value: UserRole.END_USER, label: 'End User' },
  { value: UserRole.SUPPORT_STAFF, label: 'Support Staff' },
  { value: UserRole.SUPPORT_MANAGER, label: 'Support Manager' },
  { value: UserRole.ADMIN, label: 'Administrator' },
];

export function UserForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validatePassword } = usePasswordValidation();
  const theme = useMantineTheme();
  const currentUser = useAuthUser();

  // Check if current user is editing themselves
  const isEditingSelf = isEditing && currentUser && initialData?.id === currentUser.id;
  
  // Check if user currently has ADMIN role
  const hasAdminRole = initialData?.roles?.includes(UserRole.ADMIN) || false;

  // Determine if ADMIN role should be disabled
  // Frontend: Prevent admin from removing their own admin role
  // Backend will handle checking if removing admin would leave system with no admins
  const isAdminRoleDisabled = isEditingSelf && hasAdminRole;

  const form = useForm<UserFormData>({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      roles: initialData?.roles || [UserRole.END_USER],
      isActive: initialData?.isActive ?? true,
      password: '',
      confirmPassword: '',
    },
      validate: {
      name: value => (!value ? 'Name is required' : null),
      email: value => (!/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email' : null),
      roles: value =>
        !value || value.length === 0 ? 'At least one role is required' : null,
      password: value => {
        if (!isEditing && !value) return 'Password is required';
        if (value) return validatePassword(value);
        return null;
      },
      confirmPassword: (value, values) => {
        if (!isEditing && value !== values.password)
          return 'Passwords do not match';
        if (isEditing && values.password && value !== values.password)
          return 'Passwords do not match';
        return null;
      },
    },
  });

  const handleSubmit = async (values: UserFormData) => {
    setIsSubmitting(true);
    try {
      const formData = { ...values };
      // Always remove confirmPassword as it's only for frontend validation
      delete formData.confirmPassword;
      
      // Validate admin role removal
      if (isEditing && initialData) {
        const hadAdminRole = initialData.roles?.includes(UserRole.ADMIN) || false;
        const willHaveAdminRole = formData.roles?.includes(UserRole.ADMIN) || false;
        
        // Prevent admin from removing their own admin role
        if (isEditingSelf && hadAdminRole && !willHaveAdminRole) {
          showErrorNotification(
            'Error',
            'You cannot remove your own admin role. Please ask another admin to perform this action.'
          );
          setIsSubmitting(false);
          return;
        }
        
        // Note: Backend will validate if removing admin would leave system with no admins
        // We only check frontend validation for self-admin removal here
      }
      
      // When editing, only include password if it's provided (not empty)
      if (isEditing && !formData.password) {
        delete formData.password;
      }
      await onSubmit(formData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user. Please check the form and try again.';
      showErrorNotification('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} data-testid="user-form">
      <Stack gap='md'>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label='Full Name'
              placeholder='Enter full name'
              required
              {...form.getInputProps('name')}
              data-testid="user-name-input"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label='Email'
              placeholder='Enter email address'
              required
              type='email'
              {...form.getInputProps('email')}
              data-testid="user-email-input"
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <MultiSelect
              label='Roles'
              placeholder='Select roles'
              required
              data={roles.map(role => ({
                ...role,
                disabled: !!(role.value === UserRole.ADMIN && isAdminRoleDisabled),
              }))}
              {...form.getInputProps('roles')}
              data-testid="user-roles-select"
            />
            {isAdminRoleDisabled && (
              <Text size='xs' c='dimmed' mt={4}>
                You cannot remove your own admin role. Please ask another admin to perform this action.
              </Text>
            )}
          </Grid.Col>
          <Grid.Col span={6}>
            <Switch
              label='Active'
              description='User can access the system'
              {...form.getInputProps('isActive', { type: 'checkbox' })}
              data-testid="user-active-switch"
            />
          </Grid.Col>
        </Grid>

        {!isEditing && (
          <>
            <Grid>
              <Grid.Col span={6}>
                <PasswordInput
                  label='Password'
                  placeholder='Enter password'
                  required
                  description='Must contain uppercase, lowercase, number, and special character'
                  {...form.getInputProps('password')}
                  data-testid="user-password-input"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <PasswordInput
                  label='Confirm Password'
                  placeholder='Confirm password'
                  required
                  description='Re-enter the password to confirm'
                  {...form.getInputProps('confirmPassword')}
                  data-testid="user-confirm-password-input"
                />
              </Grid.Col>
            </Grid>
            <Alert color={theme.primaryColor} title='Password Requirements'>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>At least {VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
              </ul>
            </Alert>
          </>
        )}

        {isEditing && (
          <>
            <Grid>
              <Grid.Col span={6}>
                <PasswordInput
                  label='New Password'
                  placeholder='Enter new password (leave empty to keep current)'
                  description='Must contain uppercase, lowercase, number, and special character'
                  {...form.getInputProps('password')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <PasswordInput
                  label='Confirm New Password'
                  placeholder='Confirm new password'
                  description='Re-enter the new password to confirm'
                  {...form.getInputProps('confirmPassword')}
                />
              </Grid.Col>
            </Grid>
            <Alert color={theme.primaryColor} title='Password'>
              Leave password fields empty to keep the current password. Enter a
              new password to change it.
            </Alert>
          </>
        )}

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={onCancel} data-testid="user-form-cancel">
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting} data-testid="user-form-submit">
            {isEditing ? 'Update User' : 'Create User'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
