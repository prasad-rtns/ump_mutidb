'use client';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { IDepartment, IModuleMenu } from '@/types';

export const authMasterKeys = {
  modules: ['auth-master', 'modules'] as const,
  departments: ['auth-master', 'departments'] as const,
  endpoint: (endpoint: string) => ['auth-master', endpoint] as const,
};

export async function fetchAuthMasterModules() {
  return (await authApi.get('/auth/master/modules')).data.data as IModuleMenu[];
}

export async function fetchAuthMasterDepartments() {
  return (await authApi.get('/auth/master/departments')).data.data as IDepartment[];
}

export function queryKeyForAuthMasterEndpoint(endpoint: string) {
  if (endpoint === '/auth/master/modules') return authMasterKeys.modules;
  if (endpoint === '/auth/master/departments') return authMasterKeys.departments;
  return authMasterKeys.endpoint(endpoint);
}

export function queryFnForAuthMasterEndpoint(endpoint: string) {
  if (endpoint === '/auth/master/modules') return async () => (await fetchAuthMasterModules()) as unknown as Record<string, unknown>[];
  if (endpoint === '/auth/master/departments') return async () => (await fetchAuthMasterDepartments()) as unknown as Record<string, unknown>[];
  return async () => (await authApi.get(endpoint)).data.data as Record<string, unknown>[];
}

export function useAuthMasterModules(enabled = true) {
  return useQuery<IModuleMenu[]>({
    queryKey: authMasterKeys.modules,
    queryFn: fetchAuthMasterModules,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuthMasterDepartments(enabled = true) {
  return useQuery<IDepartment[]>({
    queryKey: authMasterKeys.departments,
    queryFn: fetchAuthMasterDepartments,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
