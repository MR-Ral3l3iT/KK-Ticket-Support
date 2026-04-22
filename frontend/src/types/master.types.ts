export interface Customer {
  id: string;
  name: string;
  code: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { systems: number; users: number; tickets: number };
}

export interface CustomerSystem {
  id: string;
  name: string;
  code: string;
  description?: string;
  customerId: string;
  customer?: { id: string; name: string; code: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { contracts: number; categories: number; tickets: number };
}

export interface SlaMinutes {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface Contract {
  id: string;
  name: string;
  customerId: string;
  systemId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  businessHoursOnly: boolean;
  slaFirstResponseMinutes: SlaMinutes;
  slaResolutionMinutes: SlaMinutes;
  customer?: { id: string; name: string; code: string };
  system?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  systemId: string;
  parentId?: string;
  system?: { id: string; name: string; code: string };
  parent?: { id: string; name: string };
  _count?: { children: number; tickets: number };
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { members: number };
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  customerId?: string;
  teamId?: string;
  customer?: { id: string; name: string };
  team?: { id: string; name: string };
  createdAt: string;
  lastLoginAt?: string;
}

export interface DashboardKpi {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  slaBreached: number;
  avgResolutionHours: number;
  totalThisMonth: number;
}
