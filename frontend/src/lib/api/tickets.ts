import { CreateTicketDto, Ticket, TicketFilterParams } from '@/types/ticket.types';
import { PaginatedResponse } from '@/types/api.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  };
}

export async function getTickets(
  params?: TicketFilterParams,
): Promise<PaginatedResponse<Ticket>> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${API_BASE}/api/tickets?${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch ticket');
  return res.json();
}

export async function createTicket(data: CreateTicketDto): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create ticket');
  return res.json();
}

export async function changeTicketStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) throw new Error('Failed to change ticket status');
  return res.json();
}

export async function getTicketTimeline(id: string) {
  const res = await fetch(`${API_BASE}/api/tickets/${id}/timeline`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}
