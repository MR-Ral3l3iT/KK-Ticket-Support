import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  code: true,
  email: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { systems: true, contracts: true } },
} as const;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: CustomerFilterDto) {
    const { search, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        select: CUSTOMER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        systems: {
          select: { id: true, name: true, code: true, isActive: true },
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        _count: { select: { contracts: true } },
      },
    });
    if (!customer) throw new NotFoundException('ไม่พบข้อมูลลูกค้า');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('รหัสลูกค้านี้ถูกใช้งานแล้ว');

    return this.prisma.customer.create({
      data: {
        name: dto.name,
        code: dto.code,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
      select: CUSTOMER_SELECT,
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    if (dto.code) {
      const conflict = await this.prisma.customer.findFirst({
        where: { code: dto.code, id: { not: id }, deletedAt: null },
      });
      if (conflict) throw new ConflictException('รหัสลูกค้านี้ถูกใช้งานแล้ว');
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      select: CUSTOMER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
