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

// Derived permission check
export function hasPermission(user: IUser | null, resource: string, action: string): boolean {
  if (!user?.role?.permissions) return false;
  const actions = user.role.permissions[resource] ?? [];
  return actions.includes(action);
}

export function hasRole(user: IUser | null, ...slugs: string[]): boolean {
  return slugs.includes(user?.role?.slug ?? '');
}
