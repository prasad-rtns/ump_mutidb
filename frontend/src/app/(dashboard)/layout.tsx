'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { authApi } from '@/lib/api';
import type { IUser } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    let cancelled = false;
    authApi.get('/auth/me')
      .then(({ data }) => {
        if (!cancelled && data?.data) updateUser(data.data as IUser);
      })
      .catch(() => {
        // The axios interceptor handles expired sessions by redirecting to login.
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, updateUser]);

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
