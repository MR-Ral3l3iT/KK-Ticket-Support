import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ticketId = request.params.id;

    if (!ticketId) return true;

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) return true;

    if (user.role === 'SUPPORT_AGENT') {
      return ticket.assigneeId === user.id || ticket.teamId === user.teamId;
    }

    if (user.role === 'CUSTOMER_ADMIN') {
      return ticket.customerId === user.customerId;
    }

    if (user.role === 'CUSTOMER_USER') {
      return (
        ticket.customerId === user.customerId &&
        ticket.createdById === user.id
      );
    }

    return false;
  }
}
