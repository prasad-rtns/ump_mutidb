'use client';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border p-4 shadow-lg text-sm font-medium flex items-start gap-2 ${
            t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card text-card-foreground'
          }`}
        >
          <div className="flex-1">
            {t.title && <p className="font-semibold">{t.title}</p>}
            {t.description && <p className="text-xs mt-0.5 opacity-80">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
