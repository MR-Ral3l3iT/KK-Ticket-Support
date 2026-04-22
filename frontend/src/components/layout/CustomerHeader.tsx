'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRightLeft, Bell, BellRing, ChevronDown, LayoutDashboard, LogOut, Menu, MessageSquare, Ticket, TicketPlus, User, Users, X,
} from 'lucide-react';
import { useAuthContext } from '@/lib/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import { useApi } from '@/lib/hooks/useApi';
import { notificationsApi } from '@/lib/api/notifications';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/tickets', label: 'Tickets ของฉัน', icon: <Ticket className="h-4 w-4" /> },
];

const STATUS_LABEL_TH: Record<string, string> = {
  OPEN: 'เปิด',
  TRIAGED: 'ตรวจสอบแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  WAITING_CUSTOMER: 'รอข้อมูลจากคุณ',
  WAITING_INTERNAL: 'รอภายใน',
  RESOLVED: 'แก้ไขแล้ว',
  CLOSED: 'ปิดแล้ว',
  REOPENED: 'เปิดใหม่',
  CANCELLED: 'ยกเลิก',
};

function toStatusLabel(v?: string) {
  if (!v) return '-';
  return STATUS_LABEL_TH[v] ?? v;
}

function getNotificationHeadline(n: { event?: string; body: string }) {
  if (n.event !== 'ticket.status_changed') return n.body;
  const parts = n.body.split('→').map((x) => x.trim());
  if (parts.length !== 2) return n.body;
  return `เปลี่ยนสถานะจาก ${toStatusLabel(parts[0])} เป็น ${toStatusLabel(parts[1])}`;
}

function notificationMeta(event?: string) {
  if (event === 'ticket.created') {
    return {
      icon: <TicketPlus className="h-4 w-4 text-blue-600" />,
      chip: 'bg-blue-50 text-blue-700',
      label: 'Ticket ใหม่',
    };
  }
  if (event === 'comment.added') {
    return {
      icon: <MessageSquare className="h-4 w-4 text-violet-600" />,
      chip: 'bg-violet-50 text-violet-700',
      label: 'ความคิดเห็นใหม่',
    };
  }
  if (event === 'ticket.status_changed') {
    return {
      icon: <ArrowRightLeft className="h-4 w-4 text-amber-600" />,
      chip: 'bg-amber-50 text-amber-700',
      label: 'อัปเดตสถานะ',
    };
  }
  return {
    icon: <BellRing className="h-4 w-4 text-gray-500" />,
    chip: 'bg-gray-100 text-gray-700',
    label: 'แจ้งเตือน',
  };
}

export function CustomerHeader() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: unreadData, reload: reloadNotifications } = useApi(() => notificationsApi.unread(), []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';
  const isCustomerAdmin = user?.role === 'CUSTOMER_ADMIN';
  const navItemsWithUserManagement = isCustomerAdmin
    ? [...navItems, { href: '/users', label: 'ผู้ใช้งาน', icon: <Users className="h-4 w-4" /> }]
    : navItems;
  const unreadCount = unreadData?.total ?? 0;
  const notifications = unreadData?.data ?? [];

  useEffect(() => {
    const timer = setInterval(() => { reloadNotifications(); }, 15000);
    return () => clearInterval(timer);
  }, [reloadNotifications]);

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    reloadNotifications();
  }

  function handleOpenNotification(id: string, ticketId?: string) {
    setNotifOpen(false);
    notificationsApi.markRead(id).catch(() => {});
    reloadNotifications();
    if (ticketId) router.push(`/tickets/${ticketId}`);
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">Ticket Support MA</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItemsWithUserManagement.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary-50 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-600 text-white text-[11px] font-semibold leading-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-96 max-w-[90vw] rounded-xl bg-white border border-gray-200 shadow-card-md overflow-hidden animate-slide-down">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">การแจ้งเตือน</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-primary bg-primary-50 hover:bg-primary-100 rounded-md px-2 py-1 transition-colors">
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  {!notifications.length ? (
                    <p className="px-4 py-6 text-sm text-gray-400 text-center">ไม่มีการแจ้งเตือนใหม่</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleOpenNotification(n.id, n.metadata?.ticketId)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {notificationMeta(n.event).icon}
                            <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', notificationMeta(n.event).chip)}>
                              {notificationMeta(n.event).label}
                            </span>
                          </div>
                          {(n.metadata?.customerName || n.metadata?.systemName) && (
                            <p className="text-xs text-gray-500 mb-1">
                              {[n.metadata?.systemName, n.metadata?.customerName].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          <p className="text-xl font-semibold text-gray-900 leading-tight line-clamp-1">
                            {getNotificationHeadline(n)}
                          </p>
                          {n.metadata?.ticketNumber && (
                            <p className="text-sm text-gray-500 mt-1 font-medium">{n.metadata.ticketNumber}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('th-TH')}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <Avatar name={fullName} size="sm" />
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.firstName}</span>
              <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', menuOpen && 'rotate-180')} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl bg-white border border-gray-200 shadow-card-md py-1 animate-slide-down">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="h-4 w-4" /> โปรไฟล์
                  </Link>
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                    <LogOut className="h-4 w-4" /> ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-gray-200 shadow-card py-2 px-4">
          {navItemsWithUserManagement.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href) ? 'bg-primary-50 text-primary' : 'text-gray-600 hover:bg-gray-50')}>
              {item.icon}{item.label}
            </Link>
          ))}
          <hr className="my-2 border-gray-100" />
          <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <User className="h-4 w-4" /> โปรไฟล์
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-danger-600 hover:bg-danger-50 rounded-lg">
            <LogOut className="h-4 w-4" /> ออกจากระบบ
          </button>
        </div>
      )}
    </header>
  );
}
