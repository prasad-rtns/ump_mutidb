'use client';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function PaginationControls({ page, pageSize, total, onPageChange, itemLabel }: PaginationControlsProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const firstItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(total, currentPage * pageSize);
  const pages = visiblePages(currentPage, totalPages);
  const label = itemLabel ?? t('pagination.records');

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-4 border border-x-0 border-b-0 bg-card/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-card sm:px-3 sm:shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-24"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label={t('common.prev')}
          >
            <ChevronLeft className="me-1 h-4 w-4" /> {t('common.prev')}
          </Button>
          <span className="shrink-0 text-sm font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-24"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label={t('common.next')}
          >
            {t('common.next')} <ChevronRight className="ms-1 h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground sm:text-start">
          <span className="font-medium text-foreground">{firstItem}-{lastItem}</span>
          {' '}{t('pagination.of')}{' '}
          <span className="font-medium text-foreground">{total}</span>
          {' '}{label}
          <span className="mx-2 hidden text-border sm:inline">|</span>
          <span className="block sm:inline">{t('pagination.rowsPerPage', { count: pageSize })}</span>
        </div>

        <div className="hidden flex-wrap items-center justify-center gap-1.5 sm:flex sm:justify-end">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            aria-label={t('pagination.firstPage')}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label={t('common.prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1">
            {pages[0] > 1 && <span className="px-1 text-sm text-muted-foreground">...</span>}
            {pages.map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                size="sm"
                variant={pageNumber === currentPage ? 'default' : 'outline'}
                className="h-8 min-w-8 px-2"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            {pages[pages.length - 1] < totalPages && <span className="px-1 text-sm text-muted-foreground">...</span>}
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label={t('common.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label={t('pagination.lastPage')}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
