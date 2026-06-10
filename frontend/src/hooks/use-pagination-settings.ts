'use client';
import { useMemo } from 'react';
import { usePublicSettings } from '@/hooks/use-public-settings';

export const ROWS_PER_PAGE_SETTING_KEY = 'ui.grid.rowsPerPage';
export const DEFAULT_ROWS_PER_PAGE = 20;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

function clampRowsPerPage(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_ROWS_PER_PAGE;
  return Math.min(100, Math.max(5, Math.trunc(parsed)));
}

export function usePaginationSettings() {
  const query = usePublicSettings();

  const rowsPerPage = useMemo(() => {
    const setting = query.data?.find((item) => item.key === ROWS_PER_PAGE_SETTING_KEY);
    return clampRowsPerPage(setting?.value);
  }, [query.data]);

  return {
    rowsPerPage,
    rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
    settingKey: ROWS_PER_PAGE_SETTING_KEY,
    isLoading: query.isLoading,
  };
}
