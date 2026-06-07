'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language/language-switcher';
import { authApi } from '@/lib/api';
import { useTranslation } from '@/i18n';
import type { IUser } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated, user, updateUser } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const { direction, t } = useTranslation();

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
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar className="sticky top-0" />
      </div>

      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('layout.openNavigation')}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t('app.name')}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="ms-auto">
          <LanguageSwitcher compact />
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('layout.closeNavigation')}
            onClick={() => setMobileNavOpen(false)}
          />
          <div className={`relative h-full w-[min(20rem,calc(100vw-3rem))] shadow-xl ${direction === 'rtl' ? 'ms-auto' : ''}`}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute end-2 top-2 z-10 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t('layout.closeNavigation')}
            >
              <X className="h-5 w-5" />
            </Button>
            <Sidebar className="w-full" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-4 pt-20 sm:p-6 md:pt-6">{children}</div>
      </main>
    </div>
  );
}
