# Ticket Support MA System — Development Specification
> Version: 1.0 | Phase: 1 (Web Application)
> Stack: Next.js + NestJS + PostgreSQL + Prisma

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema (Prisma)](#4-database-schema-prisma)
5. [Role & Permission Matrix](#5-role--permission-matrix)
6. [Status Flow & Transition Rules](#6-status-flow--transition-rules)
7. [Business Rules](#7-business-rules)
8. [API Specification](#8-api-specification)
9. [Module Architecture (NestJS)](#9-module-architecture-nestjs)
10. [Frontend Architecture (Next.js)](#10-frontend-architecture-nextjs)
11. [Security Requirements](#11-security-requirements)
12. [SLA Design](#12-sla-design)
13. [Notification System](#13-notification-system)
14. [Phase 2 Preparation](#14-phase-2-preparation)

---

## 1. System Overview

### แนวคิดหลัก

ระบบ Ticket Support สำหรับงาน MA (Maintenance Agreement) ที่รองรับ:

- **1 ลูกค้า → หลายระบบ (Systems)**
- **แต่ละระบบ → มี MA Contract / Scope ไม่เหมือนกัน**
- **แต่ละระบบ → มีหมวดหมู่ Ticket ของตัวเอง**
- **2 ฝั่งหลัก**: Customer Portal + Admin/Support Console

### 4 ชั้นหลักของระบบ

```
┌─────────────────────────────────────────────────┐
│  1. Customer Layer                               │
│     บริษัทลูกค้า → ผู้ใช้งาน → ระบบที่ถืออยู่   │
├─────────────────────────────────────────────────┤
│  2. Service Scope / MA Layer                     │
│     Contract, Categories, SLA, ขอบเขตงาน        │
├─────────────────────────────────────────────────┤
│  3. Ticketing Layer                              │
│     สร้าง/รับ/จัดการ/ปิด Ticket + Communication │
├─────────────────────────────────────────────────┤
│  4. Administration Layer                         │
│     Dashboard, Reports, Master Data              │
└─────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | TypeScript |
| UI Framework | Tailwind CSS + Lucide Icons | |
| Backend | NestJS + Node.js | TypeScript |
| Database | PostgreSQL | |
| ORM | Prisma | |
| API Docs | Swagger (`@nestjs/swagger`) | |
| Auth | JWT + Refresh Token | `@nestjs/jwt` |
| Validation | class-validator + class-transformer | ทุก DTO |
| File Storage | S3 / MinIO / Cloudflare R2 | Presigned URL |
| Rate Limiting | `@nestjs/throttler` | |
| Queue (Phase 2) | BullMQ | Email / LINE notification |

---

## 3. Project Structure

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/                        # Environment configs
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── storage.config.ts
│   │
│   ├── common/                        # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ticket-access.guard.ts  # Row-level security
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── audit-log.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── constants/
│   │       ├── roles.constant.ts
│   │       └── ticket-transitions.constant.ts  # Transition matrix
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── customers/
│   │   │   ├── customers.module.ts
│   │   │   ├── customers.controller.ts
│   │   │   ├── customers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── systems/                   # ระบบของลูกค้า
│   │   │   ├── systems.module.ts
│   │   │   ├── systems.controller.ts
│   │   │   ├── systems.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── contracts/                 # MA Contract / Scope
│   │   │   ├── contracts.module.ts
│   │   │   ├── contracts.controller.ts
│   │   │   ├── contracts.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── tickets/
│   │   │   ├── tickets.module.ts
│   │   │   ├── tickets.controller.ts  # Customer Portal APIs
│   │   │   ├── tickets-admin.controller.ts  # Admin/Support APIs
│   │   │   ├── tickets.service.ts
│   │   │   ├── tickets-transition.service.ts  # Status transition logic
│   │   │   └── dto/
│   │   │       ├── create-ticket.dto.ts
│   │   │       ├── update-ticket.dto.ts
│   │   │       ├── change-status.dto.ts
│   │   │       └── ticket-filter.dto.ts
│   │   │
│   │   ├── comments/
│   │   │   ├── comments.module.ts
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── attachments/
│   │   │   ├── attachments.module.ts
│   │   │   ├── attachments.controller.ts
│   │   │   ├── attachments.service.ts
│   │   │   └── storage.service.ts     # S3 / MinIO integration
│   │   │
│   │   ├── audit-logs/
│   │   │   ├── audit-logs.module.ts
│   │   │   └── audit-logs.service.ts
│   │   │
│   │   ├── sla/
│   │   │   ├── sla.module.ts
│   │   │   ├── sla.service.ts         # SLA tracking + clock pause
│   │   │   └── sla-policy.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── channels/
│   │   │       ├── email.channel.ts
│   │   │       └── in-app.channel.ts  # Phase 2: line.channel.ts
│   │   │
│   │   └── reports/
│   │       ├── reports.module.ts
│   │       ├── reports.controller.ts
│   │       └── reports.service.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
├── .env
├── .env.example
└── package.json
```

### Frontend (Next.js)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (customer)/                # Customer Portal
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx           # Ticket list
│   │   │   │   ├── new/page.tsx       # Create ticket
│   │   │   │   └── [id]/page.tsx      # Ticket detail
│   │   │   └── profile/page.tsx
│   │   │
│   │   └── (admin)/                   # Admin / Support Console
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── tickets/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── customers/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── systems/page.tsx
│   │       ├── contracts/page.tsx
│   │       ├── categories/page.tsx
│   │       ├── users/page.tsx
│   │       ├── teams/page.tsx
│   │       └── reports/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # Base UI components
│   │   ├── tickets/
│   │   │   ├── TicketCard.tsx
│   │   │   ├── TicketTimeline.tsx
│   │   │   ├── TicketStatusBadge.tsx
│   │   │   ├── CommentBox.tsx
│   │   │   └── FileUploader.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Breadcrumb.tsx
│   │   └── common/
│   │       ├── DataTable.tsx
│   │       ├── StatusSelect.tsx
│   │       └── UserAvatar.tsx
│   │
│   ├── lib/
│   │   ├── api/                       # API client functions
│   │   │   ├── tickets.ts
│   │   │   ├── customers.ts
│   │   │   └── auth.ts
│   │   ├── hooks/
│   │   │   ├── useTickets.ts
│   │   │   └── useAuth.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       └── status.ts
│   │
│   └── types/
│       ├── ticket.types.ts
│       ├── user.types.ts
│       └── api.types.ts
│
└── package.json
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────
// ENUMS
// ─────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  SUPPORT_ADMIN
  SUPPORT_AGENT
  CUSTOMER_ADMIN
  CUSTOMER_USER
}

enum TicketStatus {
  OPEN
  TRIAGED
  IN_PROGRESS
  WAITING_CUSTOMER
  WAITING_INTERNAL
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum CommentType {
  PUBLIC    // ลูกค้าเห็น
  INTERNAL  // เห็นเฉพาะทีม support
}

enum NotificationChannel {
  EMAIL
  IN_APP
  LINE  // Phase 2
}

enum AuditAction {
  TICKET_CREATED
  STATUS_CHANGED
  ASSIGNEE_CHANGED
  TEAM_CHANGED
  PRIORITY_CHANGED
  COMMENT_ADDED
  ATTACHMENT_ADDED
  SLA_BREACHED
  TICKET_REOPENED
  TICKET_CLOSED
}

enum ScopeType {
  IN_SCOPE   // อยู่ใน MA
  OUT_SCOPE  // นอก MA
}

// ─────────────────────────────────────
// CUSTOMER & ORGANIZATION
// ─────────────────────────────────────

model Customer {
  id          String    @id @default(cuid())
  name        String
  code        String    @unique  // รหัสลูกค้า เช่น CUST-001
  email       String?
  phone       String?
  address     String?
  isActive    Boolean   @default(true)
  deletedAt   DateTime?           // Soft delete
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  users       User[]
  systems     CustomerSystem[]
  contracts   Contract[]

  @@map("customers")
}

model Team {
  id          String    @id @default(cuid())
  name        String
  description String?
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  members     User[]
  tickets     Ticket[]

  @@map("teams")
}

model User {
  id          String    @id @default(cuid())
  email       String    @unique
  password    String    // bcrypt hashed
  firstName   String
  lastName    String
  phone       String?
  role        UserRole
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // สำหรับ Customer User
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id])

  // สำหรับ Support Agent
  teamId      String?
  team        Team?     @relation(fields: [teamId], references: [id])

  // Relations
  createdTickets    Ticket[]   @relation("TicketCreator")
  assignedTickets   Ticket[]   @relation("TicketAssignee")
  comments          Comment[]
  auditLogs         AuditLog[]
  refreshTokens     RefreshToken[]
  notificationPrefs NotificationPreference[]

  @@map("users")
}

model RefreshToken {
  id          String    @id @default(cuid())
  token       String    @unique
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?

  @@map("refresh_tokens")
}

// ─────────────────────────────────────
// CUSTOMER SYSTEMS & CONTRACT
// ─────────────────────────────────────

model CustomerSystem {
  id          String    @id @default(cuid())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id])
  name        String                    // เช่น "Booking System"
  code        String                    // เช่น "SYS-BK-001"
  description String?
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  contracts   Contract[]
  tickets     Ticket[]

  @@unique([customerId, code])
  @@map("customer_systems")
}

model Contract {
  id              String    @id @default(cuid())
  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])
  systemId        String
  system          CustomerSystem @relation(fields: [systemId], references: [id])
  contractNumber  String    @unique
  name            String
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean   @default(true)
  renewedFromId   String?   // อ้างอิงสัญญาเดิมเมื่อต่ออายุ
  renewedFrom     Contract? @relation("ContractRenewal", fields: [renewedFromId], references: [id])
  renewals        Contract[] @relation("ContractRenewal")
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  categoryScopes  ContractCategoryScope[]
  slaPolicies     SlaPolicy[]

  @@map("contracts")
}

model Category {
  id          String    @id @default(cuid())
  systemId    String
  system      CustomerSystem @relation(fields: [systemId], references: [id])
  name        String                    // เช่น "Bug", "Change Request"
  description String?
  parentId    String?                   // Self-referencing สำหรับ sub-category
  parent      Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  contractScopes  ContractCategoryScope[]
  tickets         Ticket[]

  @@map("categories")
}

// ผูก Category กับ Contract → กำหนดว่า category นี้ in-scope หรือ out-scope
model ContractCategoryScope {
  id          String    @id @default(cuid())
  contractId  String
  contract    Contract  @relation(fields: [contractId], references: [id])
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  scopeType   ScopeType @default(IN_SCOPE)
  isActive    Boolean   @default(true)

  @@unique([contractId, categoryId])
  @@map("contract_category_scopes")
}

// ─────────────────────────────────────
// TICKET
// ─────────────────────────────────────

model Ticket {
  id            String        @id @default(cuid())
  ticketNumber  String        @unique  // TKT-2024-00001
  title         String
  description   String
  status        TicketStatus  @default(OPEN)
  priority      TicketPriority @default(MEDIUM)
  scopeType     ScopeType?    // in-scope / out-scope ประเมินตอนรับเรื่อง

  // Relations
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])  // ← เพิ่มใน Customer model
  systemId      String
  system        CustomerSystem @relation(fields: [systemId], references: [id])
  categoryId    String?
  category      Category?     @relation(fields: [categoryId], references: [id])

  createdById   String
  createdBy     User          @relation("TicketCreator", fields: [createdById], references: [id])

  assigneeId    String?
  assignee      User?         @relation("TicketAssignee", fields: [assigneeId], references: [id])

  teamId        String?
  team          Team?         @relation(fields: [teamId], references: [id])

  // Timestamps
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  closedAt        DateTime?
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  comments        Comment[]
  attachments     Attachment[]
  auditLogs       AuditLog[]
  slaTracking     SlaTracking?
  followUpFromId  String?       // ticket ที่ reopen มาจาก closed ticket

  @@map("tickets")
}

model Comment {
  id          String      @id @default(cuid())
  ticketId    String
  ticket      Ticket      @relation(fields: [ticketId], references: [id])
  authorId    String
  author      User        @relation(fields: [authorId], references: [id])
  content     String
  type        CommentType @default(PUBLIC)
  deletedAt   DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  attachments Attachment[]

  @@map("comments")
}

model Attachment {
  id          String    @id @default(cuid())
  ticketId    String
  ticket      Ticket    @relation(fields: [ticketId], references: [id])
  commentId   String?
  comment     Comment?  @relation(fields: [commentId], references: [id])
  uploadedById String
  fileName    String
  fileSize    Int       // bytes
  mimeType    String
  storageKey  String    // S3/MinIO object key
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@map("attachments")
}

// ─────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────

model AuditLog {
  id          String      @id @default(cuid())
  ticketId    String
  ticket      Ticket      @relation(fields: [ticketId], references: [id])
  actorId     String?     // null = system action
  actor       User?       @relation(fields: [actorId], references: [id])
  action      AuditAction
  fromValue   String?     // ค่าเดิม
  toValue     String?     // ค่าใหม่
  metadata    Json?       // ข้อมูลเพิ่มเติม
  createdAt   DateTime    @default(now())

  @@map("audit_logs")
}

// ─────────────────────────────────────
// SLA
// ─────────────────────────────────────

model SlaPolicy {
  id                      String    @id @default(cuid())
  contractId              String
  contract                Contract  @relation(fields: [contractId], references: [id])
  priority                TicketPriority
  firstResponseMinutes    Int       // เวลาตอบรับครั้งแรก (นาที)
  resolutionMinutes       Int       // เวลาปิดงาน (นาที)
  businessHoursOnly       Boolean   @default(true)
  isActive                Boolean   @default(true)

  @@unique([contractId, priority])
  @@map("sla_policies")
}

model SlaTracking {
  id                      String    @id @default(cuid())
  ticketId                String    @unique
  ticket                  Ticket    @relation(fields: [ticketId], references: [id])

  firstResponseDue        DateTime?
  firstResponseAt         DateTime?
  isFirstResponseBreached Boolean   @default(false)

  resolutionDue           DateTime?
  resolutionAt            DateTime?
  isResolutionBreached    Boolean   @default(false)

  // SLA Clock Pause tracking
  pausedAt                DateTime?           // เวลาที่ pause ล่าสุด
  totalPausedMinutes      Int       @default(0) // รวมเวลาที่ถูก pause

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@map("sla_tracking")
}

// ─────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────

model NotificationPreference {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(fields: [userId], references: [id])
  channel     NotificationChannel
  event       String              // ticket.created | status_changed | comment.added | sla.breached
  isEnabled   Boolean             @default(true)

  @@unique([userId, channel, event])
  @@map("notification_preferences")
}

model Notification {
  id          String    @id @default(cuid())
  userId      String
  title       String
  body        String
  channel     NotificationChannel
  event       String
  isRead      Boolean   @default(false)
  metadata    Json?     // ticketId, etc.
  sentAt      DateTime?
  readAt      DateTime?
  createdAt   DateTime  @default(now())

  @@map("notifications")
}
```

---

## 5. Role & Permission Matrix

| Action | Super Admin | Support Admin | Support Agent | Customer Admin | Customer User |
|---|:---:|:---:|:---:|:---:|:---:|
| จัดการ Customer/System | ✅ | ✅ | ❌ | ❌ | ❌ |
| จัดการ User ทุกคน | ✅ | ✅ | ❌ | ❌ | ❌ |
| จัดการ User ของบริษัทตัวเอง | ✅ | ✅ | ❌ | ✅ | ❌ |
| จัดการ Contract/Category | ✅ | ✅ | ❌ | ❌ | ❌ |
| ดู Ticket ทั้งหมด | ✅ | ✅ | assigned only | ของบริษัทตัวเอง | ของตัวเอง |
| สร้าง Ticket | ✅ | ✅ | ✅ | ✅ | ✅ |
| เปลี่ยน Status | ✅ | ✅ | ✅ (บาง status) | จำกัด | จำกัด |
| Assign Ticket | ✅ | ✅ | ✅ | ❌ | ❌ |
| Internal Note | ✅ | ✅ | ✅ | ❌ | ❌ |
| Public Comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| ดู Dashboard/Report | ✅ | ✅ | limited | ของบริษัทตัวเอง | ❌ |

### Role-based Status Transitions

```typescript
// ลูกค้าเปลี่ยน status เองได้เฉพาะ
CUSTOMER_ALLOWED_TRANSITIONS = {
  RESOLVED: ['CLOSED', 'REOPENED'],      // confirm ปิด หรือ reopen
  WAITING_CUSTOMER: ['IN_PROGRESS'],     // ลูกค้าส่งข้อมูลเพิ่มเติมแล้ว
}

// Support/Admin เปลี่ยนได้ตาม ALLOWED_TRANSITIONS ทั้งหมด
```

---

## 6. Status Flow & Transition Rules

### Status Definitions

| Status | ความหมาย | ใครเปลี่ยนได้ |
|---|---|---|
| `OPEN` | ลูกค้าเพิ่งแจ้ง | ระบบ (auto) |
| `TRIAGED` | ทีม support ตรวจสอบเบื้องต้นแล้ว | Support |
| `IN_PROGRESS` | กำลังดำเนินการ | Support |
| `WAITING_CUSTOMER` | รอข้อมูลจากลูกค้า | Support |
| `WAITING_INTERNAL` | รอทีมภายใน / dev / vendor | Support |
| `RESOLVED` | ทีมแจ้งว่าแก้แล้ว รอลูกค้ายืนยัน | Support |
| `CLOSED` | ปิดงานแล้ว | Customer / Support |
| `REOPENED` | เปิดใหม่หลัง resolved/closed | Customer / Support |
| `CANCELLED` | ยกเลิก | Support / Customer Admin |

### Transition Matrix (ใช้เป็น Config ใน Backend)

```typescript
// src/common/constants/ticket-transitions.constant.ts

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:             ['TRIAGED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'CANCELLED'],
  TRIAGED:          ['IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'CANCELLED'],
  IN_PROGRESS:      ['WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED'],
  WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  WAITING_INTERNAL: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED:         ['CLOSED', 'REOPENED'],
  REOPENED:         ['IN_PROGRESS', 'WAITING_CUSTOMER'],
  CLOSED:           [],  // ไม่มี transition ตรง → ต้องสร้าง follow-up ticket
  CANCELLED:        [],
};

// Statuses ที่ทำให้ SLA Clock หยุดนับ
export const SLA_PAUSE_STATUSES: TicketStatus[] = [
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
];
```

### Status Transition Diagram

```
OPEN ──────→ TRIAGED ──────→ IN_PROGRESS ──────→ RESOLVED ──────→ CLOSED
  │              │                 ↑ ↓                ↓
  │              └─────────→ WAITING_CUSTOMER    REOPENED ──→ IN_PROGRESS
  │              └─────────→ WAITING_INTERNAL ──→ IN_PROGRESS
  └──────────────────────────────────────────────────────────→ CANCELLED
```

---

## 7. Business Rules

### เมื่อลูกค้าสร้าง Ticket

```
1. ตรวจสอบว่า user นี้ สังกัด customer นี้จริง
2. ตรวจสอบว่า system นี้ เป็นของ customer นี้จริง
3. ตรวจสอบว่า category นี้ ถูกผูกกับ system นี้จริง
4. ตรวจสอบว่า contract ที่ active อยู่ cover system นี้อยู่
5. Auto-generate ticketNumber (format: TKT-YYYY-XXXXX)
6. สร้าง AuditLog: TICKET_CREATED
7. Trigger notification → support team
```

### เมื่อ Agent เปลี่ยน Status

```
1. ตรวจสอบว่า transition นี้อนุญาตหรือไม่ (จาก ALLOWED_TRANSITIONS)
2. ตรวจสอบ Role ว่ามีสิทธิ์เปลี่ยน status นี้ไหม
3. ถ้า → RESOLVED: บันทึก resolvedAt
4. ถ้า → CLOSED: บันทึก closedAt
5. ถ้า → WAITING_CUSTOMER หรือ WAITING_INTERNAL: Pause SLA clock
6. ถ้า ← WAITING_*: Resume SLA clock
7. สร้าง AuditLog: STATUS_CHANGED (fromValue, toValue)
8. Trigger notification → customer / agent
```

### เมื่อเพิ่ม Comment

```
1. ถ้า role เป็น CUSTOMER_*: บังคับให้ type = PUBLIC (ห้าม INTERNAL)
2. ถ้า role เป็น SUPPORT_* หรือ ADMIN: เลือก PUBLIC หรือ INTERNAL ได้
3. สร้าง AuditLog: COMMENT_ADDED
4. ถ้า type = PUBLIC: Trigger notification → ฝั่งตรงข้าม
```

### เมื่อ List Tickets

```
CUSTOMER_USER:  WHERE createdById = currentUser.id AND customerId = currentUser.customerId
CUSTOMER_ADMIN: WHERE customerId = currentUser.customerId
SUPPORT_AGENT:  WHERE assigneeId = currentUser.id OR teamId = currentUser.teamId (ตาม policy)
SUPPORT_ADMIN:  ไม่มี restriction
SUPER_ADMIN:    ไม่มี restriction
```

### File Upload Policy

```
- Allowed types: pdf, jpg, jpeg, png, xlsx, docx
- Max size per file: 10 MB
- Max size per ticket: 30 MB
- Storage: S3/MinIO (ไม่ใช่ DB)
- URL: Presigned URL มีอายุ 1 ชั่วโมง (ไม่ใช่ public link ถาวร)
```

---

## 8. API Specification

### Auth APIs

```
POST   /api/auth/login              # Login → JWT + Refresh Token
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Revoke refresh token
GET    /api/auth/me                 # ข้อมูล current user
```

### Customer Portal APIs (ต้องการ Auth)

```
# Tickets
GET    /api/tickets                 # List tickets ของตัวเอง (paginated + filter)
POST   /api/tickets                 # สร้าง ticket ใหม่
GET    /api/tickets/:id             # ดู ticket detail
PATCH  /api/tickets/:id/status      # เปลี่ยน status (customer-allowed เท่านั้น)
POST   /api/tickets/:id/follow-up   # สร้าง follow-up จาก closed ticket
GET    /api/tickets/:id/timeline    # ดู history เรียงเวลา (status + comments รวมกัน)

# Comments
POST   /api/tickets/:id/comments    # เพิ่ม comment (PUBLIC เท่านั้น)
GET    /api/tickets/:id/comments    # ดู comments (เฉพาะ PUBLIC)

# Attachments
POST   /api/tickets/:id/attachments # Upload ไฟล์
GET    /api/attachments/:id/url     # Get presigned URL

# Reference Data
GET    /api/customer/systems        # ระบบของ customer ตัวเอง
GET    /api/customer/systems/:id/categories  # categories ของระบบนั้น
```

### Admin / Support APIs (ต้องการ Auth + Role)

```
# Tickets
GET    /api/admin/tickets           # List ทั้งหมด (filter, sort, paginate)
GET    /api/admin/tickets/:id       # ดู ticket detail (รวม internal notes)
PATCH  /api/admin/tickets/:id       # อัปเดต ticket (priority, scope, etc.)
PATCH  /api/admin/tickets/:id/status      # เปลี่ยน status
PATCH  /api/admin/tickets/:id/assign      # Assign to agent/team

# Comments
POST   /api/admin/tickets/:id/comments    # เพิ่ม comment (PUBLIC หรือ INTERNAL)
GET    /api/admin/tickets/:id/comments    # ดู comments (รวม INTERNAL)

# Master Data
GET    /api/admin/customers               # List customers
POST   /api/admin/customers               # สร้าง customer
GET    /api/admin/customers/:id           # ดู customer detail
PATCH  /api/admin/customers/:id           # แก้ไข customer
DELETE /api/admin/customers/:id           # Soft delete

GET    /api/admin/customers/:id/systems   # List systems ของ customer
POST   /api/admin/customers/:id/systems   # สร้าง system
PATCH  /api/admin/systems/:id             # แก้ไข system
DELETE /api/admin/systems/:id             # Soft delete

GET    /api/admin/contracts               # List contracts
POST   /api/admin/contracts               # สร้าง contract
PATCH  /api/admin/contracts/:id           # แก้ไข contract

GET    /api/admin/systems/:id/categories  # List categories
POST   /api/admin/systems/:id/categories  # สร้าง category
PATCH  /api/admin/categories/:id          # แก้ไข
DELETE /api/admin/categories/:id          # Soft delete

GET    /api/admin/users                   # List users
POST   /api/admin/users                   # สร้าง user
PATCH  /api/admin/users/:id               # แก้ไข
DELETE /api/admin/users/:id               # Soft delete

GET    /api/admin/teams                   # List teams
POST   /api/admin/teams                   # สร้าง team
PATCH  /api/admin/teams/:id               # แก้ไข

# Dashboard & Reports
GET    /api/admin/dashboard               # KPI summary
GET    /api/admin/customers/:id/dashboard # Dashboard ของ customer นั้น
GET    /api/reports/tickets               # Ticket report (filter by date, status, etc.)
GET    /api/reports/sla-breach            # Tickets ที่ SLA เกิน
GET    /api/reports/agent-performance     # Performance report ของ agent
```

---

## 9. Module Architecture (NestJS)

### Ticket Transition Service

```typescript
// tickets-transition.service.ts

@Injectable()
export class TicketsTransitionService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private slaService: SlaService,
    private notificationsService: NotificationsService,
  ) {}

  async changeStatus(
    ticketId: string,
    newStatus: TicketStatus,
    actorId: string,
    actorRole: UserRole,
  ) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });

    // 1. ตรวจสอบ transition
    const allowed = ALLOWED_TRANSITIONS[ticket.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${ticket.status} to ${newStatus}`,
      );
    }

    // 2. ตรวจสอบ Role permission
    if (actorRole.startsWith('CUSTOMER')) {
      const customerAllowed = CUSTOMER_ALLOWED_TRANSITIONS[ticket.status] ?? [];
      if (!customerAllowed.includes(newStatus)) {
        throw new ForbiddenException('Not allowed to change to this status');
      }
    }

    // 3. Prepare update data
    const updateData: Prisma.TicketUpdateInput = { status: newStatus };
    if (newStatus === 'RESOLVED') updateData.resolvedAt = new Date();
    if (newStatus === 'CLOSED') updateData.closedAt = new Date();

    // 4. Update ticket
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // 5. Handle SLA clock
    if (SLA_PAUSE_STATUSES.includes(newStatus)) {
      await this.slaService.pauseClock(ticketId);
    } else if (SLA_PAUSE_STATUSES.includes(ticket.status)) {
      await this.slaService.resumeClock(ticketId);
    }

    // 6. Audit log
    await this.auditLogsService.create({
      ticketId,
      actorId,
      action: 'STATUS_CHANGED',
      fromValue: ticket.status,
      toValue: newStatus,
    });

    // 7. Notification
    await this.notificationsService.emit('ticket.status_changed', {
      ticketId,
      fromStatus: ticket.status,
      toStatus: newStatus,
    });

    return updated;
  }
}
```

### Row-Level Security Guard

```typescript
// ticket-access.guard.ts

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

    // Super Admin / Support Admin: access ทุก ticket
    if (['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) return true;

    // Support Agent: access เฉพาะที่ assign ให้ตัวเอง หรือทีมตัวเอง
    if (user.role === 'SUPPORT_AGENT') {
      return ticket.assigneeId === user.id || ticket.teamId === user.teamId;
    }

    // Customer Admin: access ทุก ticket ของ customer ตัวเอง
    if (user.role === 'CUSTOMER_ADMIN') {
      return ticket.customerId === user.customerId;
    }

    // Customer User: access เฉพาะที่ตัวเองสร้าง
    if (user.role === 'CUSTOMER_USER') {
      return (
        ticket.customerId === user.customerId &&
        ticket.createdById === user.id
      );
    }

    return false;
  }
}
```

---

## 10. Frontend Architecture (Next.js)

### API Client (ตัวอย่าง)

```typescript
// src/lib/api/tickets.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getTickets(params?: TicketFilterParams) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/api/tickets?${query}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function createTicket(data: CreateTicketDto) {
  const res = await fetch(`${API_BASE}/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create ticket');
  return res.json();
}
```

### Ticket Status Badge Component

```typescript
// src/components/tickets/TicketStatusBadge.tsx

const STATUS_CONFIG = {
  OPEN:             { label: 'Open',             color: 'bg-blue-100 text-blue-800' },
  TRIAGED:          { label: 'Triaged',           color: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS:      { label: 'In Progress',       color: 'bg-yellow-100 text-yellow-800' },
  WAITING_CUSTOMER: { label: 'Waiting Customer',  color: 'bg-orange-100 text-orange-800' },
  WAITING_INTERNAL: { label: 'Waiting Internal',  color: 'bg-gray-100 text-gray-800' },
  RESOLVED:         { label: 'Resolved',          color: 'bg-green-100 text-green-800' },
  CLOSED:           { label: 'Closed',            color: 'bg-gray-200 text-gray-600' },
  REOPENED:         { label: 'Reopened',          color: 'bg-red-100 text-red-800' },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-red-200 text-red-600' },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
```

---

## 11. Security Requirements

### JWT Configuration

```typescript
// jwt: access token อายุสั้น, refresh token อายุยาว
ACCESS_TOKEN_EXPIRES  = '15m'
REFRESH_TOKEN_EXPIRES = '7d'

// Payload ที่ควรมีใน JWT
{
  sub: userId,
  email: user.email,
  role: user.role,
  customerId: user.customerId,  // null ถ้าเป็น support/admin
  teamId: user.teamId,          // null ถ้าเป็น customer
}
```

### Rate Limiting

```typescript
// ใช้ @nestjs/throttler

// Global defaults
TTL = 60 seconds, LIMIT = 100 requests

// Stricter limits per endpoint
POST /api/tickets         → 20 req/hour/user
POST /api/.../comments    → 60 req/hour/user
POST /api/auth/login      → 5 req/15min/IP
```

### Input Validation (ทุก DTO ต้องมี)

```typescript
// ตัวอย่าง CreateTicketDto
export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  systemId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;
}
```

---

## 12. SLA Design

### SLA Policy ต่อ Priority

| Priority | First Response | Resolution | หมายเหตุ |
|---|---|---|---|
| CRITICAL | 1 ชั่วโมง | 4 ชั่วโมง | 24/7 |
| HIGH | 4 ชั่วโมง | 8 ชั่วโมง | Business hours |
| MEDIUM | 1 วันทำการ | 3 วันทำการ | Business hours |
| LOW | 2 วันทำการ | 7 วันทำการ | Business hours |

> ค่าข้างต้นเป็นค่า default — แต่ละ Contract กำหนด SLA Policy เองได้

### SLA Clock Pause Logic

```
SLA หยุดนับเมื่อ status เป็น:
  - WAITING_CUSTOMER
  - WAITING_INTERNAL

SLA เดินต่อเมื่อ transition ออกจาก status ข้างต้น

การคำนวณ:
  effectiveElapsed = totalElapsed - totalPausedMinutes
  isBreached = effectiveElapsed > policyMinutes
```

---

## 13. Notification System

### Events ที่ต้อง Trigger

| Event | แจ้ง | Channel Phase 1 |
|---|---|---|
| `ticket.created` | Support Team | Email + In-App |
| `ticket.assigned` | Assignee | Email + In-App |
| `ticket.status_changed` | Customer + Assignee | Email + In-App |
| `comment.added` (PUBLIC) | ฝั่งตรงข้าม | Email + In-App |
| `sla.breached` | Support Admin | Email + In-App |

### Architecture (รองรับ Phase 2)

```typescript
// notifications.service.ts
// ใช้ Event pattern เพื่อให้ Phase 2 เพิ่ม LINE channel ได้โดยไม่แตะ core

async emit(event: string, payload: any) {
  const preferences = await this.getPreferencesByEvent(event, payload);
  
  for (const pref of preferences) {
    switch (pref.channel) {
      case 'EMAIL':   await this.emailChannel.send(pref, payload);   break;
      case 'IN_APP':  await this.inAppChannel.send(pref, payload);   break;
      case 'LINE':    await this.lineChannel.send(pref, payload);    break; // Phase 2
    }
  }
}
```

---

## 14. Phase 2 Preparation

สิ่งที่ต้องเตรียมไว้ใน Phase 1 เพื่อให้ Phase 2 ง่ายขึ้น:

| รายการ | สิ่งที่ทำใน Phase 1 |
|---|---|
| LINE OA Integration | สร้าง `NotificationChannel.LINE` enum และ `line.channel.ts` stub ไว้ |
| LINE User Linking | เพิ่ม field `lineUserId` ใน User model (nullable) |
| Queue System | ติดตั้ง BullMQ เตรียมไว้ แม้ยังไม่ใช้ |
| Webhook Receiver | สร้าง `/api/webhooks/line` endpoint รับ LINE events |
| Mobile-ready API | ทุก API ออกแบบให้ Stateless และ token-based อยู่แล้ว |

---

## 🧪 Test Accounts & Login URLs

> ข้อมูลด้านล่างมาจาก `backend/prisma/seed.ts` — รัน `npm run prisma:seed` ใน backend ก่อนทดสอบ

### Login URL

| ฝั่ง | URL |
|---|---|
| Admin / Support Console | `http://localhost:3000/login` → redirect ไปที่ `/admin/dashboard` |
| Customer Portal | `http://localhost:3000/login` → redirect ไปที่ `/dashboard` |

> ใช้หน้า login เดียวกัน ระบบ redirect อัตโนมัติตาม role หลัง login สำเร็จ

---

### Admin & Support Accounts → เข้าหน้า `/admin/*`

| Role | Email | Password | สิทธิ์ |
|---|---|---|---|
| SUPER_ADMIN | `admin@ticketma.com` | `Admin@1234` | เข้าถึงทุกหน้า ทุกข้อมูล |
| SUPPORT_ADMIN | `support.admin@ticketma.com` | `Support@1234` | จัดการ Ticket + Master Data |
| SUPPORT_AGENT | `agent@ticketma.com` | `Agent@1234` | จัดการ Ticket ที่ assign ให้ตัวเอง/ทีม |

### Customer Accounts → เข้าหน้า `/dashboard`, `/tickets/*`, `/profile`

| Role | Email | Password | บริษัท | สิทธิ์ |
|---|---|---|---|---|
| CUSTOMER_ADMIN | `cust.admin@demo.co.th` | `Cust@1234` | Demo Company Co., Ltd. | ดู Ticket ทั้งหมดของบริษัท |
| CUSTOMER_USER | `user@demo.co.th` | `User@1234` | Demo Company Co., Ltd. | ดู/สร้าง Ticket ของตัวเองเท่านั้น |

### Demo Seed Data ที่มีในระบบ

| รายการ | ข้อมูล |
|---|---|
| Customer | Demo Company Co., Ltd. (code: `DEMO001`) |
| System | Demo Web Application (code: `WEB001`) |
| Categories | Bug / ข้อผิดพลาด, Feature Request, General Support |
| Contract | MA-2026-DEMO001 (01 ม.ค. – 31 ธ.ค. 2026) |
| Team | Support Team A (มี agent@ticketma.com เป็นสมาชิก) |
| SLA (LOW) | First Response 8h / Resolution 48h |
| SLA (MEDIUM) | First Response 4h / Resolution 24h |
| SLA (HIGH) | First Response 1h / Resolution 8h |
| SLA (CRITICAL) | First Response 30m / Resolution 4h |

---

## 📌 Development Priority (Phase 1)

### Sprint 1 — Foundation ✅ เสร็จแล้ว
- [x] Project setup (NestJS + Next.js + Prisma) — สร้าง project structure ครบทั้ง backend/frontend
- [x] Database schema + migrations — `prisma/schema.prisma` ครบทุก model พร้อม comment ภาษาไทย
- [x] Auth module (Login + JWT + Refresh Token) — JWT Strategy, Token Rotation, `/api/auth/*`
- [x] User management API — CRUD + Soft delete + Role-based filter, `/api/admin/users`

**Config files ที่สร้าง:** `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`
**Common layer:** Guards (JWT/Roles/TicketAccess), Decorators, Filters, Constants

---

### Sprint 2 — Master Data ✅ เสร็จแล้ว
- [x] Customer API — CRUD + Soft delete + unique code, `/api/admin/customers`
- [x] System API (CustomerSystem) — CRUD + unique code per customer, `/api/admin/systems`
- [x] Contract API — CRUD + date validation + unique contractNumber, `/api/admin/contracts`
- [x] Category API — CRUD + tree structure (parentId) + unique name per level, `/api/admin/categories`
- [x] Team API — CRUD + member list, `/api/admin/teams`
- [x] Swagger คำอธิบายภาษาไทยทุก endpoint (Auth, Users, Customers, Systems, Contracts, Categories, Teams)

---

### Sprint 3 — Core Ticketing ✅ เสร็จแล้ว (Backend)
- [x] AuditLogs service — บันทึกทุก action บน Ticket (TICKET_CREATED, STATUS_CHANGED, ASSIGNEE_CHANGED, ...)
- [x] SLA service — initializeSla, pauseClock, resumeClock, recordFirstResponse, recordResolution
- [x] Notifications service — In-app notification + emit event pattern (Phase 2: Email/LINE)
- [x] Ticket API (Customer Portal) — CRUD + Follow-up + Timeline, `/api/tickets/*`
- [x] Ticket API (Admin) — List/Update/Status/Assign, `/api/admin/tickets/*`
- [x] Ticket number generation — format: `TKT-YYYY-XXXXX`
- [x] Status transition engine — ตรวจสอบ transition matrix + role-based restriction
- [x] Comment API — PUBLIC/INTERNAL + enforce PUBLIC for customer, `/api/tickets/:id/comments` + `/api/admin/tickets/:id/comments`
- [x] First response tracking — บันทึก `firstResponseAt` เมื่อ support ตอบ PUBLIC comment ครั้งแรก
- [x] Attachment API — upload + presigned URL (Phase 1: local, Phase 2: S3/MinIO), `/api/tickets/:id/attachments`
- [x] Customer Portal ref data — `/api/customer/systems`, `/api/customer/systems/:id/categories`
- [x] Dashboard API — KPI summary, SLA breach count, `/api/admin/dashboard`
- [x] Reports API — Ticket report + SLA breach report, `/api/reports/*`

**หมายเหตุ:** Storage service Phase 1 บันทึกไฟล์ใน `./uploads/` (local) — Phase 2 เปลี่ยนเป็น S3/MinIO

---

### Sprint 4 — Frontend Theme + UI Components ✅ เสร็จแล้ว
- [x] Tailwind config — primary `#154c79`, secondary `#1e81b0`, Prompt font variable, custom animations/shadows
- [x] postcss.config.js + next.config.js
- [x] tsconfig.json — `@/*` path alias เพิ่ม
- [x] package.json — เพิ่ม clsx + tailwind-merge
- [x] `src/app/globals.css` — Tailwind directives + custom scrollbar
- [x] `src/app/layout.tsx` — Prompt font (next/font/google) + ToastProvider
- [x] `src/lib/utils/cn.ts` — cn() utility
- [x] UI Components ใน `src/components/ui/`:
  - Button (variant: primary/secondary/outline/ghost/danger, size: sm/md/lg, loading state, icons)
  - Input (label, error, hint, leftIcon, rightIcon)
  - Textarea (label, error, hint)
  - Checkbox (custom visual, accessible native input, description)
  - Select (options array, placeholder, label, error)
  - Toggle/Switch (sm/md size)
  - Card + CardHeader + CardTitle + CardBody + CardFooter
  - Table + TableHead + TableBody + TableRow + TableTh + TableTd (sortable support)
  - Badge (7 variants: default/primary/secondary/success/warning/danger/info, dot option)
  - Tag (closeable, 3 variants)
  - Pagination (smart ellipsis, showTotal)
  - Modal (5 sizes, ESC key, backdrop click)
  - Toast + ToastProvider + useToast hook (4 variants, auto-dismiss)
  - Spinner + SpinnerPage
  - Avatar (initials with color hash from name, image support)
  - Tooltip (4 positions)
  - Divider (horizontal/vertical/with label)
  - EmptyState (icon, title, description, action)
  - `index.ts` barrel export
- [x] Admin routes restructured → nested under `/admin/*` (fixed Next.js route group conflict)

### Sprint 5 — Auth + Admin Console UI ✅ เสร็จแล้ว
- [x] `lib/api/client.ts` — centralized `apiFetch` with auto token-refresh + redirect on 401
- [x] `lib/context/AuthContext.tsx` — AuthProvider + `useAuthContext()` hook (login/logout/user state)
- [x] `lib/hooks/useApi.ts` — reusable data-fetching hook (loading/error/reload)
- [x] `types/master.types.ts` — Customer, CustomerSystem, Contract, Category, Team, UserListItem, DashboardKpi
- [x] API clients: `customers`, `systems`, `contracts`, `categories`, `teams`, `users`, `admin-tickets`, `reports`
- [x] Login page — split-card design, validation, show/hide password, role-based redirect
- [x] `(auth)/layout.tsx` — redirect to admin/customer dashboard if already logged in
- [x] `(admin)/layout.tsx` — auth guard, role check (ADMIN_ROLES only), Admin Sidebar
- [x] `AdminSidebar` — fixed left sidebar, active highlight, grouped nav (Dashboard, Tickets, Master Data, ทีมงาน, รายงาน)
- [x] `AdminHeader` — page title, user avatar dropdown, logout
- [x] `/admin/dashboard` — KPI cards (6 metrics)
- [x] `/admin/customers` — list + search + create/edit modal + delete confirm + link to detail
- [x] `/admin/customers/[id]` — customer detail + systems list (inline CRUD)
- [x] `/admin/systems` — list + search + create/edit modal (เลือกลูกค้า, toggle active)
- [x] `/admin/contracts` — list + create/edit modal (SLA matrix per priority)
- [x] `/admin/categories` — list + parent/child hierarchy support
- [x] `/admin/teams` — list + create/edit modal
- [x] `/admin/users` — list + create/edit modal + reset password + role-based field rendering (customer/team)
- [x] `/admin/tickets` — list + filter (status/priority/search) + pagination
- [x] `/admin/tickets/[id]` — detail + timeline + add comment (public/internal toggle) + change status + assign agent + SLA status
- [x] `/admin/reports` — placeholder (Charts coming in Sprint 7)

### Sprint 6 — Customer Portal UI ✅ เสร็จแล้ว
- [x] `(customer)/layout.tsx` — auth guard (CUSTOMER_ADMIN / CUSTOMER_USER), redirect non-customer roles to admin
- [x] `CustomerHeader` — fixed top navbar: logo + nav links (Dashboard / Tickets ของฉัน) + Bell icon + user dropdown (profile / logout) + mobile hamburger menu
- [x] `lib/api/customer-portal.ts` — API client: getSystems, getCategories, getTickets, getTicket, createTicket, createFollowUp, getTimeline, transition, addComment, getMe, updateProfile, changePassword
- [x] `/dashboard` — greeting + 3 stat cards (open / waiting-for-customer / resolved) + recent 5 tickets list
- [x] `/tickets` — ticket list + search + status/priority filter + pagination (10 per page)
- [x] `/tickets/new` — create ticket form: เลือก System → categories load ตาม system + Priority selector + title + description + validation
- [x] `/tickets/[id]` — ticket detail: header (ticketNumber / status / priority) + description card + timeline (status changes + public comments merged) + add comment form + customer action buttons (confirm close / reopen) + details sidebar (system / category / assignee / priority / resolvedAt)
- [x] `/profile` — edit profile (ชื่อ / นามสกุล / เบอร์โทร) + change password (current + new + confirm validation)

**Actual files:**
- `src/app/(customer)/layout.tsx`
- `src/components/layout/CustomerHeader.tsx`
- `src/lib/api/customer-portal.ts`
- `src/app/(customer)/dashboard/page.tsx`
- `src/app/(customer)/tickets/page.tsx`
- `src/app/(customer)/tickets/new/page.tsx`
- `src/app/(customer)/tickets/[id]/page.tsx`
- `src/app/(customer)/profile/page.tsx`

### File Attachment System ✅ เสร็จแล้ว (เพิ่มเติมหลัง Sprint 6)

#### Storage Path Structure
```
backend/uploads/
└── {CUSTOMER_CODE}/        e.g., DEMO001
    └── {YEAR}/             e.g., 2026
        └── {MONTH}/        e.g., 04
            └── {TKT_NUM}/  e.g., TKT-2026-00001
                ├── abc123ef.webp   ← รูปภาพ (แปลงเป็น WebP อัตโนมัติ)
                └── def456ab.pdf    ← ไฟล์อื่นๆ คง extension เดิม
```

#### ฝั่ง Backend
- [x] `sharp` — convert รูปภาพ (jpg/png/gif/webp) เป็น WebP คุณภาพ 82% ก่อนบันทึก
- [x] `StorageService` — path-based storage: `{customerCode}/{year}/{month}/{ticketNumber}/{uid}.{ext}`
- [x] Validation: ไฟล์ละไม่เกิน 10 MB, รวมไม่เกิน 30 MB, รองรับ jpg/png/gif/webp/pdf/xlsx/docx/txt
- [x] Multi-file upload ด้วย `FilesInterceptor` (สูงสุด 10 ไฟล์ต่อครั้ง)
- [x] `findByTicket` — ส่ง URL กลับมาพร้อมกันเลย (ไม่ต้อง call แยก)
- [x] Static file serving ที่ `/api/files/{path}` ผ่าน `NestExpressApplication.useStaticAssets`
- [x] Soft delete + ลบไฟล์จาก disk พร้อมกัน

#### ฝั่ง Frontend
- [x] `FileUploader` component (`src/components/tickets/FileUploader.tsx`):
  - Drag & drop zone + click to browse
  - Preview รูปภาพก่อน upload (ObjectURL)
  - Status per file: pending → uploading → done / error
  - แสดง existing attachments พร้อมปุ่มดาวน์โหลด
  - ปุ่มลบ per file (ทั้ง pending และ existing)
  - รองรับ 2 modes: auto-upload (ticketId มี) และ collect mode (ticketId ยังไม่มี)
- [x] `apiUpload()` ใน `client.ts` — multipart upload พร้อม auto token-refresh
- [x] `customer-portal.ts` — เพิ่ม `uploadAttachments`, `getAttachments`, `deleteAttachment`
- [x] `/tickets/new` — เลือกไฟล์ก่อน ส่งหลัง ticket ถูกสร้างแล้ว
- [x] `/tickets/[id]` — แสดง existing + upload เพิ่ม + ลบได้ (auto-upload ทันที)

### Sprint 7 — SLA + Notification + Dashboard Charts ✅ เสร็จแล้ว
- [x] SLA countdown timer display — `SlaCountdown` component แสดงเวลาที่เหลือ (live countdown ทุก 30s), รองรับ paused/breached/completed
- [x] In-app notification bell (unread count + dropdown) — ครบทั้ง AdminHeader + CustomerHeader
- [x] Dashboard charts (Recharts) — Line chart รายวัน 30 วัน, Bar chart by priority, Bar chart by status
- [x] Reports: export CSV — หน้า `/admin/reports` พร้อม filter + ตาราง + Export CSV (download with auth)

---

*Document prepared for Claude Code / Cursor AI-assisted development*
*Last updated: 2026-04-22 — เพิ่ม File Attachment System: WebP conversion, path-based storage, multi-file upload, drag & drop preview*
