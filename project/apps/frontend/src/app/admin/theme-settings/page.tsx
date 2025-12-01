'use client';

import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Button,
  ColorInput,
  FileInput,
  Stack,
  Alert,
  Card,
  Image,
  Grid,
  Divider,
  Badge,
  Modal,
  ColorSwatch,
  Center,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconPalette, IconPhoto, IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { themeSettingsApi } from '../../../lib/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { Logo } from '../../../components/common/Logo';

interface ThemeSettings {
  id?: string;
  primaryColor?: string;
  logoUrl?: string;
  logoData?: string;
  isActive?: boolean;
}

interface ThemeSettingsForm {
  primaryColor: string;
  logoFile: File | null;
}

const PRESET_COLORS = [
  '#f0940a', // Current default
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
];

export default function ThemeSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { primary } = useDynamicTheme();
  const theme = useMantineTheme();
  const [previewMode, setPreviewMode] = useState(false);
  const [previewColor, setPreviewColor] = useState<string>('');
  const [logoImageError, setLogoImageError] = useState(false);
  const formInitialized = useRef(false);

  // Fetch current theme settings
  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      try {
        const response = await themeSettingsApi.getThemeSettings();
        return response.data.data as ThemeSettings;
      } catch (error) {
        return null;
      }
    },
  });

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // For logos, preserve transparency by not filling background
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/png', quality);
        const base64 = compressedDataUrl.split(',')[1];
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Helper function to convert file to base64 with compression
  const fileToBase64 = (file: File): Promise<string> => {
    // Check file size first (max 2MB for logo)
    const maxSize = 2 * 1024 * 1024; // 2MB for logo
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 2MB.');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file.');
    }

    // For logos, compress the image while preserving transparency
    return compressImage(file, 200, 200, 0.9);
  };

  // Update theme settings mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: Partial<ThemeSettingsForm>) => {
      
      let logoData = undefined;

      // Convert files to base64 if provided
      if (data.logoFile) {
        try {
          logoData = await fileToBase64(data.logoFile);
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Failed to process logo file');
        }
      }
      
      // Only include fields that have actual values to avoid overwriting existing data
      const requestData: Partial<ThemeSettings> = {};
      
      if (data.primaryColor) {
        requestData.primaryColor = data.primaryColor;
      }
      
      // Handle logo data - only include if we have actual data
      if (logoData !== undefined) {
        requestData.logoData = logoData;
      }

      const response = await themeSettingsApi.updateThemeSettings(requestData);
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Theme settings updated successfully',
        color: primary,
        icon: <IconCheck size={16} />,
      });
      // Clear localStorage cache to ensure all users get the new theme
      localStorage.removeItem('theme-settings');
      // Invalidate queries to refetch from database
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-theme-settings'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update theme settings';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: primary,
        icon: <IconX size={16} />,
      });
    },
  });

  const form = useForm<ThemeSettingsForm>({
    initialValues: {
      primaryColor: themeSettings?.primaryColor || '#f0940a',
      logoFile: null,
    },
  });

  // Create a separate reset mutation
  const resetThemeMutation = useMutation({
    mutationFn: async () => {
      const resetData = {
        primaryColor: '#f0940a',
        logoUrl: '', // Clear logo URL
        logoData: '', // Clear logo data
      };

      const response = await themeSettingsApi.updateThemeSettings(resetData);
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Reset to Default',
        message: 'Theme settings have been reset to default values',
        color: theme.primaryColor,
        icon: <IconRefresh size={16} />,
      });
      // Clear localStorage cache to ensure all users get the reset theme
      localStorage.removeItem('theme-settings');
      // Invalidate queries to refetch from database
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-theme-settings'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to reset theme settings';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: primary,
        icon: <IconX size={16} />,
      });
    },
  });

  // Update form when theme settings load (only on initial load, not after saves)
  useEffect(() => {
    if (themeSettings && !formInitialized.current) {
      form.setValues({
        primaryColor: themeSettings.primaryColor || '#f0940a',
        logoFile: null,
      });
      formInitialized.current = true;
    }
  }, [themeSettings, form]);

  // Redirect if not admin
  if (user?.activeRole !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = (values: ThemeSettingsForm) => {
    updateThemeMutation.mutate(values);
  };

  const handlePreview = (color: string) => {
    setPreviewColor(color);
    setPreviewMode(true);
  };

  const handleReset = () => {
    // Reset form values
    form.setValues({
      primaryColor: '#f0940a',
      logoFile: null,
    });

    // Send reset to backend
    resetThemeMutation.mutate();
  };

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} style={{ color: primary }}>
              Theme Settings
            </Title>
            <Text c="dimmed" size="sm">
              Customize the appearance of your ticket system
            </Text>
          </div>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconRefresh size={16} />}
              onClick={handleReset}
              loading={resetThemeMutation.isPending}
            >
              Reset to Default
            </Button>
            <Button
              variant="outline"
              leftSection={<IconPalette size={16} />}
              onClick={() => handlePreview(form.values.primaryColor)}
            >
              Preview
            </Button>
          </Group>
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="lg">
                {/* Primary Color Section */}
                <Paper p="lg" withBorder>
                  <Stack gap="md">
                    <Group>
                      <IconPalette size={20} style={{ color: primary }} />
                      <Title order={3}>Primary Color</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Choose the primary color that will be used throughout the application
                    </Text>

                    <ColorInput
                      label="Primary Color"
                      placeholder="Select a color"
                      value={form.values.primaryColor}
                      onChange={(value) => form.setFieldValue('primaryColor', value)}
                      withEyeDropper={false}
                      format="hex"
                    />

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Preset Colors
                      </Text>
                      <Group gap="xs">
                        {PRESET_COLORS.map((color) => (
                          <ColorSwatch
                            key={color}
                            color={color}
                            size={32}
                            style={{ cursor: 'pointer' }}
                            onClick={() => form.setFieldValue('primaryColor', color)}
                          />
                        ))}
                      </Group>
                    </div>
                  </Stack>
                </Paper>

                {/* Logo Section */}
                <Paper p="lg" withBorder>
                  <Stack gap="md">
                    <Group>
                      <IconPhoto size={20} style={{ color: primary }} />
                      <Title order={3}>Logo</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Upload a custom logo that will appear in the header
                    </Text>

                    <FileInput
                      label="Upload Logo"
                      placeholder="Choose logo file (max 2MB)"
                      accept="image/*"
                      leftSection={<IconUpload size={16} />}
                      value={form.values.logoFile}
                      onChange={(file) => {
                        if (file && file.size > 2 * 1024 * 1024) {
                          notifications.show({
                            title: 'File Too Large',
                            message: 'Logo file must be smaller than 2MB',
                            color: primary,
                            icon: <IconX size={16} />,
                          });
                          return;
                        }
                        form.setFieldValue('logoFile', file);
                        setLogoImageError(false); // Reset error state when new file is selected
                        // Clear logo URL when file is uploaded
                        if (file) {
                          form.setFieldValue('logoUrl', '');
                          notifications.show({
                            title: 'Logo URL Cleared',
                            message: 'Logo URL has been cleared because a file was uploaded',
                            color: theme.primaryColor,
                            icon: <IconPhoto size={16} />,
                          });
                        }
                      }}
                    />

                    {form.values.logoFile && (
                      <Alert color={theme.primaryColor} variant="light">
                        <Text size="sm">
                          Selected file: {form.values.logoFile.name} ({(form.values.logoFile.size / 1024).toFixed(1)} KB)
                        </Text>
                      </Alert>
                    )}


                    <Card withBorder p="md">
                      <Text size="sm" fw={500} mb="xs">
                        Logo Preview
                      </Text>
                      {(() => {
                        const logoSrc = form.values.logoFile 
                          ? URL.createObjectURL(form.values.logoFile)
                          : (themeSettings?.logoData ? `data:image/png;base64,${themeSettings.logoData}` : null);
                        
                        if (logoSrc && !logoImageError) {
                          return (
                            <Image
                              src={logoSrc}
                              alt="Logo preview"
                              height={60}
                              fit="contain"
                              onError={() => setLogoImageError(true)}
                            />
                          );
                        }
                        
                        return <Logo size={60} variant="icon" />;
                      })()}
                    </Card>
                  </Stack>
                </Paper>

              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="lg">
                {/* Current Settings Preview */}
                <Paper p="lg" withBorder>
                  <Stack gap="md">
                    <Title order={4}>Current Settings</Title>
                    
                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Primary Color
                      </Text>
                      <Group gap="xs">
                        <ColorSwatch color={form.values.primaryColor} size={24} />
                        <Text size="sm" c="dimmed">
                          {form.values.primaryColor}
                        </Text>
                      </Group>
                    </div>

                    <Divider />

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Logo
                      </Text>
                      {(form.values.logoFile || themeSettings?.logoData || themeSettings?.logoUrl) ? (
                        <Badge style={{ backgroundColor: primary, color: 'white' }} variant="filled">
                          Custom Logo Set
                        </Badge>
                      ) : (
                        <Badge color="gray" variant="light">
                          Using Default
                        </Badge>
                      )}
                    </div>

                  </Stack>
                </Paper>

                {/* Save Button */}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={updateThemeMutation.isPending}
                  leftSection={<IconCheck size={16} />}
                >
                  Save Theme Settings
                </Button>

                <Alert color={theme.primaryColor} variant="light">
                  <Text size="sm">
                    Changes will be applied immediately after saving. 
                    You may need to refresh the page to see all changes.
                  </Text>
                </Alert>
              </Stack>
            </Grid.Col>
          </Grid>
        </form>
      </Stack>

      {/* Preview Modal */}
      <Modal
        opened={previewMode}
        onClose={() => setPreviewMode(false)}
        title="Color Preview"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This is how your selected color will look in the application:
          </Text>
          
          <Paper p="md" withBorder>
            <Group>
              <ColorSwatch color={previewColor} size={40} />
              <div>
                <Text fw={500}>Primary Color</Text>
                <Text size="sm" c="dimmed">{previewColor}</Text>
              </div>
            </Group>
          </Paper>

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Close
            </Button>
            <Button onClick={() => {
              form.setFieldValue('primaryColor', previewColor);
              setPreviewMode(false);
            }}>
              Use This Color
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
