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

  bulkDeleteTickets: (ids: string[]) =>
    httpClient.post<ApiResponse<{ deletedCount: number; deletedTicketNumbers: string[]; elasticsearchErrors: string[] }>>(
      '/tickets/bulk-delete',
      { ids }
    ),

  assignTicket: (id: string, assignedToId: string) =>
    httpClient.patch<ApiResponse<{ message: string; ticketId: string; assignedToId: string }>>(`/tickets/${id}/assign`, {
      assignedToId,
    }),

  updateStatus: (
    id: string,
    status: string,
    resolution?: string,
    comment?: string
  ) => {
    const requestData = { status, resolution, comment };
    return httpClient.patch<ApiResponse<{ message: string; ticketId: string; status: string }>>(
      `/tickets/${id}/status`,
      requestData
    );
  },

  // Comments
  addComment: (data: CreateCommentInput) =>
    httpClient.post<ApiResponse<{ message: string; ticketId: string }>>('/comments', data),

  getComments: (ticketId: string) =>
    httpClient.get<ApiResponse<Comment[]>>(`/comments/ticket/${ticketId}`),

  getComment: (id: string) =>
    httpClient.get<ApiResponse<Comment>>(`/comments/${id}`),

  updateComment: (id: string, data: { content: string }) =>
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

  // Additional ticket endpoints (now using unified endpoint with viewType)
  getMyTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: { ...filters, viewType: 'my' },
    }),

  getAssignedTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: { ...filters, viewType: 'assigned' },
    }),

  getOverdueTickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: { ...filters, viewType: 'overdue' },
    }),

  getTicketsApproachingSLA: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: { ...filters, viewType: 'approaching-sla' },
    }),

  getBreachedSLATickets: (filters?: TicketFilters) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>('/tickets', {
      params: { ...filters, viewType: 'breached-sla' },
    }),
};


