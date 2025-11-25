'use client';

import { useState, useCallback } from 'react';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import {
  Group,
  Text,
  Stack,
  Paper,
  Progress,
  Alert,
  ThemeIcon,
  ActionIcon,
  Badge,
  useMantineTheme,
} from '@mantine/core';
import {
  showSuccessNotification,
  showErrorNotification,
} from '../../lib/notifications';
import {
  IconUpload,
  IconX,
  IconPhoto,
  IconFile,
  IconCheck,
  IconAlertCircle,
  IconTrash,
} from '@tabler/icons-react';
import { FILE_CONSTANTS } from '../../lib/constants';
import { uploadFileWithProgress } from '../../lib/supabase-storage';

interface FileUploadProps {
  onFilesChange: (files: FileWithPath[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  file: FileWithPath;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  disabled = false,
}: FileUploadProps) {
  const theme = useMantineTheme();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (disabled) return;

      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'uploading',
      }));

      setFiles(prev => [...prev, ...newFiles]);
      onFilesChange([...files, ...newFiles].map(f => f.file));

      // Simulate upload progress
      for (const fileUpload of newFiles) {
        await simulateUpload(fileUpload);
      }
    },
    [files, onFilesChange, disabled]
  );

  const simulateUpload = async (fileUpload: UploadedFile) => {
    try {
      // Upload file to Supabase Storage
      const fileUrl = await uploadFileWithProgress(
        fileUpload.file,
        {
          bucket: 'ticket-attachments',
          folder: 'tickets',
        },
        (progress) => {
          setFiles(prev =>
            prev.map(f => (f.id === fileUpload.id ? { ...f, progress } : f))
          );
        }
      );

      // Update file status to completed
      setFiles(prev =>
        prev.map(f =>
          f.id === fileUpload.id
            ? {
                ...f,
                status: 'completed' as const,
                url: fileUrl,
              }
            : f
        )
      );

      showSuccessNotification(
        'File uploaded',
        `${fileUpload.file.name} uploaded successfully`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setFiles(prev =>
        prev.map(f =>
          f.id === fileUpload.id
            ? {
                ...f,
                status: 'error' as const,
                error: errorMessage,
              }
            : f
        )
      );

      showErrorNotification(
        'Upload failed',
        `Failed to upload ${fileUpload.file.name}: ${errorMessage}`
      );
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      onFilesChange(updated.map(f => f.file));
      return updated;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = FILE_CONSTANTS.BYTES_PER_KB;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileWithPath) => {
    if (file.type.startsWith('image/')) {
      return <IconPhoto size={16} />;
    }
    return <IconFile size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'uploading':
        return theme.primaryColor;
      default:
        return 'gray';
    }
  };

  return (
    <Stack gap='md'>
      <Dropzone
        onDrop={handleDrop}
        onReject={() => {
          showErrorNotification(
            'File rejected',
            'Some files were rejected. Check file size and type.'
          );
        }}
        maxSize={maxSize * 1024 * 1024}
        accept={acceptedTypes}
        maxFiles={maxFiles}
        disabled={disabled || files.length >= maxFiles}
      >
        <Group
          justify='center'
          gap='xl'
          mih={220}
          style={{ pointerEvents: 'none' }}
        >
          <Dropzone.Accept>
            <IconUpload
              size={52}
              stroke={1.5}
              color='var(--mantine-color-red-6)'
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={52} stroke={1.5} color='var(--mantine-color-red-6)' />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size={52} stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size='xl' inline>
              Drag files here or click to select files
            </Text>
            <Text size='sm' c='dimmed' inline mt={7}>
              Attach up to {maxFiles} files, each up to {maxSize}MB
            </Text>
            <Text size='xs' c='dimmed' mt={4}>
              Supported formats: Images, PDF, Text, Word documents
            </Text>
          </div>
        </Group>
      </Dropzone>

      {files.length > 0 && (
        <Paper withBorder p='md' radius='md'>
          <Text size='sm' fw={500} mb='sm'>
            Attached Files ({files.length}/{maxFiles})
          </Text>

          <Stack gap='xs'>
            {files.map(fileUpload => (
              <Paper key={fileUpload.id} p='sm' withBorder radius='sm'>
                <Group justify='space-between'>
                  <Group gap='sm'>
                    <ThemeIcon
                      size='sm'
                      variant='light'
                      color={getStatusColor(fileUpload.status)}
                    >
                      {fileUpload.status === 'completed' ? (
                        <IconCheck size={14} />
                      ) : fileUpload.status === 'error' ? (
                        <IconAlertCircle size={14} />
                      ) : (
                        getFileIcon(fileUpload.file)
                      )}
                    </ThemeIcon>

                    <div>
                      <Text size='sm' fw={500} lineClamp={1}>
                        {fileUpload.file.name}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        {formatFileSize(fileUpload.file.size)}
                      </Text>
                    </div>
                  </Group>

                  <Group gap='xs'>
                    <Badge
                      size='sm'
                      color={getStatusColor(fileUpload.status)}
                      variant='light'
                    >
                      {fileUpload.status}
                    </Badge>

                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      color={theme.colors[theme.primaryColor][9]}
                      onClick={() => removeFile(fileUpload.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                {fileUpload.status === 'uploading' && (
                  <Progress
                    value={fileUpload.progress}
                    size='sm'
                    mt='xs'
                    color={theme.colors[theme.primaryColor][9]}
                  />
                )}

                {fileUpload.status === 'error' && fileUpload.error && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color={theme.colors[theme.primaryColor][9]}
                    mt='xs'
                  >
                    {fileUpload.error}
                  </Alert>
                )}
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {files.length >= maxFiles && (
        <Alert icon={<IconAlertCircle size={16} />} color={theme.colors[theme.primaryColor][4]}>
          Maximum number of files ({maxFiles}) reached. Remove some files to add
          more.
        </Alert>
      )}
    </Stack>
  );
}
