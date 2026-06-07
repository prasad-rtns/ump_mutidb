'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/lib/api';
import { useEntitySchema, useSchemaCatalogue } from '@/hooks/use-schema';
import { EntityPage } from '@/components/entity-page/entity-page';
import { useTranslation } from '@/i18n';
import type { EntityMeta } from '@/types';

interface Props { params: { entity: string } }

function masterProxyPath(apiEndpoint: string) {
  return apiEndpoint.replace('/api/v1', '');
}

function singularize(value: string) {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('s')) return value.slice(0, -1);
  return value;
}

function entityForSelectField(fieldName: string, currentEntity: string, schemas: Record<string, EntityMeta>) {
  if (fieldName === 'parentId') return currentEntity;
  if (!fieldName.endsWith('Id')) return '';

  const base = fieldName.slice(0, -2).toLowerCase();
  const match = Object.keys(schemas).find((entity) => singularize(entity).toLowerCase() === base || entity.toLowerCase() === base);
  return match ?? '';
}

function optionLabel(row: Record<string, unknown>) {
  const flag = typeof row.flag === 'string' ? row.flag : '';
  const name = typeof row.name === 'string' ? row.name : '';
  const code = typeof row.code === 'string' ? row.code : '';
  const label = [flag, name || code].filter(Boolean).join(' ').trim();
  return label || String(row.id ?? row.key ?? '');
}

function useSelectOptions(entity: string, schema?: EntityMeta) {
  const { data: schemas = {} } = useSchemaCatalogue();
  const { t } = useTranslation();
  const selectSources = useMemo(() => {
    if (!schema) return [];
    return Array.from(new Set(
      schema.fields
        .filter((field) => field.type === 'select' && !field.options?.length)
        .map((field) => entityForSelectField(field.name, entity, schemas))
        .filter(Boolean),
    ));
  }, [entity, schema, schemas]);

  const query = useQuery<Record<string, Record<string, unknown>[]>>({
    queryKey: ['master', entity, 'dynamic-select-options', selectSources],
    queryFn: async () => {
      const entries = await Promise.all(selectSources.map(async (source) => {
        const sourceSchema = schemas[source];
        const endpoint = sourceSchema?.apiEndpoint ?? `/api/v1/master/${source}`;
        const { data } = await masterApi.get(masterProxyPath(endpoint));
        const payload = data.data;
        const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
        return [source, rows] as const;
      }));
      return Object.fromEntries(entries);
    },
    enabled: selectSources.length > 0,
  });

  return useMemo(() => {
    if (!schema) return {};
    const rowsBySource = query.data ?? {};
    return Object.fromEntries(schema.fields
      .filter((field) => field.type === 'select')
      .map((field) => {
        if (field.options?.length) return [field.name, field.options];
        const source = entityForSelectField(field.name, entity, schemas);
        const rows = rowsBySource[source] ?? [];
        const options = rows.map((row) => ({ value: String(row.id ?? row.key ?? ''), label: optionLabel(row) }));
        return field.name === 'parentId'
          ? [field.name, [{ value: '', label: t('common.noneRoot') }, ...options]]
          : [field.name, options];
      }));
  }, [entity, query.data, schema, schemas, t]);
}

export default function MasterEntityPage({ params }: Props) {
  const { entity } = params;
  const { t } = useTranslation();
  const { data: schema } = useEntitySchema(entity);
  const selectOptions = useSelectOptions(entity, schema);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{schema?.pluralLabel ?? entity}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('common.manageName', { name: schema?.pluralLabel?.toLowerCase() ?? entity })}
        </p>
      </div>
      <EntityPage entity={entity} selectOptions={selectOptions} />
    </div>
  );
}
