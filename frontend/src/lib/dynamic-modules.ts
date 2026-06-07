import type { EntityMeta, IModuleMenu, SchemaCatalogue } from '@/types';

const MASTER_PARENT_CODE = 'master-data';
const MASTER_PARENT_ID = 'virtual-master-data';

function masterEntityPermissions(entity: string) {
  return [`${entity}:read`, `${entity}:create`, `${entity}:update`, `${entity}:delete`];
}

function virtualMasterParent(): IModuleMenu {
  return {
    id: MASTER_PARENT_ID,
    name: 'Master Data',
    code: MASTER_PARENT_CODE,
    route: '#',
    icon: 'database',
    parentId: null,
    sortOrder: 20,
    permissions: ['master:read'],
    isActive: true,
  };
}

function virtualMasterModule(entity: string, meta: EntityMeta, parentId: string, sortOrder: number): IModuleMenu {
  return {
    id: `virtual-master-${entity}`,
    name: meta.pluralLabel || meta.label || entity,
    code: entity,
    route: `/master/${entity}`,
    icon: meta.icon || 'layers',
    parentId,
    sortOrder,
    permissions: masterEntityPermissions(entity),
    isActive: true,
  };
}

export function mergeModulesWithMasterSchema(modules: IModuleMenu[], schemas?: SchemaCatalogue): IModuleMenu[] {
  if (!schemas) return modules;

  const next = [...modules];
  const codeSet = new Set(next.map((module) => module.code));
  let masterParent = next.find((module) => module.code === MASTER_PARENT_CODE || module.code === 'master');

  if (!masterParent) {
    masterParent = virtualMasterParent();
    next.push(masterParent);
    codeSet.add(masterParent.code);
  }

  let sortOrder = Math.max(
    0,
    ...next.filter((module) => module.parentId === masterParent.id).map((module) => Number(module.sortOrder) || 0),
  );

  Object.entries(schemas).forEach(([entity, meta]) => {
    if (codeSet.has(entity)) return;
    sortOrder += 10;
    next.push(virtualMasterModule(entity, meta, masterParent.id, sortOrder));
    codeSet.add(entity);
  });

  return next;
}

export function permissionListForModules(modules: IModuleMenu[]) {
  return Array.from(new Set(modules.flatMap((module) => module.permissions ?? []))).sort();
}
