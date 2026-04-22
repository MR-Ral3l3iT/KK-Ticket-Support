import { cn } from '@/lib/utils/cn';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  const colors = [
    'bg-red-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-yellow-400',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];
  if (!name) return colors[0];
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const color = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0',
        color,
        sizeClasses[size],
        className,
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
