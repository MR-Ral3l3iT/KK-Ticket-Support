'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-0.5 text-danger-600">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-gray-300 hover:border-gray-400',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
