'use client';
import { useAuthStore, hasAnyPermission, hasPermission, hasRole } from '@/stores/auth.store';

export function useAuth() {
  const { user, isAuthenticated, hasHydrated, setAuth, clearAuth, updateUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    hasHydrated,
    setAuth,
    logout: clearAuth,
    updateUser,
    can: (resource: string, action: string) => hasPermission(user, resource, action),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions),
    isRole: (...slugs: string[]) => hasRole(user, ...slugs),
  };
}
