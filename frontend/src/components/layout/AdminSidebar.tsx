'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Server,
  FileText,
  Tag,
  Users,
  UsersRound,
  BarChart3,
  ChevronDown,
  Ticket as TicketIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Tickets', href: '/admin/tickets', icon: <Ticket className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'ลูกค้า', href: '/admin/customers', icon: <Building2 className="h-4 w-4" /> },
      { label: 'ระบบ', href: '/admin/systems', icon: <Server className="h-4 w-4" /> },
      { label: 'สัญญา', href: '/admin/contracts', icon: <FileText className="h-4 w-4" /> },
      { label: 'หมวดหมู่', href: '/admin/categories', icon: <Tag className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ทีมงาน',
    items: [
      { label: 'ทีม', href: '/admin/teams', icon: <UsersRound className="h-4 w-4" /> },
      { label: 'ผู้ใช้งาน', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: 'รายงาน',
    items: [
      { label: 'รายงาน', href: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-primary-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500">
          <TicketIcon className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Ticket MA</p>
          <p className="text-[10px] text-primary-300">Support Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && 'mt-5')}>
            {group.title && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-primary-400">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-secondary-500 text-white'
                        : 'text-primary-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
