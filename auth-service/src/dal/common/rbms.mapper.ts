import { ICompanyOrUtility, IModuleMenu } from '../../modules/master/master.types';

export const boolFromDb = (value: unknown) => value === true || value === 1 || value === '1';

export const parsePermissions = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const mapCompanyRow = (row: Record<string, unknown>): ICompanyOrUtility => ({
  id: (row.id ?? row.ID) as string,
  name: (row.name ?? row.NAME) as string,
  code: (row.code ?? row.CODE) as string,
  type: (row.type ?? row.TYPE ?? 'company') as ICompanyOrUtility['type'],
  description: (row.description ?? row.DESCRIPTION ?? null) as string | null,
  isActive: boolFromDb(row.isActive ?? row.is_active ?? row.IS_ACTIVE),
  createdAt: (row.createdAt ?? row.created_at ?? row.CREATED_AT) as Date,
  updatedAt: (row.updatedAt ?? row.updated_at ?? row.UPDATED_AT) as Date,
});

export const mapModuleRow = (row: Record<string, unknown>): IModuleMenu => ({
  id: (row.id ?? row.ID) as string,
  name: (row.name ?? row.NAME) as string,
  code: (row.code ?? row.CODE) as string,
  route: (row.route ?? row.ROUTE ?? '') as string,
  icon: (row.icon ?? row.ICON ?? null) as string | null,
  parentId: (row.parentId ?? row.parent_id ?? row.PARENT_ID ?? null) as string | null,
  sortOrder: Number(row.sortOrder ?? row.sort_order ?? row.SORT_ORDER ?? 0),
  permissions: parsePermissions(row.permissions ?? row.PERMISSIONS),
  isActive: boolFromDb(row.isActive ?? row.is_active ?? row.IS_ACTIVE),
  createdAt: (row.createdAt ?? row.created_at ?? row.CREATED_AT) as Date,
  updatedAt: (row.updatedAt ?? row.updated_at ?? row.UPDATED_AT) as Date,
});
