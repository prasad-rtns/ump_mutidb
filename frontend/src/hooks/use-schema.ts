'use client';
import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/lib/api';
import type { SchemaCatalogue, EntityMeta } from '@/types';

export function useSchemaCatalogue() {
  return useQuery<SchemaCatalogue>({
    queryKey: ['meta', 'schema'],
    queryFn: async () => {
      const { data } = await masterApi.get('/meta/schema');
      return data.data as SchemaCatalogue;
    },
    staleTime: 5 * 60 * 1000, // 5 min — schema rarely changes
  });
}

export function useEntitySchema(entity: string) {
  return useQuery<EntityMeta>({
    queryKey: ['meta', 'schema', entity],
    queryFn: async () => {
      const { data } = await masterApi.get(`/meta/schema/${entity}`);
      return data.data as EntityMeta;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!entity,
  });
}
