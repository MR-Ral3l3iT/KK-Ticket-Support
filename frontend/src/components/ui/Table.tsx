import { cn } from '@/lib/utils/cn';

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className={cn('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-gray-50 border-b border-gray-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-gray-50 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export interface TableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
}

export function TableTh({ sortable, sorted, className, children, ...props }: TableThProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap',
        sortable && 'cursor-pointer select-none hover:text-gray-700',
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-gray-300">
            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </span>
    </th>
  );
}

export function TableTd({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 whitespace-nowrap', className)} {...props}>
      {children}
    </td>
  );
}
