export type TicketStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'WAITING_INTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ScopeType = 'IN_SCOPE' | 'OUT_SCOPE';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  scopeType?: ScopeType;
  customerId: string;
  systemId: string;
  categoryId?: string;
  createdById: string;
  assigneeId?: string;
  teamId?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  systemId: string;
  categoryId?: string;
  priority?: TicketPriority;
}

export interface TicketFilterParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  limit?: number;
}
