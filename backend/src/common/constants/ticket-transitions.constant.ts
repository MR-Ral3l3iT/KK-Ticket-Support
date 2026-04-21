import { TicketStatus } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:             ['TRIAGED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'CANCELLED'],
  TRIAGED:          ['IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'CANCELLED'],
  IN_PROGRESS:      ['WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED'],
  WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  WAITING_INTERNAL: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED:         ['CLOSED', 'REOPENED'],
  REOPENED:         ['IN_PROGRESS', 'WAITING_CUSTOMER'],
  CLOSED:           [],
  CANCELLED:        [],
};

export const CUSTOMER_ALLOWED_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  RESOLVED:         ['CLOSED', 'REOPENED'],
  WAITING_CUSTOMER: ['IN_PROGRESS'],
};

export const SLA_PAUSE_STATUSES: TicketStatus[] = [
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
];
