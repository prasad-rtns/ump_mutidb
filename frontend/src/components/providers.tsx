'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/i18n';
import { usePublicSettings } from '@/hooks/use-public-settings';

function SettingsBootstrap() {
  usePublicSettings();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } } }),
  );

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsBootstrap />
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
