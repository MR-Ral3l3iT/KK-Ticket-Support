import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  systemId: true,
  system: { select: { id: true, name: true, code: true } },
  parent: { select: { id: true, name: true } },
  _count: { select: { children: true } },
} as const;

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: CategoryFilterDto) {
    const { systemId, parentId, search, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(systemId && { systemId }),
      ...(isActive !== undefined && { isActive }),
      ...(parentId === 'root' ? { parentId: null } : parentId ? { parentId } : {}),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        select: CATEGORY_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...CATEGORY_SELECT,
        children: {
          select: { id: true, name: true, isActive: true },
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('ไม่พบข้อมูลหมวดหมู่');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const parentId = dto.parentId === 'root' ? null : dto.parentId ?? null;

    if (parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: parentId, deletedAt: null },
        select: { id: true, systemId: true, parentId: true },
      });
      if (!parent) throw new NotFoundException('ไม่พบหมวดหมู่หลักที่เลือก');
      if (parent.systemId !== dto.systemId) {
        throw new BadRequestException('หมวดหมู่หลักต้องอยู่ในระบบเดียวกัน');
      }
      if (parent.parentId) {
        throw new BadRequestException('สามารถเลือกได้เฉพาะหมวดหมู่หลักเป็น Parent');
      }
    }

    const conflict = await this.prisma.category.findFirst({
      where: {
        systemId: dto.systemId,
        name: dto.name,
        parentId,
        deletedAt: null,
      },
    });
    if (conflict) throw new ConflictException('ชื่อหมวดหมู่นี้มีอยู่แล้วภายในระดับเดียวกัน');

    return this.prisma.category.create({
      data: {
        systemId: dto.systemId,
        name: dto.name,
        description: dto.description,
        parentId,
      },
      select: CATEGORY_SELECT,
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const targetParentId =
      dto.parentId === undefined
        ? category.parentId
        : dto.parentId === 'root'
          ? null
          : dto.parentId;

    if (targetParentId) {
      if (targetParentId === id) {
        throw new BadRequestException('ไม่สามารถเลือกตัวเองเป็นหมวดหมู่หลักได้');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: targetParentId, deletedAt: null },
        select: { id: true, systemId: true, parentId: true },
      });
      if (!parent) throw new NotFoundException('ไม่พบหมวดหมู่หลักที่เลือก');
      if (parent.systemId !== category.systemId) {
        throw new BadRequestException('หมวดหมู่หลักต้องอยู่ในระบบเดียวกัน');
      }
      if (parent.parentId) {
        throw new BadRequestException('สามารถเลือกได้เฉพาะหมวดหมู่หลักเป็น Parent');
      }
    }

    if (dto.name) {
      const conflict = await this.prisma.category.findFirst({
        where: {
          systemId: category.systemId,
          name: dto.name,
          parentId: targetParentId,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (conflict) throw new ConflictException('ชื่อหมวดหมู่นี้มีอยู่แล้วภายในระดับเดียวกัน');
    }

    const updateData: Prisma.CategoryUpdateInput = {
      ...dto,
      ...(dto.parentId !== undefined && { parentId: targetParentId }),
    };

    return this.prisma.category.update({
      where: { id },
      data: updateData,
      select: CATEGORY_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
