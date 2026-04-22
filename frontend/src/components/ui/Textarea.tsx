'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = true, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-0.5 text-danger-600">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 resize-y',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-gray-300 hover:border-gray-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
