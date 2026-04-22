import { cn } from '@/lib/utils/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={cn('self-stretch w-px bg-gray-200', className)} />;
  }

  if (label) {
    return (
      <div className={cn('relative flex items-center gap-3', className)}>
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{label}</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>
    );
  }

  return <hr className={cn('border-t border-gray-200', className)} />;
}
