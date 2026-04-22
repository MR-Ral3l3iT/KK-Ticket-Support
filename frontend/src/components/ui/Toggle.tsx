'use client';

import { cn } from '@/lib/utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}

const sizeConfig = {
  sm: { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-4.5 w-4.5', translate: 'translate-x-5' },
};

export function Toggle({ checked, onChange, label, description, disabled, size = 'md', id }: ToggleProps) {
  const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const { track, thumb, translate } = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-3', disabled && 'opacity-50')}>
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          track,
          checked ? 'bg-primary' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transition-transform duration-200 m-[3px]',
            'h-[calc(100%-6px)] aspect-square',
            checked ? translate : 'translate-x-0',
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={toggleId} className={cn('cursor-pointer', disabled && 'cursor-not-allowed')}>
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </label>
      )}
    </div>
  );
}
