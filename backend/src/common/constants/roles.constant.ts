import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const SUPPORT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SUPPORT_ADMIN,
  UserRole.SUPPORT_AGENT,
];

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SUPPORT_ADMIN,
];

export const CUSTOMER_ROLES: UserRole[] = [
  UserRole.CUSTOMER_ADMIN,
  UserRole.CUSTOMER_USER,
];
