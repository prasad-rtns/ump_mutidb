'use client';
import { Languages } from 'lucide-react';
import { useTranslation, type Language } from '@/i18n';

const OPTIONS: Array<{ value: Language; key: string }> = [
  { value: 'en', key: 'language.english' },
  { value: 'nl', key: 'language.dutch' },
  { value: 'ar', key: 'language.arabic' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Languages className="h-4 w-4 shrink-0" />
      {!compact && <span>{t('language.label')}</span>}
      <select
        aria-label={t('language.label')}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{t(option.key)}</option>
        ))}
      </select>
    </label>
  );
}
