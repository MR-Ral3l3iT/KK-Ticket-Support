'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Bell, BellRing, ChevronDown, LogOut, MessageSquare, TicketPlus } from 'lucide-react';
import { useAuthContext } from '@/lib/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import { useApi } from '@/lib/hooks/useApi';
import { notificationsApi } from '@/lib/api/notifications';

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SUPPORT_ADMIN: 'Support Admin',
  SUPPORT_AGENT: 'Support Agent',
};

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
      label: 'Comment',
    };
  }
  if (event === 'ticket.status_changed') {
    return {
      icon: <ArrowRightLeft className="h-4 w-4 text-amber-600" />,
      chip: 'bg-amber-50 text-amber-700',
      label: 'Status',
    };
  }
  return {
    icon: <BellRing className="h-4 w-4 text-gray-500" />,
    chip: 'bg-gray-100 text-gray-700',
    label: 'แจ้งเตือน',
  };
}

export function AdminHeader({ title }: { title?: string }) {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: unreadData, reload: reloadNotifications } = useApi(() => notificationsApi.unread(), []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';
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
    if (ticketId) router.push(`/admin/tickets/${ticketId}`);
  }

  return (
    <header className="fixed top-0 left-60 right-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                        <p className="text-xl font-semibold text-gray-900 leading-tight line-clamp-1">{n.body}</p>
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

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <Avatar name={fullName} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{fullName}</p>
              <p className="text-xs text-gray-500 leading-tight">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl bg-white border border-gray-200 shadow-card-md py-1 animate-slide-down">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
