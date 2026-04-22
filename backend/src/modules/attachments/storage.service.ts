import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import * as sharp from 'sharp';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30 MB per ticket upload batch

export interface StorageContext {
  customerCode: string;
  ticketNumber: string;
}

export interface UploadResult {
  storageKey: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = configService.get<string>('BACKEND_URL') ?? 'http://localhost:3001';
  }

  validateFiles(files: Express.Multer.File[]) {
    let totalSize = 0;
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `ประเภทไฟล์ไม่รองรับ: ${file.originalname} (${file.mimetype})`,
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`ไฟล์ ${file.originalname} มีขนาดเกิน 10 MB`);
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new BadRequestException('ขนาดไฟล์รวมเกิน 30 MB');
    }
  }

  async upload(
    file: Express.Multer.File,
    ctx: StorageContext,
  ): Promise<UploadResult> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Sanitize path segments to prevent directory traversal
    const customerCode = ctx.customerCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ticketNumber = ctx.ticketNumber.replace(/[^a-zA-Z0-9_-]/g, '_');

    const subDir = join(this.uploadDir, customerCode, year, month, ticketNumber);
    await mkdir(subDir, { recursive: true });

    const uid = randomBytes(8).toString('hex');
    const isImage = IMAGE_MIME_TYPES.has(file.mimetype);

    let buffer: Buffer;
    let ext: string;
    let finalMimeType: string;

    if (isImage) {
      buffer = await sharp(file.buffer)
        .webp({ quality: 82 })
        .toBuffer();
      ext = 'webp';
      finalMimeType = 'image/webp';
    } else {
      buffer = file.buffer;
      ext = (file.originalname.split('.').pop() ?? 'bin').toLowerCase();
      finalMimeType = file.mimetype;
    }

    const filename = `${uid}.${ext}`;
    const storageKey = `${customerCode}/${year}/${month}/${ticketNumber}/${filename}`;
    await writeFile(join(subDir, filename), buffer);

    return { storageKey, mimeType: finalMimeType, fileSize: buffer.length };
  }

  async getUrl(storageKey: string): Promise<string> {
    // Phase 1: local static URL  |  Phase 2: presigned S3/MinIO URL (1 hour TTL)
    return `${this.baseUrl}/api/files/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, ...storageKey.split('/')));
    } catch {
      // File may already be gone — not critical
    }
  }
}
