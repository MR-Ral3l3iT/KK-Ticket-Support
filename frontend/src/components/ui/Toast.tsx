'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success-500" />,
  error: <AlertCircle className="h-5 w-5 text-danger-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
  info: <Info className="h-5 w-5 text-info-500" />,
};

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-success-200 bg-success-50',
  error: 'border-danger-200 bg-danger-50',
  warning: 'border-warning-200 bg-warning-50',
  info: 'border-info-200 bg-info-50',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const duration = toast.duration ?? 4000;

      setToasts((prev) => [...prev, { ...toast, id }]);

      if (duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');

  return {
    toast: {
      success: (title: string, message?: string) =>
        ctx.addToast({ variant: 'success', title, message }),
      error: (title: string, message?: string) =>
        ctx.addToast({ variant: 'error', title, message }),
      warning: (title: string, message?: string) =>
        ctx.addToast({ variant: 'warning', title, message }),
      info: (title: string, message?: string) =>
        ctx.addToast({ variant: 'info', title, message }),
    },
    dismiss: ctx.removeToast,
  };
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-card-md pointer-events-auto',
        'animate-slide-up',
        variantClasses[toast.variant],
      )}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icons[toast.variant]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm text-gray-600">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
        aria-label="ปิด"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
