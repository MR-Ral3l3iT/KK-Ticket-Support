import { TicketStatus } from '@/types/ticket.types';

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string }
> = {
  OPEN:             { label: 'Open',             color: 'bg-blue-100 text-blue-800' },
  TRIAGED:          { label: 'Triaged',           color: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS:      { label: 'In Progress',       color: 'bg-yellow-100 text-yellow-800' },
  WAITING_CUSTOMER: { label: 'Waiting Customer',  color: 'bg-orange-100 text-orange-800' },
  WAITING_INTERNAL: { label: 'Waiting Internal',  color: 'bg-gray-100 text-gray-800' },
  RESOLVED:         { label: 'Resolved',          color: 'bg-green-100 text-green-800' },
  CLOSED:           { label: 'Closed',            color: 'bg-gray-200 text-gray-600' },
  REOPENED:         { label: 'Reopened',          color: 'bg-red-100 text-red-800' },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-red-200 text-red-600' },
};

export const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      color: 'bg-gray-100 text-gray-700' },
  MEDIUM:   { label: 'Medium',   color: 'bg-blue-100 text-blue-700' },
  HIGH:     { label: 'High',     color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};
