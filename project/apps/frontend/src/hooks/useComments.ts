import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, Comment, CreateCommentInput } from '../lib/apiClient';
import { normalizeItemResponse } from '../services/api/response-normalizer';

export interface UpdateCommentInput {
  content: string;
}

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: async () => {
      const response = await ticketApi.getComments(ticketId);
      return response.data.data as Comment[];
    },
    enabled: !!ticketId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useComment(id: string) {
  return useQuery({
    queryKey: ['comment', id],
    queryFn: async () => {
      const response = await ticketApi.getComment(id);
      return response.data.data as Comment;
    },
    enabled: !!id,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentInput) => {
      const response = await ticketApi.addComment(data);
      const result = normalizeItemResponse<{ message: string; ticketId: string }>(response.data);
      
      if (!result || !result.ticketId) {
        throw new Error('Comment creation response payload is malformed.');
      }

      return result;
    },
    onSuccess: (result, variables) => {
      const ticketId = result.ticketId || variables.ticketId;
      queryClient.invalidateQueries({
        queryKey: ['comments', ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCommentInput;
    }) => {
      const response = await ticketApi.updateComment(id, data);
      return response.data.data as Comment;
    },
    onSuccess: comment => {
      queryClient.invalidateQueries({ queryKey: ['comment', comment.id] });
      queryClient.invalidateQueries({
        queryKey: ['comments', comment.ticketId],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await ticketApi.deleteComment(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['comment', id] });
      // We need to invalidate comments for all tickets since we don't know which ticket this comment belonged to
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
