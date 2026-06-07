import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { IUser } from '@/types';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: IUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set('access_token', accessToken, { expires: 1, sameSite: 'strict' });
        Cookies.set('refresh_token', refreshToken, { expires: 7, sameSite: 'strict' });
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
    }),
    {
      name: 'ump-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function permissionList(user: IUser | null): string[] {
  const permissions = user?.role?.permissions;
  if (!permissions) return [];

  if (Array.isArray(permissions)) {
    return permissions.map(String).filter(Boolean);
  }

  return Object.entries(permissions).flatMap(([resource, actions]) =>
    Array.isArray(actions) ? actions.map((action) => `${resource}:${action}`) : [],
  );
}

function normalizePermission(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function splitPermission(value: string): [string, string] {
  const [resource = '', action = ''] = normalizePermission(value).split(':');
  return [resource, action];
}

function permissionMatches(actual: string, required: string) {
  const [actualResource, actualAction] = splitPermission(actual);
  const [requiredResource, requiredAction] = splitPermission(required);

  if (!actualResource || !requiredResource) return false;
  if (actualResource === '*' || actual === '*') return true;
  if (actualResource !== requiredResource) return false;
  return actualAction === '*' || actualAction === requiredAction;
}

function isElevatedRole(user: IUser | null) {
  const slug = normalizePermission(user?.role?.slug ?? '');
  const name = normalizePermission(user?.role?.name ?? '');
  return ['admin', 'super-admin', 'super-admin-user', 'super-user'].includes(slug) || ['admin', 'administrator', 'super-admin', 'super-user'].includes(name);
}

// Derived permission check
export function hasPermission(user: IUser | null, resource: string, action: string): boolean {
  if (isElevatedRole(user)) return true;
  const required = `${resource}:${action}`;
  return permissionList(user).some((permission) => permissionMatches(permission, required));
}

export function hasAnyPermission(user: IUser | null, required: string[]): boolean {
  if (isElevatedRole(user)) return true;
  const permissions = permissionList(user);
  return required.some((requirement) => permissions.some((permission) => permissionMatches(permission, requirement)));
}

export function hasRole(user: IUser | null, ...slugs: string[]): boolean {
  return slugs.includes(user?.role?.slug ?? '');
}
