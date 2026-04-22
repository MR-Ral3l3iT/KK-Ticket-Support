import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ─── Super Admin ───────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ticketma.com' },
    update: {},
    create: {
      email: 'admin@ticketma.com',
      password: await hash('Admin@1234'),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // ─── Support Admin ─────────────────────────────────────────
  const supportAdmin = await prisma.user.upsert({
    where: { email: 'support.admin@ticketma.com' },
    update: {},
    create: {
      email: 'support.admin@ticketma.com',
      password: await hash('Support@1234'),
      firstName: 'Support',
      lastName: 'Admin',
      role: 'SUPPORT_ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Support Admin: ${supportAdmin.email}`);

  // ─── Support Agent ─────────────────────────────────────────
  const agent = await prisma.user.upsert({
    where: { email: 'agent@ticketma.com' },
    update: {},
    create: {
      email: 'agent@ticketma.com',
      password: await hash('Agent@1234'),
      firstName: 'Agent',
      lastName: 'Support',
      role: 'SUPPORT_AGENT',
      isActive: true,
    },
  });
  console.log(`✅ Support Agent: ${agent.email}`);

  // ─── Demo Customer ─────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      name: 'Demo Company Co., Ltd.',
      code: 'DEMO001',
      email: 'contact@demo.co.th',
      phone: '02-000-0000',
      isActive: true,
    },
  });
  console.log(`✅ Customer: ${customer.name}`);

  // ─── Demo Customer Admin User ──────────────────────────────
  const custAdmin = await prisma.user.upsert({
    where: { email: 'cust.admin@demo.co.th' },
    update: {},
    create: {
      email: 'cust.admin@demo.co.th',
      password: await hash('Cust@1234'),
      firstName: 'Customer',
      lastName: 'Admin',
      role: 'CUSTOMER_ADMIN',
      isActive: true,
      customerId: customer.id,
    },
  });
  console.log(`✅ Customer Admin: ${custAdmin.email}`);

  // ─── Demo Customer User ────────────────────────────────────
  const custUser = await prisma.user.upsert({
    where: { email: 'user@demo.co.th' },
    update: {},
    create: {
      email: 'user@demo.co.th',
      password: await hash('User@1234'),
      firstName: 'Demo',
      lastName: 'User',
      role: 'CUSTOMER_USER',
      isActive: true,
      customerId: customer.id,
    },
  });
  console.log(`✅ Customer User: ${custUser.email}`);

  // ─── Demo System ───────────────────────────────────────────
  const system = await prisma.customerSystem.upsert({
    where: { customerId_code: { customerId: customer.id, code: 'WEB001' } },
    update: {},
    create: {
      name: 'Demo Web Application',
      code: 'WEB001',
      description: 'ระบบ Web Application หลักของ Demo Company',
      customerId: customer.id,
      isActive: true,
    },
  });
  console.log(`✅ System: ${system.name}`);

  // ─── Demo Categories ───────────────────────────────────────
  const catBug = await prisma.category.upsert({
    where: { id: 'cat-bug-demo' },
    update: {},
    create: {
      id: 'cat-bug-demo',
      name: 'Bug / ข้อผิดพลาด',
      systemId: system.id,
    },
  });

  const catFeature = await prisma.category.upsert({
    where: { id: 'cat-feature-demo' },
    update: {},
    create: {
      id: 'cat-feature-demo',
      name: 'Feature Request',
      systemId: system.id,
    },
  });

  const catSupport = await prisma.category.upsert({
    where: { id: 'cat-support-demo' },
    update: {},
    create: {
      id: 'cat-support-demo',
      name: 'General Support',
      systemId: system.id,
    },
  });
  console.log(`✅ Categories: ${catBug.name}, ${catFeature.name}, ${catSupport.name}`);

  // ─── Demo Contract ─────────────────────────────────────────
  const contract = await prisma.contract.upsert({
    where: { contractNumber: 'MA-2026-DEMO001' },
    update: {},
    create: {
      contractNumber: 'MA-2026-DEMO001',
      name: 'MA Contract 2026 - Demo Company',
      customerId: customer.id,
      systemId: system.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`✅ Contract: ${contract.name}`);

  // ─── SLA Policies ──────────────────────────────────────────
  const slaPolicies = [
    { priority: 'LOW',      firstResponseMinutes: 480,  resolutionMinutes: 2880 },
    { priority: 'MEDIUM',   firstResponseMinutes: 240,  resolutionMinutes: 1440 },
    { priority: 'HIGH',     firstResponseMinutes: 60,   resolutionMinutes: 480  },
    { priority: 'CRITICAL', firstResponseMinutes: 30,   resolutionMinutes: 240  },
  ] as const;

  for (const policy of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { contractId_priority: { contractId: contract.id, priority: policy.priority } },
      update: {},
      create: {
        contractId: contract.id,
        priority: policy.priority,
        firstResponseMinutes: policy.firstResponseMinutes,
        resolutionMinutes: policy.resolutionMinutes,
        businessHoursOnly: false,
      },
    });
  }
  console.log(`✅ SLA Policies: 4 priorities`);

  // ─── Demo Team ─────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { id: 'team-support-001' },
    update: {},
    create: {
      id: 'team-support-001',
      name: 'Support Team A',
      description: 'ทีม Support หลัก',
    },
  });
  console.log(`✅ Team: ${team.name}`);

  // Assign agent to team
  await prisma.user.update({
    where: { id: agent.id },
    data: { teamId: team.id },
  });

  console.log('\n🎉 Seed completed!\n');
  console.log('─────────────────────────────────────────');
  console.log('  ADMIN ACCOUNTS');
  console.log('─────────────────────────────────────────');
  console.log('  Super Admin    : admin@ticketma.com       / Admin@1234');
  console.log('  Support Admin  : support.admin@ticketma.com / Support@1234');
  console.log('  Support Agent  : agent@ticketma.com       / Agent@1234');
  console.log('─────────────────────────────────────────');
  console.log('  CUSTOMER ACCOUNTS (Demo Company)');
  console.log('─────────────────────────────────────────');
  console.log('  Customer Admin : cust.admin@demo.co.th   / Cust@1234');
  console.log('  Customer User  : user@demo.co.th         / User@1234');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
