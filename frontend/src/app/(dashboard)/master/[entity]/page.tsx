'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/lib/api';
import { useEntitySchema } from '@/hooks/use-schema';
import { EntityPage } from '@/components/entity-page/entity-page';
import type { ICountry, IState } from '@/types';

interface Props { params: Promise<{ entity: string }> }

// Build select options for FK fields (states need countries, cities need states, etc.)
function useSelectOptions(entity: string) {
  const needsCountries = entity === 'states';
  const needsStates    = entity === 'cities';
  const needsParent    = entity === 'categories';

  const { data: countries } = useQuery<ICountry[]>({
    queryKey: ['master','countries','select'],
    queryFn: async () => (await masterApi.get('/master/countries')).data.data,
    enabled: needsCountries,
  });
  const { data: states } = useQuery<IState[]>({
    queryKey: ['master','states','select'],
    queryFn: async () => (await masterApi.get('/master/states')).data.data,
    enabled: needsStates,
  });
  const { data: categories } = useQuery<{ id:string; name:string }[]>({
    queryKey: ['master','categories','select'],
    queryFn: async () => (await masterApi.get('/master/categories')).data.data,
    enabled: needsParent,
  });

  return {
    countryId:  countries?.map((c) => ({ value: c.id, label: `${c.flag ?? ''} ${c.name}` })) ?? [],
    stateId:    states?.map((s)    => ({ value: s.id, label: s.name })) ?? [],
    parentId:   [{ value: '', label: 'None (root)' }, ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? [])],
  };
}

export default function MasterEntityPage({ params }: Props) {
  const { entity } = use(params);
  const selectOptions = useSelectOptions(entity);
  const { data: schema } = useEntitySchema(entity);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{schema?.pluralLabel ?? entity}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage {schema?.pluralLabel?.toLowerCase() ?? entity}
        </p>
      </div>
      <EntityPage entity={entity} selectOptions={selectOptions} />
    </div>
  );
}
