'use client';
import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { EntityMeta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/dynamic-form/dynamic-form';
import { formatDate } from '@/lib/utils';

interface DataTableProps<T extends Record<string, unknown>> {
  meta: EntityMeta;
  data: T[];
  total: number;
  page: number;
  isLoading?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  onPageChange: (page: number) => void;
  onSearch?: (q: string) => void;
  onCreate: (values: Record<string, unknown>) => Promise<void>;
  onUpdate: (id: string, values: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  selectOptions?: Record<string, { value: string; label: string }[]>;
  /** Override column display label */
  columnLabels?: Record<string, string>;
}

const PAGE_SIZE = 20;

function renderCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-xs">—</span>;
  if (typeof value === 'boolean') return <Badge variant={value ? 'success' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}/.test(value))) {
    return <span className="text-xs">{formatDate(value as string)}</span>;
  }
  return <span className="text-sm">{String(value)}</span>;
}

export function DataTable<T extends Record<string, unknown>>({
  meta, data, total, page, isLoading,
  canCreate = false, canUpdate = false, canDelete = false,
  onPageChange, onSearch, onCreate, onUpdate, onDelete,
  selectOptions = {}, columnLabels = {},
}: DataTableProps<T>) {
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow]       = useState<T | null>(null);
  const [saving, setSaving]         = useState(false);
  const [searchQ, setSearch]        = useState('');

  const idField = meta.idField;
  const columns = meta.listColumns;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function colLabel(col: string) {
    if (columnLabels[col]) return columnLabels[col];
    const f = meta.fields.find((x) => x.name === col);
    if (f) return f.label;
    return col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  }

  async function handleCreate(values: Record<string, unknown>) {
    setSaving(true);
    try { await onCreate(values); setShowCreate(false); } finally { setSaving(false); }
  }
  async function handleUpdate(values: Record<string, unknown>) {
    if (!editRow) return;
    setSaving(true);
    try { await onUpdate(String(editRow[idField]), values); setEditRow(null); } finally { setSaving(false); }
  }
  async function handleDelete(row: T) {
    if (!confirm(`Delete this ${meta.label}?`)) return;
    await onDelete(String(row[idField]));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {onSearch && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={`Search ${meta.pluralLabel}…`}
              value={searchQ}
              onChange={(e) => { setSearch(e.target.value); onSearch(e.target.value); }}
            />
          </div>
        )}
        {canCreate && (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => { setShowCreate(true); setEditRow(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Add {meta.label}
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">New {meta.label}</h3>
          <DynamicForm fields={meta.fields} onSubmit={handleCreate} isLoading={saving}
            submitLabel={`Create ${meta.label}`} onCancel={() => setShowCreate(false)} selectOptions={selectOptions} />
        </div>
      )}

      {/* Edit form */}
      {editRow && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">Edit {meta.label}</h3>
          <DynamicForm fields={meta.fields} defaultValues={editRow as Record<string,unknown>} onSubmit={handleUpdate}
            isLoading={saving} submitLabel="Update" onCancel={() => setEditRow(null)} selectOptions={selectOptions} />
        </div>
      )}

      {/* Table */}
      <div className="hidden rounded-lg border overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((c) => <th key={c} className="px-4 py-3 text-left font-medium text-muted-foreground">{colLabel(c)}</th>)}
              {(canUpdate || canDelete) && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={columns.length + 1} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </td></tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">No records found.</td></tr>
            )}
            {!isLoading && data.map((row, i) => (
              <tr key={String(row[idField]) || i} className="border-t hover:bg-muted/30 transition-colors">
                {columns.map((c) => <td key={c} className="px-4 py-3">{renderCell(row[c])}</td>)}
                {(canUpdate || canDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRow(row); setShowCreate(false); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(row)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading && (
          <div className="rounded-md border bg-card py-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No records found.
          </div>
        )}
        {!isLoading && data.map((row, i) => (
          <div key={String(row[idField]) || i} className="rounded-md border bg-card p-4">
            <div className="space-y-3">
              {columns.map((c) => (
                <div key={c} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{colLabel(c)}</span>
                  <div className="min-w-0 break-words">{renderCell(row[c])}</div>
                </div>
              ))}
            </div>
            {(canUpdate || canDelete) && (
              <div className="mt-4 flex gap-2 border-t pt-3">
                {canUpdate && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditRow(row); setShowCreate(false); }}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(row)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{total} total records</span>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
            <span>{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
