'use client';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Loader2, LockKeyhole, Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { authMasterKeys, queryFnForAuthMasterEndpoint, queryKeyForAuthMasterEndpoint, useAuthMasterModules } from '@/hooks/use-auth-master-data';
import { usePaginationSettings } from '@/hooks/use-pagination-settings';
import { useSchemaCatalogue } from '@/hooks/use-schema';
import { mergeModulesWithMasterSchema, permissionListForModules } from '@/lib/dynamic-modules';
import { translatedModuleName } from '@/lib/module-translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/pagination/pagination-controls';
import { ColumnHeader, activeFilterCount, applyColumnFilters, applyColumnSort, nextSort, type ColumnFilters, type ColumnSort } from '@/components/data-grid/column-tools';
import type { IModuleMenu } from '@/types';
import { useTranslation } from '@/i18n';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'permissions' | 'boolean';

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
    if (field.type === 'boolean') {
      payload[field.name] = raw === true || raw === 'true';
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

function permissionAction(permission: string) {
  return permission.split(':')[1] ?? permission;
}

function permissionResource(permission: string) {
  return permission.split(':')[0] ?? permission;
}

function groupKeyForModule(module: IModuleMenu, moduleById: Map<string, IModuleMenu>) {
  const parent = module.parentId ? moduleById.get(module.parentId) : undefined;
  return parent?.code ?? module.code ?? 'other';
}

function groupLabel(groupKey: string, modules: IModuleMenu[], moduleByCode: Map<string, IModuleMenu>, t: ReturnType<typeof useTranslation>['t']) {
  const module = moduleByCode.get(groupKey) ?? modules.find((item) => item.code === groupKey);
  if (module) return translatedModuleName(module, t);
  return groupKey.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionLabel(action: string, t: ReturnType<typeof useTranslation>['t']) {
  const normalized = action.toLowerCase();
  if (normalized === 'read') return t('rbms.actions.read');
  if (normalized === 'create') return t('rbms.actions.create');
  if (normalized === 'update') return t('rbms.actions.update');
  if (normalized === 'delete') return t('rbms.actions.delete');
  if (normalized === '*') return t('rbms.actions.all');
  return normalized.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moduleTypeLabel(type: string, t: ReturnType<typeof useTranslation>['t']) {
  if (type === 'admin') return t('rbms.moduleTypes.admin');
  if (type === 'internal') return t('rbms.moduleTypes.internal');
  if (type === 'external') return t('rbms.moduleTypes.external');
  return t('rbms.moduleTypes.all');
}

function responseData(response: unknown) {
  return (response as { data?: { data?: unknown } })?.data?.data;
}

function PermissionSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useTranslation();
  const [group, setGroup] = useState('all');
  const [moduleType, setModuleType] = useState<'all' | 'admin' | 'internal' | 'external'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const selected = useMemo(() => new Set(value), [value]);

  const modulesQuery = useAuthMasterModules();
  const { data: schemas, isLoading: schemasLoading } = useSchemaCatalogue();

  const modules = useMemo(
    () => mergeModulesWithMasterSchema(modulesQuery.data ?? [], schemas)
      .filter((module) => module.isActive !== false && (module.permissions?.length ?? 0) > 0),
    [modulesQuery.data, schemas],
  );
  const moduleById = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules]);
  const moduleByCode = useMemo(() => new Map(modules.map((module) => [module.code, module])), [modules]);
  const groupOptions = useMemo(() => {
    const counts = new Map<string, { total: number; selected: number }>();
    modules.forEach((module) => {
      const key = groupKeyForModule(module, moduleById);
      const current = counts.get(key) ?? { total: 0, selected: 0 };
      current.total += 1;
      if ((module.permissions ?? []).some((permission) => selected.has(permission))) current.selected += 1;
      counts.set(key, current);
    });
    return Array.from(counts.entries())
      .sort(([a], [b]) => groupLabel(a, modules, moduleByCode, t).localeCompare(groupLabel(b, modules, moduleByCode, t)))
      .map(([key, counts]) => ({ key, label: groupLabel(key, modules, moduleByCode, t), ...counts }));
  }, [moduleByCode, moduleById, modules, selected, t]);

  const selectedModuleCount = useMemo(
    () => modules.filter((module) => (module.permissions ?? []).some((permission) => selected.has(permission))).length,
    [modules, selected],
  );

  const moduleTypeOptions = useMemo(() => {
    const base = [
      { key: 'all' as const, count: modules.length },
      { key: 'admin' as const, count: modules.filter((module) => (module.moduleType ?? 'admin') === 'admin').length },
      { key: 'internal' as const, count: modules.filter((module) => (module.moduleType ?? 'admin') === 'internal').length },
      { key: 'external' as const, count: modules.filter((module) => (module.moduleType ?? 'admin') === 'external').length },
    ];
    return base;
  }, [modules]);

  const filteredModules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return modules.filter((module) => {
      if (moduleType !== 'all' && (module.moduleType ?? 'admin') !== moduleType) return false;
      const moduleGroup = groupKeyForModule(module, moduleById);
      const hasSelection = (module.permissions ?? []).some((permission) => selected.has(permission));
      const groupMatch = group === 'all' || group === moduleGroup || (group === 'selected' && hasSelection);
      if (!groupMatch) return false;
      if (!needle) return true;
      const label = translatedModuleName(module, t).toLowerCase();
      const route = String(module.route ?? '').toLowerCase();
      const code = module.code.toLowerCase();
      return label.includes(needle) || code.includes(needle) || route.includes(needle) || (module.permissions ?? []).some((permission) => permission.toLowerCase().includes(needle));
    });
  }, [group, moduleById, moduleType, modules, query, selected, t]);

  const visibleModules = useMemo(
    () => filteredModules.sort((a, b) => {
      const groupA = groupLabel(groupKeyForModule(a, moduleById), modules, moduleByCode, t);
      const groupB = groupLabel(groupKeyForModule(b, moduleById), modules, moduleByCode, t);
      return groupA.localeCompare(groupB) || translatedModuleName(a, t).localeCompare(translatedModuleName(b, t));
    }),
    [filteredModules, moduleByCode, moduleById, modules, t],
  );
  const visiblePermissions = useMemo(
    () => permissionListForModules(visibleModules),
    [visibleModules],
  );
  const visibleSelectedCount = visiblePermissions.filter((permission) => selected.has(permission)).length;
  const visibleComplete = visiblePermissions.length > 0 && visiblePermissions.every((permission) => selected.has(permission));

  const actionColumns = useMemo(() => {
    const preferred = ['read', 'create', 'update', 'delete'];
    const actions = Array.from(new Set(visibleModules.flatMap((module) => (module.permissions ?? []).map(permissionAction))));
    return [
      ...preferred.filter((action) => actions.includes(action)),
      ...actions.filter((action) => !preferred.includes(action)).sort(),
    ];
  }, [visibleModules]);
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

  function applyVisiblePermissions(mode: 'all' | 'read' | 'clear') {
    const next = new Set(selected);
    if (mode === 'clear') {
      visiblePermissions.forEach((permission) => next.delete(permission));
    } else if (mode === 'read') {
      visiblePermissions.forEach((permission) => next.delete(permission));
      visibleModules.forEach((module) => {
        (module.permissions ?? [])
          .filter((permission) => permissionAction(permission) === 'read')
          .forEach((permission) => next.add(permission));
      });
    } else {
      visiblePermissions.forEach((permission) => next.add(permission));
    }
    setPermissions(next);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
          <Badge variant="outline">{t('rbms.modulesSelected', { selected: selectedModuleCount, total: modules.length })}</Badge>
          {selectedCount > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={clearAll}>
              <X className="me-2 h-4 w-4" />
              {t('rbms.clearAll')}
            </Button>
          )}
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
        {moduleTypeOptions.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={moduleType === option.key ? 'default' : 'outline'}
            onClick={() => setModuleType(option.key)}
          >
            {moduleTypeLabel(option.key, t)}
            <Badge className="ms-2" variant={moduleType === option.key ? 'secondary' : 'outline'}>{option.count}</Badge>
          </Button>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(14rem,18rem)_1fr]">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 ps-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('rbms.searchPermissions')}
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
            <button
              type="button"
              className={[
                'flex w-full items-center justify-between rounded px-2.5 py-2 text-sm transition-colors',
                group === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              ].join(' ')}
              onClick={() => setGroup('all')}
            >
              <span>{t('rbms.allModules')}</span>
              <Badge variant={group === 'all' ? 'secondary' : 'outline'}>{modules.length}</Badge>
            </button>
            <button
              type="button"
              className={[
                'flex w-full items-center justify-between rounded px-2.5 py-2 text-sm transition-colors',
                group === 'selected' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              ].join(' ')}
              onClick={() => setGroup('selected')}
            >
              <span>{t('rbms.selectedModules')}</span>
              <Badge variant={group === 'selected' ? 'secondary' : 'outline'}>{selectedModuleCount}</Badge>
            </button>
            {groupOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={[
                  'flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-start text-sm transition-colors',
                  group === option.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                ].join(' ')}
                onClick={() => setGroup(option.key)}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                <span className="shrink-0 text-xs opacity-80">{option.selected}/{option.total}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 rounded-md border bg-background p-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{visibleModules.length}</span> {t('rbms.modulesShown')}
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{visibleSelectedCount}</span> {t('rbms.permissionsInView')}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Button type="button" size="sm" variant={visibleComplete ? 'default' : 'outline'} onClick={() => applyVisiblePermissions('all')} disabled={visiblePermissions.length === 0}>
                <Check className="me-2 h-4 w-4" />
                {t('rbms.allowVisible')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyVisiblePermissions('read')} disabled={visiblePermissions.length === 0}>
                {t('rbms.readOnlyVisible')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyVisiblePermissions('clear')} disabled={visiblePermissions.length === 0}>
                {t('rbms.clearVisible')}
              </Button>
            </div>
          </div>

          {modulesQuery.isLoading || schemasLoading ? (
            <div className="flex items-center justify-center rounded-md border bg-background py-8 text-sm text-muted-foreground">
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('rbms.loadingModules')}
            </div>
          ) : visibleModules.length === 0 ? (
            <div className="rounded-md border bg-background px-3 py-10 text-center text-sm text-muted-foreground">
              {t('rbms.noModulePermissions')}
            </div>
          ) : (
            <div className="max-h-[34rem] space-y-2 overflow-y-auto pe-1">
              {visibleModules.map((module) => {
                const modulePermissions = module.permissions ?? [];
                const moduleSelected = modulePermissions.filter((permission) => selected.has(permission)).length;
                const isExpanded = expanded[module.id] ?? moduleSelected > 0;
                const moduleComplete = moduleSelected === modulePermissions.length;
                const moduleLabel = translatedModuleName(module, t);
                const resource = permissionResource(modulePermissions[0] ?? module.code);
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
                          <span className="block truncate text-xs text-muted-foreground">{resource} - {module.route}</span>
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
                      <div className="grid gap-2 border-t p-3 sm:grid-cols-2 xl:grid-cols-4">
                        {actionColumns.map((action) => {
                          const permission = modulePermissions.find((item) => permissionAction(item) === action);
                          if (!permission) {
                            return (
                              <div key={action} className="h-9 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                                {actionLabel(action, t)}
                              </div>
                            );
                          }
                          const active = selected.has(permission);
                          return (
                            <button
                              key={permission}
                              type="button"
                              className={[
                                'inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
                                active
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              ].join(' ')}
                              onClick={() => togglePermission(permission)}
                            >
                              {active && <Check className="me-1.5 h-3.5 w-3.5" />}
                              {actionLabel(action, t)}
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
        </div>
      </div>

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
              ) : field.type === 'boolean' ? (
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(fieldValue === '' || fieldValue === undefined ? true : fieldValue)}
                  onChange={(event) => setField(field.name, event.target.value)}
                  required={field.required}
                >
                  <option value="true">{t('users.active')}</option>
                  <option value="false">{t('users.inactive')}</option>
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
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [columnSort, setColumnSort] = useState<ColumnSort>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const { rowsPerPage } = usePaginationSettings();

  const canRead = !config.permissions?.read || canAny(config.permissions.read);
  const canCreate = !config.permissions?.create || canAny(config.permissions.create);
  const canUpdate = !config.permissions?.update || canAny(config.permissions.update);
  const canDelete = !config.permissions?.delete || canAny(config.permissions.delete);
  const queryKey = queryKeyForAuthMasterEndpoint(config.endpoint);

  const query = useQuery<Record<string, unknown>[]>({
    queryKey,
    queryFn: queryFnForAuthMasterEndpoint(config.endpoint),
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
  const visibleRows = useMemo(() => {
    const filtered = applyColumnFilters(rows, columnFilters, (row, key) => row[key]);
    return applyColumnSort(filtered, columnSort, (row, key) => row[key]);
  }, [columnFilters, columnSort, rows]);
  const filterCount = activeFilterCount(columnFilters);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return visibleRows.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, visibleRows]);

  useEffect(() => {
    setPage(1);
  }, [columnFilters, columnSort, rowsPerPage, search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [page, visibleRows.length, rowsPerPage]);

  useEffect(() => {
    if (!creating && !editing) return;
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [creating, editing]);

  function upsertCachedRow(nextRow: Record<string, unknown>) {
    qc.setQueryData<Record<string, unknown>[]>(queryKey, (current = []) => {
      const rowId = String(nextRow[idField] ?? '');
      if (!rowId) return current;
      const index = current.findIndex((item) => String(item[idField]) === rowId);
      if (index === -1) return [...current, nextRow];
      return current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...nextRow } : item));
    });
  }

  function removeCachedRow(rowId: string) {
    qc.setQueryData<Record<string, unknown>[]>(queryKey, (current = []) =>
      current.filter((item) => String(item[idField]) !== rowId),
    );
  }

  async function invalidateTableQueries() {
    await qc.invalidateQueries({ queryKey });
    if (config.endpoint === '/auth/master/modules') {
      await qc.invalidateQueries({ queryKey: authMasterKeys.modules });
    }
  }

  async function save(row: Record<string, unknown> | null, body: Record<string, unknown>) {
    if ((row && !canUpdate) || (!row && !canCreate)) return;
    setSaving(true);
    try {
      const response = row
        ? await updateMut.mutateAsync({ id: String(row[idField]), body })
        : await createMut.mutateAsync(body);
      const saved = responseData(response);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        upsertCachedRow(saved as Record<string, unknown>);
      }
      await invalidateTableQueries();
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
      const rowId = String(row[idField]);
      await deleteMut.mutateAsync(rowId);
      removeCachedRow(rowId);
      await invalidateTableQueries();
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

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="ps-8" placeholder={t('rbms.searchTitle', { title: config.title.toLowerCase() })} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {filterCount > 0 && (
            <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setColumnFilters({})}>
              <X className="me-1 h-4 w-4" /> Clear {filterCount} filter{filterCount === 1 ? '' : 's'}
            </Button>
          )}
          {canCreate && (
            <Button size="sm" className="w-full sm:w-auto" onClick={() => { setCreating(true); setEditing(null); }}>
              <Plus className="me-1 h-4 w-4" /> {t('rbms.add')}
            </Button>
          )}
        </div>
      </div>

      {!canRead && (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          {t('common.notAllowedView', { name: config.title.toLowerCase() })}
        </div>
      )}

      {(creating || editing) && (
        <div ref={formRef} className="scroll-mt-20 rounded-lg ring-2 ring-primary/10">
          <EntityForm config={config} row={editing} saving={saving} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={(body) => save(editing, body)} />
        </div>
      )}

      {canRead && (
        <>
          <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
            <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span>{config.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {visibleRows.length} of {rows.length} loaded records
              </span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key} className="align-top px-4 py-3 text-start font-medium text-muted-foreground">
                      <ColumnHeader
                        label={t(`labels.${column.key}`, {}, column.label)}
                        filterValue={columnFilters[column.key] ?? ''}
                        sortDirection={columnSort?.key === column.key ? columnSort.direction : undefined}
                        onFilterChange={(value) => setColumnFilters((current) => ({ ...current, [column.key]: value }))}
                        onSort={() => setColumnSort((current) => nextSort(current, column.key))}
                      />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading && <tr><td className="py-8 text-center" colSpan={config.columns.length + 1}><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>}
                {!query.isLoading && rows.length === 0 && <tr><td className="py-8 text-center text-muted-foreground" colSpan={config.columns.length + 1}>{t('common.noRecords')}</td></tr>}
                {!query.isLoading && rows.length > 0 && visibleRows.length === 0 && <tr><td className="py-8 text-center text-muted-foreground" colSpan={config.columns.length + 1}>No records match the active filters</td></tr>}
                {!query.isLoading && pagedRows.map((row) => (
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
          </div>

          <div className="space-y-3 md:hidden">
            {query.isLoading && (
              <div className="rounded-md border bg-card py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!query.isLoading && visibleRows.length === 0 && (
              <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                {t('common.noRecords')}
              </div>
            )}
            {!query.isLoading && pagedRows.map((row) => (
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

          <PaginationControls page={page} pageSize={rowsPerPage} total={visibleRows.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export function ActiveBadge({ row }: { row: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <Badge variant={row.isActive === false ? 'secondary' : 'success'}>{row.isActive === false ? t('users.inactive') : t('users.active')}</Badge>;
}
