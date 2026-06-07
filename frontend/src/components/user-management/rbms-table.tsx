'use client';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Loader2, LockKeyhole, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { IModuleMenu } from '@/types';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'permissions';
const FULL_ACCESS_COMPAT_PERMISSIONS = ['roles:*', 'modules:*', 'users:*', 'master:*'];

export interface RbmsField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  permissionMode?: 'raw' | 'module-selector';
}

export interface RbmsConfig {
  title: string;
  description: string;
  endpoint: string;
  idField?: string;
  permissions?: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => React.ReactNode }[];
  fields: RbmsField[];
}

function normalizeForm(values: Record<string, unknown>, fields: RbmsField[]) {
  const payload: Record<string, unknown> = {};
  fields.forEach((field) => {
    const raw = values[field.name];
    if (field.type === 'number') {
      payload[field.name] = raw === '' || raw === undefined ? 0 : Number(raw);
      return;
    }
    if (field.type === 'permissions') {
      payload[field.name] = Array.isArray(raw)
        ? raw.map((item) => String(item).trim()).filter(Boolean)
        : String(raw ?? '')
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      return;
    }
    payload[field.name] = raw === '' ? null : raw;
  });
  return payload;
}

function fieldDefault(row: Record<string, unknown> | null, field: RbmsField) {
  const value = row?.[field.name];
  if (field.type === 'permissions' && field.permissionMode === 'module-selector') return Array.isArray(value) ? value : [];
  if (field.type === 'permissions' && Array.isArray(value)) return value.join('\n');
  return value ?? '';
}

