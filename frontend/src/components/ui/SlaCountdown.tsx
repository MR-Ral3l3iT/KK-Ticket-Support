'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Pause } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SlaCountdownProps {
  label: string;
  dueAt: string | null | undefined;
  completedAt?: string | null;
  isBreached: boolean;
  isPaused?: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'เกินกำหนด';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}ว ${remHours}ชม`;
  }
  if (hours > 0) return `${hours}ชม ${minutes}น`;
  return `${minutes} นาที`;
}

export function SlaCountdown({ label, dueAt, completedAt, isBreached, isPaused }: SlaCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!dueAt || completedAt) return;
    const tick = () => setRemaining(new Date(dueAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [dueAt, completedAt]);

  const isOverdue = isBreached || (remaining !== null && remaining <= 0);
  const isWarning = remaining !== null && remaining > 0 && remaining < 60 * 60 * 1000;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <div className={cn(
        'flex items-center gap-1.5 text-sm font-medium rounded-lg px-2.5 py-1',
        completedAt && 'bg-green-50 text-green-700',
        !completedAt && isOverdue && 'bg-red-50 text-red-700',
        !completedAt && !isOverdue && isWarning && 'bg-amber-50 text-amber-700',
        !completedAt && !isOverdue && !isWarning && isPaused && 'bg-gray-100 text-gray-600',
        !completedAt && !isOverdue && !isWarning && !isPaused && 'bg-blue-50 text-blue-700',
      )}>
        {completedAt ? (
          <><CheckCircle2 className="h-3.5 w-3.5" /><span>เสร็จแล้ว</span></>
        ) : isOverdue ? (
          <><AlertTriangle className="h-3.5 w-3.5" /><span>เกินกำหนด</span></>
        ) : isPaused ? (
          <><Pause className="h-3.5 w-3.5" /><span>หยุดชั่วคราว</span></>
        ) : remaining !== null ? (
          <><Clock className="h-3.5 w-3.5" /><span>{formatRemaining(remaining)}</span></>
        ) : dueAt ? (
          <><Clock className="h-3.5 w-3.5" /><span>{new Date(dueAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span></>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}
