'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterApi, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useEntitySchema } from '@/hooks/use-schema';
import { usePaginationSettings, ROWS_PER_PAGE_SETTING_KEY } from '@/hooks/use-pagination-settings';
import { clearPublicSettingsCache } from '@/hooks/use-public-settings';
import { DataTable } from '@/components/data-table/data-table';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n';
import type { ICategory } from '@/types';

interface Props {
  entity: string;
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

function masterProxyPath(apiEndpoint: string) {
  return apiEndpoint.replace('/api/v1', '');
}

function endpointForList(entity: string, apiEndpoint: string) {
  return entity === 'settings' ? '/api/v1/master/settings/all' : apiEndpoint;
}

function normalizeSettingPayload(values: Record<string, unknown>) {
  const payload = { ...values };
  const type = String(payload.type ?? 'text').trim().toLowerCase();
  const rawValue = payload.value;
  const value = rawValue == null ? '' : String(rawValue).trim();

  payload.key = String(payload.key ?? '').trim();
  payload.type = type;
  payload.category = String(payload.category ?? 'general').trim() || 'general';
  payload.isPublic = payload.isPublic === true || payload.isPublic === 'true' || payload.isPublic === 'on';

  if (!payload.key) throw new Error('Setting key is required');

  if (type === 'integer' && value && !/^-?\d+$/.test(value)) {
    throw new Error('Value must be an integer');
  }
  if (type === 'number' && value && !Number.isFinite(Number(value))) {
    throw new Error('Value must be a number');
  }
  if (type === 'boolean') {
    payload.value = rawValue === true || value.toLowerCase() === 'true' ? 'true' : 'false';
    return payload;
  }
  if (type === 'url' && value) {
    try {
      new URL(value);
    } catch {
      throw new Error('Value must be a valid absolute URL');
    }
  }
  if (type === 'color' && value && !/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(value)) {
    throw new Error('Value must be a valid hex color, for example #0F7E6D');
  }
  if (type === 'json' && value) {
    try {
      payload.value = JSON.stringify(JSON.parse(value));
      return payload;
    } catch {
      throw new Error('Value must be valid JSON');
    }
  }

  payload.value = value;
  return payload;
}

export function EntityPage({ entity, selectOptions = {} }: Props) {
  const qc = useQueryClient();
  const { canAny } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { rowsPerPage } = usePaginationSettings();

  const { data: schema, isLoading: schemaLoading } = useEntitySchema(entity);
  const canRead = canAny([`${entity}:read`, `${entity}:*`, 'master:*']);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const { data: listData, isLoading: dataLoading } = useQuery({
    queryKey: ['master', entity, page, search, rowsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(rowsPerPage) });
      if (search) params.set('search', search);
      if (entity === 'categories') params.set('categoryType', 'admin category');
      const endpoint = endpointForList(entity, schema?.apiEndpoint || `/api/v1/master/${entity}`);
      const { data } = await masterApi.get(`${masterProxyPath(endpoint)}?${params}`);
      const payload = data.data;
      if (Array.isArray(payload)) {
        const needle = search.trim().toLowerCase();
        const all = needle ? payload.filter((row) => JSON.stringify(row).toLowerCase().includes(needle)) : payload;
        const start = (page - 1) * rowsPerPage;
        return { data: all.slice(start, start + rowsPerPage), total: all.length };
      }
      return { data: payload.data ?? [], total: payload.total ?? 0 };
    },
    enabled: !!schema && canRead,
  });

  const createMut = useMutation({ mutationFn: (body: Record<string, unknown>) => masterApi.post(masterProxyPath(schema!.apiEndpoint), body) });
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      if (entity === 'settings') {
        return masterApi.post(masterProxyPath(schema!.apiEndpoint), { ...body, key: body.key ?? id });
      }
      return masterApi.put(`${masterProxyPath(schema!.apiEndpoint)}/${encodeURIComponent(id)}`, body);
    },
  });
  const deleteMut = useMutation({ mutationFn: (id: string) => masterApi.delete(`${masterProxyPath(schema!.apiEndpoint)}/${encodeURIComponent(id)}`) });
  const { data: adminCategories = [] } = useQuery<ICategory[]>({
    queryKey: ['master', 'categories', 'admin category', 'select-options'],
    queryFn: async () => {
      const { data } = await masterApi.get('/master/categories?categoryType=admin%20category');
      const payload = data.data;
      return Array.isArray(payload) ? payload : payload?.data ?? [];
    },
    enabled: entity === 'settings',
  });

  const effectiveSelectOptions = entity === 'settings'
    ? {
        ...selectOptions,
        category: adminCategories.map((category) => ({ value: category.code, label: category.name })),
      }
    : selectOptions;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['master', entity] });
    if (entity === 'settings') {
      clearPublicSettingsCache();
      qc.invalidateQueries({ queryKey: ['settings', 'public'] });
    }
  }

  async function onCreate(values: Record<string, unknown>) {
    try {
      await createMut.mutateAsync(entity === 'settings' ? normalizeSettingPayload(values) : values);
      invalidate();
      toast({ title: t('common.created', { name: schema?.label ?? '' }) });
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
      throw e;
    }
  }

  async function onUpdate(id: string, values: Record<string, unknown>) {
    try {
      await updateMut.mutateAsync({ id, body: entity === 'settings' ? normalizeSettingPayload(values) : values });
      invalidate();
      toast({ title: t('common.updated', { name: schema?.label ?? '' }) });
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
      throw e;
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteMut.mutateAsync(id);
      invalidate();
      toast({ title: t('common.deleted', { name: schema?.label ?? '' }) });
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
    }
  }

  useEffect(() => {
    const total = listData?.total ?? 0;
    const maxPage = Math.max(1, Math.ceil(total / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [listData?.total, page, rowsPerPage]);

  if (schemaLoading) return <div className="p-8 text-center text-muted-foreground">{t('common.loadingSchema')}</div>;
  if (!schema) return <div className="p-8 text-center text-muted-foreground">{t('common.entityNotFound')}</div>;
  if (!canRead) return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">{t('common.notAllowedView', { name: schema.pluralLabel.toLowerCase() })}</div>;

  const canCreate = canAny([`${entity}:create`, `${entity}:*`, 'master:*']);
  const canUpdate = canAny([`${entity}:update`, `${entity}:edit-all`, `${entity}:edit-own`, `${entity}:*`, 'master:*']);
  const canDelete = canAny([`${entity}:delete`, `${entity}:delete-all`, `${entity}:delete-own`, `${entity}:*`, 'master:*']);

  return (
    <div className="space-y-4">
      {entity === 'settings' && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">{t('pagination.systemSettingTitle')}</p>
          <p className="mt-1 text-muted-foreground">
            {t('pagination.systemSettingHelp', { key: ROWS_PER_PAGE_SETTING_KEY })}
          </p>
        </div>
      )}
      <DataTable
        meta={schema}
        data={(listData?.data ?? []) as Record<string, unknown>[]}
        total={listData?.total ?? 0}
        page={page}
        pageSize={rowsPerPage}
        isLoading={dataLoading}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onPageChange={setPage}
        onSearch={schema.searchable ? (q) => { setSearch(q); setPage(1); } : undefined}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        selectOptions={effectiveSelectOptions}
      />
    </div>
  );
}
