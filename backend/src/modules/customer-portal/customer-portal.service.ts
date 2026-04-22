import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService) {}

  async getSystemsByCustomer(customerId: string) {
    return this.prisma.customerSystem.findMany({
      where: { customerId, isActive: true, deletedAt: null },
      select: { id: true, name: true, code: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoriesBySystem(systemId: string, customerId: string) {
    const system = await this.prisma.customerSystem.findFirst({
      where: { id: systemId, customerId, isActive: true, deletedAt: null },
    });
    if (!system) throw new ForbiddenException('ระบบนี้ไม่ได้อยู่ในบัญชีของคุณ');

    return this.prisma.category.findMany({
      where: { systemId, isActive: true, deletedAt: null },
      select: { id: true, name: true, description: true, parentId: true, _count: { select: { children: true } } },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
  }
}
