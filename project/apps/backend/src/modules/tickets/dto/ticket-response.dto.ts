import { ApiProperty } from '@nestjs/swagger';

/**
 * Minimal user data for ticket responses
 */
export class TicketUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  roles: string[];

  @ApiProperty()
  activeRole?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Minimal category data for ticket responses
 */
export class TicketCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, required: false })
  customName?: string;

  @ApiProperty({ nullable: true, required: false })
  description?: string;
}

/**
 * Minimal subcategory data for ticket responses
 */
export class TicketSubcategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, required: false })
  description?: string;
}

/**
 * Minimal comment data for ticket responses
 */
export class TicketCommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: () => TicketUserDto })
  user: TicketUserDto;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Minimal attachment data for ticket responses
 */
export class TicketAttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty({ type: () => TicketUserDto })
  uploadedBy: TicketUserDto;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Ticket response DTO - only includes fields used by the frontend
 */
export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketNumber: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ nullable: true })
  subcategoryId: string | null;

  @ApiProperty({ type: () => TicketCategoryDto })
  category: TicketCategoryDto;

  @ApiProperty({ type: () => TicketSubcategoryDto, nullable: true, required: false })
  subcategory?: TicketSubcategoryDto | null;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  impact: string;

  @ApiProperty({ type: () => TicketUserDto })
  requester: TicketUserDto;

  @ApiProperty({ type: () => TicketUserDto, nullable: true, required: false })
  assignedTo?: TicketUserDto | null;

  @ApiProperty({ nullable: true, required: false })
  dueDate?: Date | null;

  @ApiProperty({ nullable: true, required: false })
  resolution?: string | null;

  @ApiProperty({ type: [TicketCommentDto], required: false })
  comments?: TicketCommentDto[];

  @ApiProperty({ type: [TicketAttachmentDto], required: false })
  attachments?: TicketAttachmentDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true, required: false })
  closedAt?: Date | null;

  @ApiProperty({ nullable: true, required: false })
  responseTime?: number | null;

  @ApiProperty({ nullable: true, required: false })
  resolutionTime?: number | null;

  @ApiProperty({ type: 'object', nullable: true, required: false })
  customFields?: Record<string, string>;

  @ApiProperty({ type: [String], required: false })
  relatedTickets?: string[];

  @ApiProperty({ type: 'object', nullable: true, required: false })
  workflowSnapshot?: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, required: false })
  workflowVersion?: number | null;
}

