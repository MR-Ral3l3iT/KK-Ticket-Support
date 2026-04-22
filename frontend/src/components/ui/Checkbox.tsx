'use client';

import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, checked, disabled, ...props }, ref) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={checkboxId}
          className={cn('flex items-start gap-3 cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}
        >
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="sr-only"
              {...props}
            />
            <div
              className={cn(
                'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                checked
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300 hover:border-primary-400',
                error && !checked && 'border-danger-500',
              )}
            >
              {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
          </div>
          {(label || description) && (
            <div>
              {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
          )}
        </label>
        {error && <p className="text-xs text-danger-600 ml-7">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
