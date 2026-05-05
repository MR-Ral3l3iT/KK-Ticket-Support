import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/** Swagger ปิดเมื่อ NODE_ENV=production — เปิดได้เฉพาะเมื่อตั้ง ENABLE_SWAGGER=true (เช่น staging / VPN) */
function isSwaggerEnabled(): boolean {
  if (process.env.ENABLE_SWAGGER === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Local disk only: Firebase mode uses signed URLs instead of /api/files/*
  const attachmentStorage = (process.env.ATTACHMENT_STORAGE ?? 'local').toLowerCase();
  if (attachmentStorage !== 'firebase') {
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/files' });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const swaggerEnabled = isSwaggerEnabled();
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Ticket Support MA API')
      .setDescription(
        'ระบบ Ticket Support สำหรับงาน Maintenance Agreement (MA) — จัดการลูกค้า ระบบ สัญญา หมวดหมู่ และ Ticket ครบวงจร',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
