'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ISystemSetting } from '@/types';

const SETTINGS_STORAGE_KEY = 'ump-public-settings';
const SETTINGS_CACHE_MS = 24 * 60 * 60 * 1000;

interface StoredSettings {
  savedAt: number;
  data: ISystemSetting[];
}

function readStoredSettings(): StoredSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSettings;
    if (!Array.isArray(parsed.data) || !Number.isFinite(parsed.savedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSettings(data: ISystemSetting[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
}

export function clearPublicSettingsCache() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
}

export function usePublicSettings() {
  const { isAuthenticated, hasHydrated } = useAuth();
  const stored = readStoredSettings();
  const isFresh = stored ? Date.now() - stored.savedAt < SETTINGS_CACHE_MS : false;

  const query = useQuery<ISystemSetting[]>({
    queryKey: ['settings', 'public'],
    queryFn: async () => (await masterApi.get('/master/settings')).data.data,
    enabled: hasHydrated && isAuthenticated,
    initialData: stored?.data,
    initialDataUpdatedAt: isFresh ? stored?.savedAt : 0,
    staleTime: SETTINGS_CACHE_MS,
    retry: false,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      clearPublicSettingsCache();
      return;
    }
    if (query.data) writeStoredSettings(query.data);
  }, [hasHydrated, isAuthenticated, query.data]);

  return query;
}
