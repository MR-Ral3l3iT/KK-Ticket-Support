'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-primary-50 text-primary-800 border-primary-200',
  secondary: 'bg-secondary-50 text-secondary-800 border-secondary-200',
};

export function Tag({ onRemove, variant = 'default', className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded hover:opacity-70 transition-opacity focus:outline-none"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