function permissionLabel(permission: string) {
  const [, action = permission] = permission.split(':');
  return action
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PermissionSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [utility, setUtility] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const selected = useMemo(() => new Set(value), [value]);

  const modulesQuery = useQuery<IModuleMenu[]>({
    queryKey: ['um', 'modules', 'permission-selector'],
    queryFn: async () => (await authApi.get('/auth/master/modules')).data.data,
  });

  const modules = useMemo(
    () => (modulesQuery.data ?? []).filter((module) => module.isActive !== false && (module.permissions?.length ?? 0) > 0),
    [modulesQuery.data],
  );
  const utilityOptions = useMemo(() => {
    const prefixes = modules
      .map((module) => module.code.split('-')[0])
      .filter(Boolean);
    return ['all', ...Array.from(new Set(prefixes))];
  }, [modules]);
  const visibleModules = useMemo(
    () => utility === 'all' ? modules : modules.filter((module) => module.code.startsWith(`${utility}-`) || module.code === utility),
    [modules, utility],
  );
  const allPermissions = useMemo(
    () => Array.from(new Set([...modules.flatMap((module) => module.permissions ?? []), ...FULL_ACCESS_COMPAT_PERMISSIONS])),
    [modules],
  );
  const selectedCount = value.length;
  const fullAccess = allPermissions.length > 0 && allPermissions.every((permission) => selected.has(permission));

  function setPermissions(next: Iterable<string>) {
    onChange(Array.from(new Set(next)).sort());
  }

  function togglePermission(permission: string) {
    const next = new Set(selected);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);
    setPermissions(next);
  }

  function toggleModule(module: IModuleMenu) {
    const modulePermissions = module.permissions ?? [];
    const hasAll = modulePermissions.every((permission) => selected.has(permission));
    const next = new Set(selected);
    modulePermissions.forEach((permission) => {
      if (hasAll) next.delete(permission);
      else next.add(permission);
    });
    setPermissions(next);
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Module Permissions
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Select full access or choose actions per module.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{selectedCount} selected</Badge>
          <Button
            type="button"
            size="sm"
            variant={fullAccess ? 'default' : 'outline'}
            onClick={() => setPermissions(fullAccess ? [] : allPermissions)}
            disabled={modulesQuery.isLoading || allPermissions.length === 0}
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            Full Access
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {utilityOptions.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={utility === option ? 'default' : 'outline'}
            onClick={() => setUtility(option)}
            className="capitalize"
          >
            {option === 'all' ? 'All Modules' : option}
          </Button>
        ))}
      </div>

      {modulesQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-md border bg-background py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading modules...
        </div>
      ) : visibleModules.length === 0 ? (
        <div className="rounded-md border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
          No active module permissions found.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleModules.map((module) => {
            const modulePermissions = module.permissions ?? [];
            const moduleSelected = modulePermissions.filter((permission) => selected.has(permission)).length;
            const isExpanded = expanded[module.id] ?? moduleSelected > 0;
            const moduleComplete = moduleSelected === modulePermissions.length;
            return (
              <div key={module.id} className="rounded-md border bg-background">
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setExpanded((current) => ({ ...current, [module.id]: !isExpanded }))}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{module.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{module.code} - {module.route}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={moduleComplete ? 'success' : moduleSelected > 0 ? 'secondary' : 'outline'}>
                      {moduleSelected}/{modulePermissions.length}
                    </Badge>
                    <Button type="button" size="sm" variant={moduleComplete ? 'default' : 'outline'} onClick={() => toggleModule(module)}>
                      <Check className="mr-2 h-4 w-4" />
                      {moduleComplete ? 'Clear Module' : 'Allow Module'}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-wrap gap-2 border-t p-3">
                    {modulePermissions.map((permission) => {
                      const active = selected.has(permission);
                      return (
                        <button
                          key={permission}
                          type="button"
                          className={[
                            'inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          ].join(' ')}
                          onClick={() => togglePermission(permission)}
                        >
                          {active && <Check className="mr-1.5 h-3.5 w-3.5" />}
                          {permissionLabel(permission)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t pt-3">
          {value.slice(0, 18).map((permission) => (
            <Badge key={permission} variant="outline">{permission}</Badge>
          ))}
          {value.length > 18 && <Badge variant="secondary">+{value.length - 18} more</Badge>}
        </div>
      )}
    </div>
  );
}

function EntityForm({
  config,
  row,
  saving,
  onCancel,
  onSubmit,
}: {
  config: RbmsConfig;
  row: Record<string, unknown> | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(config.fields.map((field) => [field.name, fieldDefault(row, field)])),
  );

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form
      className="rounded-md border bg-card p-4 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(normalizeForm(values, config.fields));
      }}
    >
      <div>
        <h3 className="font-semibold">{row ? `Edit ${config.title}` : `New ${config.title}`}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.fields.map((field) => {
          const fieldValue = values[field.name];
          return (
            <div key={field.name} className={field.type === 'textarea' || field.type === 'permissions' ? 'md:col-span-2 space-y-1' : 'space-y-1'}>
              <span className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </span>
              {field.type === 'permissions' && field.permissionMode === 'module-selector' ? (
                <PermissionSelector
                  value={Array.isArray(fieldValue) ? fieldValue.map(String) : []}
                  onChange={(next) => setField(field.name, next)}
                />
              ) : field.type === 'textarea' || field.type === 'permissions' ? (
                <textarea
                  className="min-h-[92px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={field.placeholder}
                  value={String(fieldValue ?? '')}
                  onChange={(event) => setField(field.name, event.target.value)}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(fieldValue ?? '')}
                  onChange={(event) => setField(field.name, event.target.value)}
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  placeholder={field.placeholder}
                  value={String(fieldValue ?? '')}
                  onChange={(event) => setField(field.name, event.target.value)}
                  required={field.required}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
        </Button>
      </div>
    </form>
  );
}

export function RbmsTable({ config }: { config: RbmsConfig }) {
  const qc = useQueryClient();
  const { canAny } = useAuth();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const canRead = !config.permissions?.read || canAny(config.permissions.read);
  const canCreate = !config.permissions?.create || canAny(config.permissions.create);
  const canUpdate = !config.permissions?.update || canAny(config.permissions.update);
  const canDelete = !config.permissions?.delete || canAny(config.permissions.delete);

  const query = useQuery<Record<string, unknown>[]>({
    queryKey: ['rbms', config.endpoint],
    queryFn: async () => (await authApi.get(config.endpoint)).data.data,
    enabled: canRead,
  });

  const createMut = useMutation({ mutationFn: (body: Record<string, unknown>) => authApi.post(config.endpoint, body) });
  const updateMut = useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => authApi.put(`${config.endpoint}/${id}`, body) });
  const deleteMut = useMutation({ mutationFn: (id: string) => authApi.delete(`${config.endpoint}/${id}`) });

  const idField = config.idField ?? 'id';
  const rows = useMemo(() => {
    const all = query.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [query.data, search]);

  async function save(row: Record<string, unknown> | null, body: Record<string, unknown>) {
    if ((row && !canUpdate) || (!row && !canCreate)) return;
    setSaving(true);
    try {
      if (row) await updateMut.mutateAsync({ id: String(row[idField]), body });
      else await createMut.mutateAsync(body);
      await qc.invalidateQueries({ queryKey: ['rbms', config.endpoint] });
      setCreating(false);
      setEditing(null);
      toast({ title: `${config.title} saved` });
    } catch (error) {
      toast({ title: 'Error', description: apiErrorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Record<string, unknown>) {
    if (!canDelete) return;
    if (!confirm(`Deactivate this ${config.title}?`)) return;
    try {
      await deleteMut.mutateAsync(String(row[idField]));
      await qc.invalidateQueries({ queryKey: ['rbms', config.endpoint] });
      toast({ title: `${config.title} deactivated` });
    } catch (error) {
      toast({ title: 'Error', description: apiErrorMessage(error), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder={`Search ${config.title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {!canRead && (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          You do not have permission to view {config.title.toLowerCase()}.
        </div>
      )}

      {(creating || editing) && (
        <EntityForm config={config} row={editing} saving={saving} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={(body) => save(editing, body)} />
      )}

      {canRead && <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {config.columns.map((column) => <th key={column.key} className="px-4 py-3 text-left font-medium text-muted-foreground">{column.label}</th>)}
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && <tr><td className="py-8 text-center" colSpan={config.columns.length + 1}><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>}
            {!query.isLoading && rows.length === 0 && <tr><td className="py-8 text-center text-muted-foreground" colSpan={config.columns.length + 1}>No records found.</td></tr>}
            {!query.isLoading && rows.map((row) => (
              <tr key={String(row[idField])} className="border-t hover:bg-muted/30">
                {config.columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render ? column.render(row) : String(row[column.key] ?? '')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {canUpdate && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(row); setCreating(false); }}><Pencil className="h-3.5 w-3.5" /></Button>}
                    {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

export function ActiveBadge({ row }: { row: Record<string, unknown> }) {
  return <Badge variant={row.isActive === false ? 'secondary' : 'success'}>{row.isActive === false ? 'Inactive' : 'Active'}</Badge>;
}
