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

export interface SlaTracking {
  firstResponseDue?: string | null;
  firstResponseAt?: string | null;
  resolutionDue?: string | null;
  resolutionAt?: string | null;
  isFirstResponseBreached: boolean;
  isResolutionBreached: boolean;
  pausedAt?: string | null;
  totalPausedMinutes: number;
}

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
  slaTracking?: SlaTracking | null;
  customer?: { id: string; name: string };
  system?: { id: string; name: string };
  category?: { id: string; name: string };
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  team?: { id: string; name: string };
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
