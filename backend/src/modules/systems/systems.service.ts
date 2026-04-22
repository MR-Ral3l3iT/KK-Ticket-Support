import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { SystemFilterDto } from './dto/system-filter.dto';
import { UpdateSystemDto } from './dto/update-system.dto';

const SYSTEM_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  customer: { select: { id: true, name: true, code: true } },
  _count: { select: { contracts: true, categories: true } },
} as const;

@Injectable()
export class SystemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: SystemFilterDto) {
    const { customerId, search, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.CustomerSystemWhereInput = {
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customerSystem.findMany({
        where,
        select: SYSTEM_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.customerSystem.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const system = await this.prisma.customerSystem.findFirst({
      where: { id, deletedAt: null },
      select: SYSTEM_SELECT,
    });
    if (!system) throw new NotFoundException('ไม่พบข้อมูลระบบ');
    return system;
  }

  async create(dto: CreateSystemDto) {
    const conflict = await this.prisma.customerSystem.findFirst({
      where: { customerId: dto.customerId, code: dto.code, deletedAt: null },
    });
    if (conflict) throw new ConflictException('รหัสระบบนี้ถูกใช้งานแล้วภายในลูกค้าเดียวกัน');

    return this.prisma.customerSystem.create({
      data: {
        customerId: dto.customerId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
      },
      select: SYSTEM_SELECT,
    });
  }

  async update(id: string, dto: UpdateSystemDto) {
    const system = await this.findOne(id);

    if (dto.code) {
      const conflict = await this.prisma.customerSystem.findFirst({
        where: { customerId: system.customerId, code: dto.code, id: { not: id }, deletedAt: null },
      });
      if (conflict) throw new ConflictException('รหัสระบบนี้ถูกใช้งานแล้วภายในลูกค้าเดียวกัน');
    }

    return this.prisma.customerSystem.update({
      where: { id },
      data: dto,
      select: SYSTEM_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customerSystem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
