import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, Attachment, AttachmentDownloadUrl } from '../lib/apiClient';

export function useAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['attachments', ticketId],
    queryFn: async () => {
      const response = await ticketApi.getAttachments(ticketId);
      return response.data.data as Attachment[];
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAttachment(id: string) {
  return useQuery({
    queryKey: ['attachment', id],
    queryFn: async () => {
      const response = await ticketApi.getAttachment(id);
      return response.data.data as Attachment;
    },
    enabled: !!id,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      file,
    }: {
      ticketId: string;
      file: File;
    }) => {
      const response = await ticketApi.uploadAttachment(ticketId, file);
      return response.data.data as Attachment;
    },
    onSuccess: attachment => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', attachment.ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ['ticket', attachment.ticketId],
      });
    },
  });
}

export function useGetAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ticketApi.getAttachmentDownloadUrl(id);
      return response.data.data as AttachmentDownloadUrl;
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await ticketApi.deleteAttachment(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['attachment', id] });
      // We need to invalidate attachments for all tickets since we don't know which ticket this attachment belonged to
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}
