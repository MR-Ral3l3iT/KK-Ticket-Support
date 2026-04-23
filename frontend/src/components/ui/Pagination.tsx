'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showTotal?: boolean;
  total?: number;
}

export function Pagination({ page, totalPages, onPageChange, showTotal, total }: PaginationProps) {
  if (totalPages <= 1) {
    if (!showTotal || total === undefined) return null;
    return (
      <p className="text-sm text-gray-500">
        ทั้งหมด <span className="font-medium text-gray-700">{total.toLocaleString()}</span> รายการ
      </p>
    );
  }

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {showTotal && total !== undefined && (
        <p className="text-sm text-gray-500 whitespace-nowrap">
          ทั้งหมด <span className="font-medium text-gray-700">{total.toLocaleString()}</span> รายการ
        </p>
      )}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PaginationButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationButton>

        {getPages().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
              …
            </span>
          ) : (
            <PaginationButton
              key={p}
              onClick={() => onPageChange(p as number)}
              active={p === page}
              aria-label={`หน้า ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </PaginationButton>
          ),
        )}

        <PaginationButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>
      </nav>
    </div>
  );
}

interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PaginationButton({ active, className, children, ...props }: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
