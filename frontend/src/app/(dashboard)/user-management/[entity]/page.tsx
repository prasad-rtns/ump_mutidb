'use client';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { ActiveBadge, RbmsConfig, RbmsTable } from '@/components/user-management/rbms-table';
import { Badge } from '@/components/ui/badge';
import type { IDepartment, IModuleMenu } from '@/types';
import { useTranslation } from '@/i18n';
import { translatedModuleName } from '@/lib/module-translations';

interface Props { params: { entity: string } }

function text(key: string, label: string) {
  return { key, label };
}

type TranslationParams = Record<string, string | number | null | undefined>;

function permissionSummary(row: Record<string, unknown>, t: (key: string, params?: TranslationParams, fallback?: string) => string) {
  const permissions = Array.isArray(row.permissions) ? row.permissions : [];
  if (permissions.length === 0) return <span className="text-muted-foreground">{t('userManagement.noPermissions')}</span>;

  const modules = new Set(permissions.map((permission) => String(permission).split(':')[0]).filter(Boolean));
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">{t('userManagement.permissionsCount', { count: permissions.length })}</Badge>
      <Badge variant="outline">{t('userManagement.modulesCount', { count: modules.size })}</Badge>
    </div>
  );
}

export default function UserManagementEntityPage({ params }: Props) {
  const { entity } = params;
  const { t } = useTranslation();
  const { data: departments } = useQuery<IDepartment[]>({
    queryKey: ['um', 'departments', 'select'],
    queryFn: async () => (await authApi.get('/auth/master/departments')).data.data,
    enabled: entity === 'designations',
  });
  const { data: modules } = useQuery<IModuleMenu[]>({
    queryKey: ['um', 'modules', 'select'],
    queryFn: async () => (await authApi.get('/auth/master/modules')).data.data,
    enabled: entity === 'modules',
  });

  const configs: Record<string, RbmsConfig> = {
    roles: {
      title: t('userManagement.rolesTitle'),
      description: t('userManagement.rolesDescription'),
      endpoint: '/auth/master/roles',
      permissions: {
        read: ['roles:*', 'roles:read'],
        create: ['roles:*', 'roles:create'],
        update: ['roles:*', 'roles:update'],
        delete: ['roles:*', 'roles:delete'],
      },
      columns: [
        text('name', t('labels.role')),
        text('slug', t('labels.slug')),
        { key: 'permissions', label: t('labels.access'), render: (row) => permissionSummary(row, t) },
        { key: 'isActive', label: t('labels.status'), render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: t('labels.roleName'), required: true },
        { name: 'slug', label: t('labels.slug'), required: true, placeholder: 'admin, manager, reviewer' },
        { name: 'description', label: t('labels.description'), type: 'textarea' },
        { name: 'permissions', label: t('labels.permissions'), type: 'permissions', permissionMode: 'module-selector' },
      ],
    },
    companies: {
      title: t('userManagement.companiesTitle'),
      description: t('userManagement.companiesDescription'),
      endpoint: '/auth/master/companies',
      permissions: {
        read: ['companies:*', 'companies:read'],
        create: ['companies:*', 'companies:create'],
        update: ['companies:*', 'companies:update'],
        delete: ['companies:*', 'companies:delete'],
      },
      columns: [
        text('name', t('labels.name')),
        text('code', t('labels.code')),
        text('type', t('labels.type')),
        { key: 'isActive', label: t('labels.status'), render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: t('labels.name'), required: true },
        { name: 'code', label: t('labels.code'), required: true },
        { name: 'type', label: t('labels.type'), type: 'select', required: true, options: [{ value: 'company', label: t('users.company') }, { value: 'utility', label: t('labels.utility') }] },
        { name: 'description', label: t('labels.description'), type: 'textarea' },
      ],
    },
    departments: {
      title: t('userManagement.departmentsTitle'),
      description: t('userManagement.departmentsDescription'),
      endpoint: '/auth/master/departments',
      permissions: {
        read: ['departments:*', 'departments:read'],
        create: ['departments:*', 'departments:create'],
        update: ['departments:*', 'departments:update'],
        delete: ['departments:*', 'departments:delete'],
      },
      columns: [text('name', t('labels.name')), text('code', t('labels.code')), text('description', t('labels.description')), { key: 'isActive', label: t('labels.status'), render: (row) => <ActiveBadge row={row} /> }],
      fields: [
        { name: 'name', label: t('labels.departmentName'), required: true },
        { name: 'code', label: t('labels.code'), required: true },
        { name: 'description', label: t('labels.description'), type: 'textarea' },
      ],
    },
    designations: {
      title: t('userManagement.designationsTitle'),
      description: t('userManagement.designationsDescription'),
      endpoint: '/auth/master/designations',
      permissions: {
        read: ['designations:*', 'designations:read'],
        create: ['designations:*', 'designations:create'],
        update: ['designations:*', 'designations:update'],
        delete: ['designations:*', 'designations:delete'],
      },
      columns: [text('name', t('labels.name')), text('code', t('labels.code')), text('level', t('labels.level')), { key: 'isActive', label: t('labels.status'), render: (row) => <ActiveBadge row={row} /> }],
      fields: [
        { name: 'name', label: t('labels.designationName'), required: true },
        { name: 'code', label: t('labels.code'), required: true },
        { name: 'departmentId', label: t('labels.department'), type: 'select', required: true, options: departments?.map((d) => ({ value: d.id, label: d.name })) ?? [] },
        { name: 'level', label: t('labels.level'), type: 'number' },
        { name: 'description', label: t('labels.description'), type: 'textarea' },
      ],
    },
    modules: {
      title: t('userManagement.modulesTitle'),
      description: t('userManagement.modulesDescription'),
      endpoint: '/auth/master/modules',
      permissions: {
        read: ['modules:*', 'modules:read'],
        create: ['modules:*', 'modules:create'],
        update: ['modules:*', 'modules:update'],
        delete: ['modules:*', 'modules:delete'],
      },
      columns: [
        { key: 'name', label: t('labels.name'), render: (row) => translatedModuleName({ code: String(row.code ?? ''), name: String(row.name ?? '') }, t) },
        text('code', t('labels.code')),
        text('route', t('labels.route')),
        { key: 'permissions', label: t('labels.permissions'), render: (row) => Array.isArray(row.permissions) ? row.permissions.join(', ') : '' },
        { key: 'isActive', label: t('labels.status'), render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: t('labels.moduleName'), required: true },
        { name: 'code', label: t('labels.code'), required: true },
        { name: 'route', label: t('labels.route'), required: true, placeholder: '/user-management/roles' },
        { name: 'icon', label: t('labels.icon') },
        { name: 'parentId', label: t('labels.parentModule'), type: 'select', options: modules?.map((m) => ({ value: m.id, label: translatedModuleName(m, t) })) ?? [] },
        { name: 'sortOrder', label: t('labels.sortOrder'), type: 'number' },
        { name: 'permissions', label: t('labels.permissions'), type: 'permissions', placeholder: 'modules:read\nmodules:create\nmodules:update\nmodules:delete' },
      ],
    },
  };

  const config = configs[entity];
  if (!config) return <div className="p-8 text-center text-muted-foreground">{t('userManagement.sectionNotFound')}</div>;
  return <RbmsTable config={config} />;
}
