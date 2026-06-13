'use client';
import type React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';
export type ColumnSort = { key: string; direction: SortDirection } | null;
export type ColumnFilters = Record<string, string>;

export function textValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(textValue).join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function applyColumnFilters<T>(
  rows: T[],
  filters: ColumnFilters,
  accessor: (row: T, key: string) => unknown,
) {
  const activeFilters = Object.entries(filters)
    .map(([key, value]) => [key, value.trim().toLowerCase()] as const)
    .filter(([, value]) => value);

  if (activeFilters.length === 0) return rows;
  return rows.filter((row) =>
    activeFilters.every(([key, filter]) => textValue(accessor(row, key)).toLowerCase().includes(filter)),
  );
}

export function applyColumnSort<T>(
  rows: T[],
  sort: ColumnSort,
  accessor: (row: T, key: string) => unknown,
) {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const aText = textValue(accessor(a, sort.key));
    const bText = textValue(accessor(b, sort.key));
    const aNumber = Number(aText);
    const bNumber = Number(bText);
    const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
      ? aNumber - bNumber
      : aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? result : -result;
  });
}

export function nextSort(current: ColumnSort, key: string): ColumnSort {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return null;
}

export function activeFilterCount(filters: ColumnFilters) {
  return Object.values(filters).filter((value) => value.trim()).length;
}

export function ColumnHeader({
  label,
  filterValue,
  sortDirection,
  onFilterChange,
  onSort,
  className,
}: {
  label: string;
  filterValue: string;
  sortDirection?: SortDirection;
  onFilterChange: (value: string) => void;
  onSort: () => void;
  className?: string;
}) {
  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className={cn('min-w-36 space-y-2', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 -ms-2 gap-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        onClick={onSort}
      >
        <span className="truncate">{label}</span>
        <SortIcon className="h-3.5 w-3.5 shrink-0" />
      </Button>
      {/* <div className="relative" onClick={stop}>
        <Search className="absolute start-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder="Filter-11"
          className="h-8 ps-7 pe-7 text-xs"
        />
        {filterValue && (
          <button
            type="button"
            className="absolute end-2 top-2 text-muted-foreground hover:text-foreground"
            onClick={() => onFilterChange('')}
            aria-label={`Clear ${label} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div> */}
    </div>
  );
}
