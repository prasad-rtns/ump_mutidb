'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterApi, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useEntitySchema } from '@/hooks/use-schema';
import { DataTable } from '@/components/data-table/data-table';
import { toast } from '@/hooks/use-toast';

interface Props {
  entity: string; // e.g. 'countries', 'service-types'
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

const PAGE_SIZE = 20;

function masterProxyPath(apiEndpoint: string) {
  return apiEndpoint.replace('/api/v1', '');
}

export function EntityPage({ entity, selectOptions = {} }: Props) {
  const qc = useQueryClient();
  const { canAny } = useAuth();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data: schema, isLoading: schemaLoading } = useEntitySchema(entity);
  const canRead = canAny([`${entity}:read`, 'master:*', `${entity}:*`, 'system:*', 'utility-management:*']);

  const { data: listData, isLoading: dataLoading } = useQuery({
    queryKey: ['master', entity, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      const endpoint = schema?.apiEndpoint || `/api/v1/master/${entity}`;
      const { data } = await masterApi.get(`${masterProxyPath(endpoint)}?${params}`);
      const payload = data.data;
      // Support both array and paginated response
      if (Array.isArray(payload)) return { data: payload, total: payload.length };
      return { data: payload.data ?? [], total: payload.total ?? 0 };
    },
    enabled: !!schema && canRead,
  });

  const createMut  = useMutation({ mutationFn: (body: Record<string,unknown>) => masterApi.post(masterProxyPath(schema!.apiEndpoint), body) });
  const updateMut  = useMutation({ mutationFn: ({ id, body }: { id:string; body:Record<string,unknown> }) => masterApi.put(`${masterProxyPath(schema!.apiEndpoint)}/${id}`, body) });
  const deleteMut  = useMutation({ mutationFn: (id: string) => masterApi.delete(`${masterProxyPath(schema!.apiEndpoint)}/${id}`) });

  function invalidate() { qc.invalidateQueries({ queryKey: ['master', entity] }); }

  async function onCreate(values: Record<string,unknown>) {
    try { await createMut.mutateAsync(values); invalidate(); toast({ title: `${schema?.label} created` }); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); throw e; }
  }
  async function onUpdate(id: string, values: Record<string,unknown>) {
    try { await updateMut.mutateAsync({ id, body: values }); invalidate(); toast({ title: `${schema?.label} updated` }); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); throw e; }
  }
  async function onDelete(id: string) {
    try { await deleteMut.mutateAsync(id); invalidate(); toast({ title: `${schema?.label} deleted` }); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); }
  }

  if (schemaLoading) return <div className="p-8 text-center text-muted-foreground">Loading schema…</div>;
  if (!schema) return <div className="p-8 text-center text-muted-foreground">Entity not found.</div>;
  if (!canRead) return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">You do not have permission to view {schema.pluralLabel.toLowerCase()}.</div>;

  const canCreate = canAny([`${entity}:create`, 'master:*', `${entity}:*`, 'system:create', 'utility-management:create']);
  const canUpdate = canAny([`${entity}:update`, `${entity}:edit-all`, `${entity}:edit-own`, 'master:*', `${entity}:*`, 'system:update', 'system:edit-all', 'system:edit-own', 'utility-management:update', 'utility-management:edit-all', 'utility-management:edit-own']);
  const canDelete = canAny([`${entity}:delete`, `${entity}:delete-all`, `${entity}:delete-own`, 'master:*', `${entity}:*`, 'system:delete-all', 'system:delete-own', 'utility-management:delete-all', 'utility-management:delete-own']);

  return (
    <DataTable
      meta={schema}
      data={(listData?.data ?? []) as Record<string,unknown>[]}
      total={listData?.total ?? 0}
      page={page}
      isLoading={dataLoading}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onPageChange={setPage}
      onSearch={schema.searchable ? (q) => { setSearch(q); setPage(1); } : undefined}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      selectOptions={selectOptions}
    />
  );
}
