import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamFilterDto } from './dto/team-filter.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

const TEAM_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { members: true, tickets: true } },
} as const;

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: TeamFilterDto) {
    const { search, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        select: TEAM_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.team.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
          where: { deletedAt: null },
          orderBy: { firstName: 'asc' },
        },
        _count: { select: { tickets: true } },
      },
    });
    if (!team) throw new NotFoundException('ไม่พบข้อมูลทีม');
    return team;
  }

  async create(dto: CreateTeamDto) {
    const conflict = await this.prisma.team.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (conflict) throw new ConflictException('ชื่อทีมนี้มีอยู่แล้ว');

    return this.prisma.team.create({
      data: { name: dto.name, description: dto.description },
      select: TEAM_SELECT,
    });
  }

  async update(id: string, dto: UpdateTeamDto) {
    await this.findOne(id);

    if (dto.name) {
      const conflict = await this.prisma.team.findFirst({
        where: { name: dto.name, id: { not: id }, deletedAt: null },
      });
      if (conflict) throw new ConflictException('ชื่อทีมนี้มีอยู่แล้ว');
    }

    return this.prisma.team.update({ where: { id }, data: dto, select: TEAM_SELECT });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
