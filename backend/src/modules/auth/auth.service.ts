import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive || stored.user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Rotate: revoke old token and issue new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(stored.user);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
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
        customer: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  private async generateTokens(user: { id: string; email: string; role: string; customerId?: string | null; teamId?: string | null }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId ?? undefined,
      teamId: user.teamId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
    });

    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn));

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: this.jwtService.sign(payload, {
          expiresIn: refreshExpiresIn,
          secret: this.config.get<string>('jwt.secret') + '-refresh',
        }),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }
}
