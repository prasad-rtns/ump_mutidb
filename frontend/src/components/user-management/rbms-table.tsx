'use client';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Loader2, LockKeyhole, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSchemaCatalogue } from '@/hooks/use-schema';
import { mergeModulesWithMasterSchema, permissionListForModules } from '@/lib/dynamic-modules';
import { translatedModuleName } from '@/lib/module-translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { IModuleMenu } from '@/types';
import { useTranslation } from '@/i18n';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'permissions';

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
  const { t } = useTranslation();
  const [utility, setUtility] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const selected = useMemo(() => new Set(value), [value]);

  const modulesQuery = useQuery<IModuleMenu[]>({
    queryKey: ['um', 'modules', 'permission-selector'],
    queryFn: async () => (await authApi.get('/auth/master/modules')).data.data,
  });
  const { data: schemas, isLoading: schemasLoading } = useSchemaCatalogue();

  const modules = useMemo(
    () => mergeModulesWithMasterSchema(modulesQuery.data ?? [], schemas)
      .filter((module) => module.isActive !== false && (module.permissions?.length ?? 0) > 0),
    [modulesQuery.data, schemas],
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
    () => permissionListForModules(modules),
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
            {t('rbms.modulePermissions')}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('rbms.permissionHelp')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t('rbms.selected', { count: selectedCount })}</Badge>
          <Button
            type="button"
            size="sm"
            variant={fullAccess ? 'default' : 'outline'}
            onClick={() => setPermissions(fullAccess ? [] : allPermissions)}
            disabled={modulesQuery.isLoading || schemasLoading || allPermissions.length === 0}
          >
            <LockKeyhole className="me-2 h-4 w-4" />
            {t('rbms.fullAccess')}
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
            {option === 'all' ? t('rbms.allModules') : option}
          </Button>
        ))}
      </div>

      {modulesQuery.isLoading || schemasLoading ? (
        <div className="flex items-center justify-center rounded-md border bg-background py-8 text-sm text-muted-foreground">
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
          {t('rbms.loadingModules')}
        </div>
      ) : visibleModules.length === 0 ? (
        <div className="rounded-md border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
          {t('rbms.noModulePermissions')}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleModules.map((module) => {
            const modulePermissions = module.permissions ?? [];
            const moduleSelected = modulePermissions.filter((permission) => selected.has(permission)).length;
            const isExpanded = expanded[module.id] ?? moduleSelected > 0;
            const moduleComplete = moduleSelected === modulePermissions.length;
            const moduleLabel = translatedModuleName(module, t);
            return (
              <div key={module.id} className="rounded-md border bg-background">
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    onClick={() => setExpanded((current) => ({ ...current, [module.id]: !isExpanded }))}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{moduleLabel}</span>
                      <span className="block truncate text-xs text-muted-foreground">{module.code} - {module.route}</span>
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <Badge variant={moduleComplete ? 'success' : moduleSelected > 0 ? 'secondary' : 'outline'}>
                      {moduleSelected}/{modulePermissions.length}
                    </Badge>
                    <Button type="button" size="sm" variant={moduleComplete ? 'default' : 'outline'} className="flex-1 sm:flex-none" onClick={() => toggleModule(module)}>
                      <Check className="me-2 h-4 w-4" />
                      {moduleComplete ? t('rbms.clearModule') : t('rbms.allowModule')}
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
                          {active && <Check className="me-1.5 h-3.5 w-3.5" />}
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
          {value.length > 18 && <Badge variant="secondary">{t('rbms.more', { count: value.length - 18 })}</Badge>}
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
  const { t } = useTranslation();
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
        <h3 className="font-semibold">{row ? t('rbms.editTitle', { title: config.title }) : t('rbms.newTitle', { title: config.title })}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.fields.map((field) => {
          const fieldValue = values[field.name];
          return (
            <div key={field.name} className={field.type === 'textarea' || field.type === 'permissions' ? 'md:col-span-2 space-y-1' : 'space-y-1'}>
              <span className="text-sm font-medium">
                {t(`labels.${field.name}`, {}, field.label)}
                {field.required && <span className="text-destructive ms-1">*</span>}
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
                  <option value="">{t('common.select', { name: t(`labels.${field.name}`, {}, field.label) })}</option>
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

      <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export function RbmsTable({ config }: { config: RbmsConfig }) {
  const qc = useQueryClient();
  const { canAny } = useAuth();
  const { t } = useTranslation();
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
      toast({ title: t('rbms.saved', { title: config.title }) });
    } catch (error) {
      toast({ title: t('common.error'), description: apiErrorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Record<string, unknown>) {
    if (!canDelete) return;
    if (!confirm(t('rbms.deactivateConfirm', { title: config.title }))) return;
    try {
      await deleteMut.mutateAsync(String(row[idField]));
      await qc.invalidateQueries({ queryKey: ['rbms', config.endpoint] });
      toast({ title: t('rbms.deactivated', { title: config.title }) });
    } catch (error) {
      toast({ title: t('common.error'), description: apiErrorMessage(error), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="ps-8" placeholder={t('rbms.searchTitle', { title: config.title.toLowerCase() })} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {canCreate && (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => { setCreating(true); setEditing(null); }}>
            <Plus className="me-1 h-4 w-4" /> {t('rbms.add')}
          </Button>
        )}
      </div>

      {!canRead && (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          {t('common.notAllowedView', { name: config.title.toLowerCase() })}
        </div>
      )}

      {(creating || editing) && (
        <EntityForm config={config} row={editing} saving={saving} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={(body) => save(editing, body)} />
      )}

      {canRead && (
        <>
          <div className="hidden rounded-md border overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {config.columns.map((column) => <th key={column.key} className="px-4 py-3 text-start font-medium text-muted-foreground">{t(`labels.${column.key}`, {}, column.label)}</th>)}
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading && <tr><td className="py-8 text-center" colSpan={config.columns.length + 1}><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>}
                {!query.isLoading && rows.length === 0 && <tr><td className="py-8 text-center text-muted-foreground" colSpan={config.columns.length + 1}>{t('common.noRecords')}</td></tr>}
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
          </div>

          <div className="space-y-3 md:hidden">
            {query.isLoading && (
              <div className="rounded-md border bg-card py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!query.isLoading && rows.length === 0 && (
              <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                {t('common.noRecords')}
              </div>
            )}
            {!query.isLoading && rows.map((row) => (
              <div key={String(row[idField])} className="rounded-md border bg-card p-4">
                <div className="space-y-3">
                  {config.columns.map((column) => (
                    <div key={column.key} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(`labels.${column.key}`, {}, column.label)}</span>
                      <div className="min-w-0 break-words">
                        {column.render ? column.render(row) : String(row[column.key] ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
                {(canUpdate || canDelete) && (
                  <div className="mt-4 flex gap-2 border-t pt-3">
                    {canUpdate && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(row); setCreating(false); }}>
                        <Pencil className="me-2 h-3.5 w-3.5" /> {t('common.edit')}
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => remove(row)}>
                        <Trash2 className="me-2 h-3.5 w-3.5" /> {t('common.delete')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ActiveBadge({ row }: { row: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <Badge variant={row.isActive === false ? 'secondary' : 'success'}>{row.isActive === false ? t('users.inactive') : t('users.active')}</Badge>;
}
