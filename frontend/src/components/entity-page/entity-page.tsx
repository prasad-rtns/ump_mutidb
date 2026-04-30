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

export function EntityPage({ entity, selectOptions = {} }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data: schema, isLoading: schemaLoading } = useEntitySchema(entity);

  const { data: listData, isLoading: dataLoading } = useQuery({
    queryKey: ['master', entity, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      const endpoint = schema?.apiEndpoint || `/api/v1/master/${entity}`;
      const { data } = await masterApi.get(`${endpoint.replace('/api/v1/master', '')}?${params}`);
      const payload = data.data;
      // Support both array and paginated response
      if (Array.isArray(payload)) return { data: payload, total: payload.length };
      return { data: payload.data ?? [], total: payload.total ?? 0 };
    },
    enabled: !!schema,
  });

  const createMut  = useMutation({ mutationFn: (body: Record<string,unknown>) => masterApi.post(schema!.apiEndpoint.replace('/api/v1/master',''), body) });
  const updateMut  = useMutation({ mutationFn: ({ id, body }: { id:string; body:Record<string,unknown> }) => masterApi.put(`${schema!.apiEndpoint.replace('/api/v1/master','')}/${id}`, body) });
  const deleteMut  = useMutation({ mutationFn: (id: string) => masterApi.delete(`${schema!.apiEndpoint.replace('/api/v1/master','')}/${id}`) });

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

  const userRole = user?.role?.slug ?? '';
  const canCreate = schema.permissions.create.includes(userRole);
  const canUpdate = schema.permissions.update.includes(userRole);
  const canDelete = schema.permissions.delete.includes(userRole);

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
