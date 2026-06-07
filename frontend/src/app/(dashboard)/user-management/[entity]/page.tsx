'use client';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { ActiveBadge, RbmsConfig, RbmsTable } from '@/components/user-management/rbms-table';
import { Badge } from '@/components/ui/badge';
import type { IDepartment, IModuleMenu } from '@/types';

interface Props { params: { entity: string } }

function text(key: string, label: string) {
  return { key, label };
}

function permissionSummary(row: Record<string, unknown>) {
  const permissions = Array.isArray(row.permissions) ? row.permissions : [];
  if (permissions.length === 0) return <span className="text-muted-foreground">No permissions</span>;

  const modules = new Set(permissions.map((permission) => String(permission).split(':')[0]).filter(Boolean));
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">{permissions.length} permissions</Badge>
      <Badge variant="outline">{modules.size} modules</Badge>
    </div>
  );
}

export default function UserManagementEntityPage({ params }: Props) {
  const { entity } = params;
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
      title: 'Role Management',
      description: 'Create roles and assign permission keys used by menus and actions.',
      endpoint: '/auth/master/roles',
      permissions: {
        read: ['roles:*', 'roles:read'],
        create: ['roles:*', 'roles:create'],
        update: ['roles:*', 'roles:update'],
        delete: ['roles:*', 'roles:delete'],
      },
      columns: [
        text('name', 'Role'),
        text('slug', 'Slug'),
        { key: 'permissions', label: 'Access', render: permissionSummary },
        { key: 'isActive', label: 'Status', render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: 'Role Name', required: true },
        { name: 'slug', label: 'Slug', required: true, placeholder: 'admin, manager, reviewer' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'permissions', label: 'Permissions', type: 'permissions', permissionMode: 'module-selector' },
      ],
    },
    companies: {
      title: 'Companies / Utilities',
      description: 'Manage company or utility entities that users belong to.',
      endpoint: '/auth/master/companies',
      permissions: {
        read: ['companies:*', 'companies:read'],
        create: ['companies:*', 'companies:create'],
        update: ['companies:*', 'companies:update'],
        delete: ['companies:*', 'companies:delete'],
      },
      columns: [
        text('name', 'Name'),
        text('code', 'Code'),
        text('type', 'Type'),
        { key: 'isActive', label: 'Status', render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'company', label: 'Company' }, { value: 'utility', label: 'Utility' }] },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    departments: {
      title: 'Departments',
      description: 'Manage departments used by users and workflow ownership.',
      endpoint: '/auth/master/departments',
      permissions: {
        read: ['departments:*', 'departments:read'],
        create: ['departments:*', 'departments:create'],
        update: ['departments:*', 'departments:update'],
        delete: ['departments:*', 'departments:delete'],
      },
      columns: [text('name', 'Name'), text('code', 'Code'), text('description', 'Description'), { key: 'isActive', label: 'Status', render: (row) => <ActiveBadge row={row} /> }],
      fields: [
        { name: 'name', label: 'Department Name', required: true },
        { name: 'code', label: 'Code', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    designations: {
      title: 'Designations',
      description: 'Manage role titles linked to departments.',
      endpoint: '/auth/master/designations',
      permissions: {
        read: ['designations:*', 'designations:read'],
        create: ['designations:*', 'designations:create'],
        update: ['designations:*', 'designations:update'],
        delete: ['designations:*', 'designations:delete'],
      },
      columns: [text('name', 'Name'), text('code', 'Code'), text('level', 'Level'), { key: 'isActive', label: 'Status', render: (row) => <ActiveBadge row={row} /> }],
      fields: [
        { name: 'name', label: 'Designation Name', required: true },
        { name: 'code', label: 'Code', required: true },
        { name: 'departmentId', label: 'Department', type: 'select', required: true, options: departments?.map((d) => ({ value: d.id, label: d.name })) ?? [] },
        { name: 'level', label: 'Level', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    modules: {
      title: 'Modules',
      description: 'Define menu modules and permission keys that can be assigned to roles.',
      endpoint: '/auth/master/modules',
      permissions: {
        read: ['modules:*', 'modules:read'],
        create: ['modules:*', 'modules:create'],
        update: ['modules:*', 'modules:update'],
        delete: ['modules:*', 'modules:delete'],
      },
      columns: [
        text('name', 'Name'),
        text('code', 'Code'),
        text('route', 'Route'),
        { key: 'permissions', label: 'Permissions', render: (row) => Array.isArray(row.permissions) ? row.permissions.join(', ') : '' },
        { key: 'isActive', label: 'Status', render: (row) => <ActiveBadge row={row} /> },
      ],
      fields: [
        { name: 'name', label: 'Module Name', required: true },
        { name: 'code', label: 'Code', required: true },
        { name: 'route', label: 'Route', required: true, placeholder: '/user-management/roles' },
        { name: 'icon', label: 'Icon' },
        { name: 'parentId', label: 'Parent Module', type: 'select', options: modules?.map((m) => ({ value: m.id, label: m.name })) ?? [] },
        { name: 'sortOrder', label: 'Sort Order', type: 'number' },
        { name: 'permissions', label: 'Permissions', type: 'permissions', placeholder: 'modules:read\nmodules:create\nmodules:update\nmodules:delete' },
      ],
    },
  };

  const config = configs[entity];
  if (!config) return <div className="p-8 text-center text-muted-foreground">User management section not found.</div>;
  return <RbmsTable config={config} />;
}
