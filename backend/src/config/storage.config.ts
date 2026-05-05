import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  accessKey: process.env.STORAGE_ACCESS_KEY,
  secretKey: process.env.STORAGE_SECRET_KEY,
  bucket: process.env.STORAGE_BUCKET,
  region: process.env.STORAGE_REGION ?? 'ap-southeast-1',
  presignedUrlExpires: parseInt(process.env.STORAGE_PRESIGNED_URL_EXPIRES ?? '3600', 10),
  /** local | firebase */
  provider: (process.env.ATTACHMENT_STORAGE ?? 'local').toLowerCase(),
  firebaseBucket: process.env.FIREBASE_STORAGE_BUCKET,
  firebaseCredentialPath:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
}));
