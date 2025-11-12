import { httpClient } from './http-client';
import {
  ApiResponse,
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
  Comment,
  CreateCommentInput,
  Attachment,
  AttachmentDownloadUrl,
} from '../../types/unified';

export interface PaginatedTicketsResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ticketsClient = {
  getTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: filters,
    }),

  getTicket: (id: string) =>
    httpClient.get<ApiResponse<Ticket>>(`/tickets/${id}`),

  createTicket: (data: CreateTicketInput) =>
    httpClient.post<ApiResponse<Ticket>>('/tickets', data),

  updateTicket: (id: string, data: UpdateTicketInput) =>
    httpClient.patch<ApiResponse<Ticket>>(`/tickets/${id}`, data),

  deleteTicket: (id: string) => httpClient.delete(`/tickets/${id}`),

  assignTicket: (id: string, assignedToId: string) =>
    httpClient.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign`, {
      assignedToId,
    }),

  updateStatus: (
    id: string,
    status: string,
    resolution?: string,
    comment?: string
  ) => {
    const requestData = { status, resolution, comment };
    return httpClient.patch<ApiResponse<Ticket>>(
      `/tickets/${id}/status`,
      requestData
    );
  },

  // Comments
  addComment: (data: CreateCommentInput) =>
    httpClient.post<ApiResponse<Comment>>('/comments', data),

  getComments: (ticketId: string) =>
    httpClient.get<ApiResponse<Comment[]>>(`/comments/ticket/${ticketId}`),

  getComment: (id: string) =>
    httpClient.get<ApiResponse<Comment>>(`/comments/${id}`),

  updateComment: (id: string, data: { content: string; isInternal?: boolean }) =>
    httpClient.patch<ApiResponse<Comment>>(`/comments/${id}`, data),

  deleteComment: (id: string) =>
    httpClient.delete<ApiResponse<{ message: string }>>(`/comments/${id}`),

  // Attachments
  uploadAttachment: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<ApiResponse<Attachment>>(
      `/attachments/ticket/${ticketId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  getAttachments: (ticketId: string) =>
    httpClient.get<ApiResponse<Attachment[]>>(`/attachments/ticket/${ticketId}`),

  getAttachment: (id: string) =>
    httpClient.get<ApiResponse<Attachment>>(`/attachments/${id}`),

  getAttachmentDownloadUrl: (id: string) =>
    httpClient.get<ApiResponse<AttachmentDownloadUrl>>(
      `/attachments/${id}/download`
    ),

  deleteAttachment: (id: string) =>
    httpClient.delete<ApiResponse<{ message: string }>>(`/attachments/${id}`),

  // Additional ticket endpoints
  getMyTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets/my', {
      params: filters,
    }),

  getAssignedTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets/assigned', {
      params: filters,
    }),

  getOverdueTickets: () =>
    httpClient.get<ApiResponse<Ticket[]>>('/tickets/overdue'),

  getTicketsApproachingSLA: () =>
    httpClient.get<ApiResponse<Ticket[]>>('/tickets/approaching-sla'),

  getBreachedSLATickets: () =>
    httpClient.get<ApiResponse<Ticket[]>>('/tickets/breached-sla'),
};


