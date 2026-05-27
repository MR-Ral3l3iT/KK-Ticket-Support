import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractFilterDto } from './dto/contract-filter.dto';
import { CreateContractDto, SlaMinutesDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

const PRIORITIES: TicketPriority[] = [
  TicketPriority.LOW,
  TicketPriority.MEDIUM,
  TicketPriority.HIGH,
  TicketPriority.CRITICAL,
];

const DEFAULT_SLA_FIRST_RESPONSE: SlaMinutesDto = {
  LOW: 480,
  MEDIUM: 240,
  HIGH: 60,
  CRITICAL: 30,
};

const DEFAULT_SLA_RESOLUTION: SlaMinutesDto = {
  LOW: 2880,
  MEDIUM: 1440,
  HIGH: 480,
  CRITICAL: 240,
};

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
  slaPolicies: {
    where: { isActive: true },
    select: { priority: true, firstResponseMinutes: true, resolutionMinutes: true, businessHoursOnly: true },
  },
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

    return {
      data: data.map((contract) => this.withSlaMaps(contract)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, deletedAt: null },
      select: CONTRACT_SELECT,
    });
    if (!contract) throw new NotFoundException('ไม่พบข้อมูลสัญญา');
    return this.withSlaMaps(contract);
  }

  async create(dto: CreateContractDto) {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มต้นสัญญา');
    }

    const existing = await this.prisma.contract.findUnique({ where: { contractNumber: dto.contractNumber } });
    if (existing) throw new ConflictException('เลขที่สัญญานี้ถูกใช้งานแล้ว');

    const contract = await this.prisma.contract.create({
      data: {
        customerId: dto.customerId,
        systemId: dto.systemId,
        contractNumber: dto.contractNumber,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        renewedFromId: dto.renewedFromId,
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: { id: true },
    });

    await this.upsertSlaPolicies(
      contract.id,
      dto.slaFirstResponseMinutes ?? DEFAULT_SLA_FIRST_RESPONSE,
      dto.slaResolutionMinutes ?? DEFAULT_SLA_RESOLUTION,
    );

    return this.findOne(contract.id);
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

    await this.prisma.contract.update({ where: { id }, data, select: { id: true } });

    if (dto.slaFirstResponseMinutes || dto.slaResolutionMinutes) {
      const current = await this.prisma.slaPolicy.findMany({
        where: { contractId: id, isActive: true },
        select: { priority: true, firstResponseMinutes: true, resolutionMinutes: true },
      });

      const currentFirst = this.mapSlaFromPolicies(
        current,
        'firstResponseMinutes',
        DEFAULT_SLA_FIRST_RESPONSE,
      );
      const currentResolution = this.mapSlaFromPolicies(
        current,
        'resolutionMinutes',
        DEFAULT_SLA_RESOLUTION,
      );

      await this.upsertSlaPolicies(
        id,
        dto.slaFirstResponseMinutes ?? currentFirst,
        dto.slaResolutionMinutes ?? currentResolution,
      );
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  private mapSlaFromPolicies(
    policies: Array<{ priority: TicketPriority; firstResponseMinutes: number; resolutionMinutes: number }>,
    key: 'firstResponseMinutes' | 'resolutionMinutes',
    fallback: SlaMinutesDto,
  ): SlaMinutesDto {
    return {
      LOW: policies.find((p) => p.priority === TicketPriority.LOW)?.[key] ?? fallback.LOW,
      MEDIUM:
        policies.find((p) => p.priority === TicketPriority.MEDIUM)?.[key] ??
        fallback.MEDIUM,
      HIGH: policies.find((p) => p.priority === TicketPriority.HIGH)?.[key] ?? fallback.HIGH,
      CRITICAL:
        policies.find((p) => p.priority === TicketPriority.CRITICAL)?.[key] ??
        fallback.CRITICAL,
    };
  }

  private async upsertSlaPolicies(
    contractId: string,
    firstResponse: SlaMinutesDto,
    resolution: SlaMinutesDto,
  ) {
    await this.prisma.$transaction(
      PRIORITIES.map((priority) =>
        this.prisma.slaPolicy.upsert({
          where: { contractId_priority: { contractId, priority } },
          update: {
            firstResponseMinutes: firstResponse[priority],
            resolutionMinutes: resolution[priority],
            isActive: true,
          },
          create: {
            contractId,
            priority,
            firstResponseMinutes: firstResponse[priority],
            resolutionMinutes: resolution[priority],
            businessHoursOnly: true,
            isActive: true,
          },
        }),
      ),
    );
  }

  private withSlaMaps(
    contract: Prisma.ContractGetPayload<{ select: typeof CONTRACT_SELECT }>,
  ) {
    const firstResponse = {
      LOW:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.LOW)?.firstResponseMinutes ??
        DEFAULT_SLA_FIRST_RESPONSE.LOW,
      MEDIUM:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.MEDIUM)?.firstResponseMinutes ??
        DEFAULT_SLA_FIRST_RESPONSE.MEDIUM,
      HIGH:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.HIGH)?.firstResponseMinutes ??
        DEFAULT_SLA_FIRST_RESPONSE.HIGH,
      CRITICAL:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.CRITICAL)?.firstResponseMinutes ??
        DEFAULT_SLA_FIRST_RESPONSE.CRITICAL,
    };

    const resolution = {
      LOW:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.LOW)?.resolutionMinutes ??
        DEFAULT_SLA_RESOLUTION.LOW,
      MEDIUM:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.MEDIUM)?.resolutionMinutes ??
        DEFAULT_SLA_RESOLUTION.MEDIUM,
      HIGH:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.HIGH)?.resolutionMinutes ??
        DEFAULT_SLA_RESOLUTION.HIGH,
      CRITICAL:
        contract.slaPolicies.find((p) => p.priority === TicketPriority.CRITICAL)?.resolutionMinutes ??
        DEFAULT_SLA_RESOLUTION.CRITICAL,
    };

    return {
      ...contract,
      slaFirstResponseMinutes: firstResponse,
      slaResolutionMinutes: resolution,
      businessHoursOnly: contract.slaPolicies.every((p) => p.businessHoursOnly),
    };
  }
}
