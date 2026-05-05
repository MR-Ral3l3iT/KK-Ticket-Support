import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { readFileSync } from 'fs';
import { isAbsolute, join, resolve } from 'path';
import { randomBytes } from 'crypto';
import * as sharp from 'sharp';
import * as admin from 'firebase-admin';
import type { Bucket } from '@google-cloud/storage';

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

type StorageProvider = 'local' | 'firebase';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly provider: StorageProvider;
  private readonly presignedUrlExpiresSec: number;
  private firebaseBucket: Bucket | null = null;

  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = configService.get<string>('BACKEND_URL') ?? 'http://localhost:3001';
    const raw = (configService.get<string>('storage.provider') ?? 'local').toLowerCase();
    this.provider = raw === 'firebase' ? 'firebase' : 'local';
    this.presignedUrlExpiresSec =
      configService.get<number>('storage.presignedUrlExpires') ?? 3600;
  }

  onModuleInit() {
    if (this.provider === 'firebase') {
      this.initFirebase();
    }
  }

  private resolveCredentialPath(raw: string): string {
    return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  }

  private initFirebase(): void {
    const credPath =
      this.configService.get<string>('storage.firebaseCredentialPath') ??
      process.env.GOOGLE_APPLICATION_CREDENTIALS;
    let bucketName = this.configService.get<string>('storage.firebaseBucket') ?? undefined;

    if (!credPath?.trim()) {
      throw new InternalServerErrorException(
        'ATTACHMENT_STORAGE=firebase ต้องตั้ง GOOGLE_APPLICATION_CREDENTIALS หรือ FIREBASE_SERVICE_ACCOUNT_PATH',
      );
    }

    const resolved = this.resolveCredentialPath(credPath.trim());
    let serviceAccount: admin.ServiceAccount & { project_id?: string };
    try {
      serviceAccount = JSON.parse(readFileSync(resolved, 'utf8'));
    } catch {
      throw new InternalServerErrorException(`อ่าน Firebase service account ไม่ได้: ${resolved}`);
    }

    if (!bucketName?.trim() && serviceAccount.project_id) {
      bucketName = `${serviceAccount.project_id}.appspot.com`;
      this.logger.log(`ไม่ได้ตั้ง FIREBASE_STORAGE_BUCKET — ใช้ค่าเริ่มต้น ${bucketName}`);
    }

    if (!bucketName?.trim()) {
      throw new InternalServerErrorException(
        'ต้องตั้ง FIREBASE_STORAGE_BUCKET หรือให้ไฟล์ credential มี project_id',
      );
    }

    const name = bucketName.trim();

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: name,
      });
    }

    this.firebaseBucket = admin.storage().bucket(name);
    this.logger.log(`Firebase Storage พร้อมใช้งาน (bucket: ${name})`);
  }

  private getBucket(): Bucket {
    if (!this.firebaseBucket) {
      this.initFirebase();
    }
    return this.firebaseBucket!;
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

    const customerCode = ctx.customerCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ticketNumber = ctx.ticketNumber.replace(/[^a-zA-Z0-9_-]/g, '_');

    const uid = randomBytes(8).toString('hex');
    const isImage = IMAGE_MIME_TYPES.has(file.mimetype);

    let buffer: Buffer;
    let ext: string;
    let finalMimeType: string;

    if (isImage) {
      buffer = await sharp(file.buffer).webp({ quality: 82 }).toBuffer();
      ext = 'webp';
      finalMimeType = 'image/webp';
    } else {
      buffer = file.buffer;
      ext = (file.originalname.split('.').pop() ?? 'bin').toLowerCase();
      finalMimeType = file.mimetype;
    }

    const filename = `${uid}.${ext}`;
    const storageKey = `${customerCode}/${year}/${month}/${ticketNumber}/${filename}`;

    if (this.provider === 'firebase') {
      const bucket = this.getBucket();
      await bucket.file(storageKey).save(buffer, {
        metadata: { contentType: finalMimeType },
        resumable: false,
      });
    } else {
      const subDir = join(this.uploadDir, customerCode, year, month, ticketNumber);
      await mkdir(subDir, { recursive: true });
      await writeFile(join(subDir, filename), buffer);
    }

    return { storageKey, mimeType: finalMimeType, fileSize: buffer.length };
  }

  async getUrl(storageKey: string): Promise<string> {
    if (this.provider === 'firebase') {
      const [url] = await this.getBucket().file(storageKey).getSignedUrl({
        action: 'read',
        expires: Date.now() + this.presignedUrlExpiresSec * 1000,
      });
      return url;
    }
    return `${this.baseUrl}/api/files/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    if (this.provider === 'firebase') {
      try {
        await this.getBucket().file(storageKey).delete({ ignoreNotFound: true });
      } catch {
        // object may already be gone
      }
      return;
    }
    try {
      await unlink(join(this.uploadDir, ...storageKey.split('/')));
    } catch {
      // File may already be gone — not critical
    }
  }
}
