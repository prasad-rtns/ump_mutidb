'use client';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { IDepartment, IModuleMenu } from '@/types';

export const authMasterKeys = {
  modules: ['auth-master', 'modules'] as const,
  allModules: ['auth-master', 'modules', 'all'] as const,
  departments: ['auth-master', 'departments'] as const,
  endpoint: (endpoint: string) => ['auth-master', endpoint] as const,
};

export async function fetchAuthMasterModules(activeOnly = true) {
  const suffix = activeOnly ? '' : '?activeOnly=false';
  return (await authApi.get(`/auth/master/modules${suffix}`)).data.data as IModuleMenu[];
}

export async function fetchAuthMasterDepartments() {
  return (await authApi.get('/auth/master/departments')).data.data as IDepartment[];
}

export function queryKeyForAuthMasterEndpoint(endpoint: string) {
  if (endpoint === '/auth/master/modules') return authMasterKeys.allModules;
  if (endpoint === '/auth/master/departments') return authMasterKeys.departments;
  return authMasterKeys.endpoint(endpoint);
}

export function queryFnForAuthMasterEndpoint(endpoint: string) {
  if (endpoint === '/auth/master/modules') return async () => (await fetchAuthMasterModules(false)) as unknown as Record<string, unknown>[];
  if (endpoint === '/auth/master/departments') return async () => (await fetchAuthMasterDepartments()) as unknown as Record<string, unknown>[];
  return async () => (await authApi.get(endpoint)).data.data as Record<string, unknown>[];
}

export function useAuthMasterModules(enabled = true): UseQueryResult<IModuleMenu[]> {
  return useQuery<IModuleMenu[]>({
    queryKey: authMasterKeys.modules,
    queryFn: () => fetchAuthMasterModules(true),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuthMasterDepartments(enabled = true): UseQueryResult<IDepartment[]> {
  return useQuery<IDepartment[]>({
    queryKey: authMasterKeys.departments,
    queryFn: fetchAuthMasterDepartments,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
