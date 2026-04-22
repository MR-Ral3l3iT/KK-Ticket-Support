import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractFilterDto } from './dto/contract-filter.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

const CONTRACT_SELECT = {
  id: true,
  contractNumber: true,
  name: true,
  startDate: true,
  endDate: true,
  isActive: true,
  renewedFromId: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  systemId: true,
  customer: { select: { id: true, name: true, code: true } },
  system: { select: { id: true, name: true, code: true } },
  _count: { select: { slaPolicies: true, categoryScopes: true } },
} as const;

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: ContractFilterDto) {
    const { customerId, systemId, search, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.ContractWhereInput = {
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(systemId && { systemId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { contractNumber: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        select: CONTRACT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...CONTRACT_SELECT,
        slaPolicies: {
          select: { id: true, priority: true, firstResponseMinutes: true, resolutionMinutes: true, businessHoursOnly: true, isActive: true },
          where: { isActive: true },
        },
      },
    });
    if (!contract) throw new NotFoundException('ไม่พบข้อมูลสัญญา');
    return contract;
  }

  async create(dto: CreateContractDto) {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มต้นสัญญา');
    }

    const existing = await this.prisma.contract.findUnique({ where: { contractNumber: dto.contractNumber } });
    if (existing) throw new ConflictException('เลขที่สัญญานี้ถูกใช้งานแล้ว');

    return this.prisma.contract.create({
      data: {
        customerId: dto.customerId,
        systemId: dto.systemId,
        contractNumber: dto.contractNumber,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        renewedFromId: dto.renewedFromId,
      },
      select: CONTRACT_SELECT,
    });
  }

  async update(id: string, dto: UpdateContractDto) {
    const contract = await this.findOne(id);

    if (dto.startDate || dto.endDate) {
      const start = dto.startDate ? new Date(dto.startDate) : contract.startDate;
      const end = dto.endDate ? new Date(dto.endDate) : contract.endDate;
      if (end <= start) throw new BadRequestException('วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มต้นสัญญา');
    }

    if (dto.contractNumber && dto.contractNumber !== contract.contractNumber) {
      const conflict = await this.prisma.contract.findUnique({ where: { contractNumber: dto.contractNumber } });
      if (conflict) throw new ConflictException('เลขที่สัญญานี้ถูกใช้งานแล้ว');
    }

    const data: Prisma.ContractUpdateInput = {
      ...(dto.contractNumber && { contractNumber: dto.contractNumber }),
      ...(dto.name && { name: dto.name }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.renewedFromId !== undefined && { renewedFromId: dto.renewedFromId }),
    };

    return this.prisma.contract.update({ where: { id }, data, select: CONTRACT_SELECT });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
