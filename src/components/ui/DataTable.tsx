import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  isMono?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Hiện chưa có mục nào phù hợp để hiển thị.',
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  pagination,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`space-y-3 ${className}`}>
      {(onSearchChange || actions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || 'Tìm kiếm...'}
                className="w-full h-9 pl-9 pr-3.5 text-xs bg-white border border-slate-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-colors"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-3 px-4 text-slate-600 font-semibold uppercase text-[10px] tracking-wider select-none ${
                      col.className || ''
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="py-3 px-4">
                        <div className="h-4 bg-slate-200/70 rounded-md w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => (
                  <tr
                    key={keyExtractor(row, rIdx)}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {columns.map((col, cIdx) => {
                      let cellContent: React.ReactNode = null;
                      if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(row);
                      } else if (col.accessor) {
                        cellContent = String(row[col.accessor] ?? '');
                      }
                      return (
                        <td
                          key={cIdx}
                          className={`py-3 px-4 text-slate-700 align-middle ${
                            col.isMono ? 'font-mono text-xs tabular-nums' : ''
                          } ${col.className || ''}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang <strong className="text-slate-800 font-mono">{pagination.currentPage}</strong> /{' '}
              <strong className="text-slate-800 font-mono">{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
