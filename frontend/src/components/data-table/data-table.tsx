'use client';
import type React from 'react';
import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { EntityMeta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/dynamic-form/dynamic-form';
import { PaginationControls } from '@/components/pagination/pagination-controls';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface DataTableProps<T extends Record<string, unknown>> {
  meta: EntityMeta;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
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
  columnLabels?: Record<string, string>;
}

function BooleanCell({ value }: { value: boolean }) {
  const { t } = useTranslation();
  return <Badge variant={value ? 'success' : 'secondary'}>{value ? t('common.yes') : t('common.no')}</Badge>;
}

function renderCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-xs">-</span>;
  if (typeof value === 'boolean') return <BooleanCell value={value} />;
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}/.test(value))) {
    return <span className="text-xs">{formatDate(value as string)}</span>;
  }
  return <span className="text-sm">{String(value)}</span>;
}

export function DataTable<T extends Record<string, unknown>>({
  meta, data, total, page, pageSize, isLoading,
  canCreate = false, canUpdate = false, canDelete = false,
  onPageChange, onSearch, onCreate, onUpdate, onDelete,
  selectOptions = {}, columnLabels = {},
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearch] = useState('');

  const idField = meta.idField;
  const columns = meta.listColumns;

  function colLabel(col: string) {
    if (columnLabels[col]) return columnLabels[col];
    const translated = t(`labels.${col}`);
    if (translated !== `labels.${col}`) return translated;
    const field = meta.fields.find((x) => x.name === col);
    if (field) return field.label;
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
    if (!confirm(t('common.confirmDelete', { name: meta.label }))) return;
    await onDelete(String(row[idField]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {onSearch && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-8"
              placeholder={t('common.searchWithName', { name: meta.pluralLabel })}
              value={searchQ}
              onChange={(e) => { setSearch(e.target.value); onSearch(e.target.value); }}
            />
          </div>
        )}
        {canCreate && (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => { setShowCreate(true); setEditRow(null); }}>
            <Plus className="me-1 h-4 w-4" /> {t('common.add')} {meta.label}
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">{t('common.new', { name: meta.label })}</h3>
          <DynamicForm fields={meta.fields} onSubmit={handleCreate} isLoading={saving}
            submitLabel={t('common.create', { name: meta.label })} onCancel={() => setShowCreate(false)} selectOptions={selectOptions} />
        </div>
      )}

      {editRow && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">{t('common.editName', { name: meta.label })}</h3>
          <DynamicForm fields={meta.fields} defaultValues={editRow as Record<string, unknown>} onSubmit={handleUpdate}
            isLoading={saving} submitLabel={t('common.update')} onCancel={() => setEditRow(null)} selectOptions={selectOptions} />
        </div>
      )}

      <div className="hidden rounded-lg border overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => <th key={column} className="px-4 py-3 text-start font-medium text-muted-foreground">{colLabel(column)}</th>)}
              {(canUpdate || canDelete) && <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={columns.length + 1} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </td></tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">{t('common.noRecords')}</td></tr>
            )}
            {!isLoading && data.map((row, index) => (
              <tr key={String(row[idField]) || index} className="border-t hover:bg-muted/30 transition-colors">
                {columns.map((column) => <td key={column} className="px-4 py-3">{renderCell(row[column])}</td>)}
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
            {t('common.noRecords')}
          </div>
        )}
        {!isLoading && data.map((row, index) => (
          <div key={String(row[idField]) || index} className="rounded-md border bg-card p-4">
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{colLabel(column)}</span>
                  <div className="min-w-0 break-words">{renderCell(row[column])}</div>
                </div>
              ))}
            </div>
            {(canUpdate || canDelete) && (
              <div className="mt-4 flex gap-2 border-t pt-3">
                {canUpdate && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditRow(row); setShowCreate(false); }}>
                    <Pencil className="me-2 h-3.5 w-3.5" /> {t('common.edit')}
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(row)}>
                    <Trash2 className="me-2 h-3.5 w-3.5" /> {t('common.delete')}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}
