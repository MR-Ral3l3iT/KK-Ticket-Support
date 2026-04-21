export type UserRole =
  | 'SUPER_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'SUPPORT_AGENT'
  | 'CUSTOMER_ADMIN'
  | 'CUSTOMER_USER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  customerId?: string;
  teamId?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
  customerId?: string;
  teamId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
