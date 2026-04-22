import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  customerId: true,
  teamId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true, code: true } },
  team: { select: { id: true, name: true } },
} as const;

const CUSTOMER_ROLES = new Set<UserRole>([
  UserRole.CUSTOMER_ADMIN,
  UserRole.CUSTOMER_USER,
]);

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: UserFilterDto, actorRole: UserRole, actorCustomerId?: string) {
    const { role, customerId, teamId, search, page = 1, limit = 20 } = filter;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(teamId && { teamId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // CUSTOMER_ADMIN can only see users of their own company
    if (actorRole === UserRole.CUSTOMER_ADMIN) {
      where.customerId = actorCustomerId;
    } else if (customerId) {
      where.customerId = customerId;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, actorRole?: UserRole, actorCustomerId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');

    if (actorRole === UserRole.CUSTOMER_ADMIN) {
      if (!actorCustomerId || user.customerId !== actorCustomerId) {
        throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงผู้ใช้งานนี้');
      }
      if (!CUSTOMER_ROLES.has(user.role)) {
        throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงผู้ใช้งานนี้');
      }
    }

    return user;
  }

  async create(dto: CreateUserDto, actorRole: UserRole, actorCustomerId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const isCustomerRole = CUSTOMER_ROLES.has(dto.role);
    const isSupportAgent = dto.role === UserRole.SUPPORT_AGENT;

    if (actorRole === UserRole.CUSTOMER_ADMIN) {
      if (!actorCustomerId) throw new ForbiddenException('ไม่พบบริษัทของผู้ใช้งานปัจจุบัน');
      if (dto.role !== UserRole.CUSTOMER_USER) {
        throw new ForbiddenException('CUSTOMER_ADMIN สามารถสร้างได้เฉพาะ CUSTOMER_USER เท่านั้น');
      }
      dto.customerId = actorCustomerId;
      dto.teamId = undefined;
    }

    if (isCustomerRole && !dto.customerId) {
      throw new BadRequestException('CUSTOMER roles ต้องระบุ customerId');
    }
    if (isSupportAgent && !dto.teamId) {
      throw new BadRequestException('SUPPORT_AGENT ต้องระบุ teamId');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        customerId: isCustomerRole ? dto.customerId : undefined,
        teamId: isSupportAgent ? dto.teamId : undefined,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, actorRole: UserRole, actorCustomerId?: string) {
    const target = await this.findOne(id, actorRole, actorCustomerId);

    if (actorRole === UserRole.CUSTOMER_ADMIN) {
      if (target.role !== UserRole.CUSTOMER_USER) {
        throw new ForbiddenException('CUSTOMER_ADMIN สามารถแก้ไขได้เฉพาะ CUSTOMER_USER เท่านั้น');
      }
      if (dto.role && dto.role !== UserRole.CUSTOMER_USER) {
        throw new ForbiddenException('CUSTOMER_ADMIN ไม่สามารถเปลี่ยน role เป็นประเภทอื่นได้');
      }
      if (dto.teamId !== undefined) {
        throw new ForbiddenException('CUSTOMER_ADMIN ไม่สามารถกำหนดทีม Support ได้');
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.role && { role: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.teamId !== undefined && { teamId: dto.teamId }),
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async resetPassword(id: string, newPassword: string, actorRole: UserRole, actorCustomerId?: string) {
    await this.findOne(id, actorRole, actorCustomerId);
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
  }

  async remove(id: string, actorRole: UserRole, actorCustomerId?: string) {
    const target = await this.findOne(id, actorRole, actorCustomerId);

    if (actorRole === UserRole.CUSTOMER_ADMIN && target.role !== UserRole.CUSTOMER_USER) {
      throw new ForbiddenException('CUSTOMER_ADMIN สามารถลบได้เฉพาะ CUSTOMER_USER เท่านั้น');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
