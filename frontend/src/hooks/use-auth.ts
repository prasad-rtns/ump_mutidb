'use client';
import { useAuthStore, hasPermission, hasRole } from '@/stores/auth.store';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    setAuth,
    logout: clearAuth,
    updateUser,
    can: (resource: string, action: string) => hasPermission(user, resource, action),
    isRole: (...slugs: string[]) => hasRole(user, ...slugs),
  };
}
