'use client';
import { UserTable } from '@/components/users/user-table';
import { useTranslation } from '@/i18n';

export default function ExternalUsersPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('users.externalTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('users.externalDescription')}</p>
      </div>
      <UserTable category="external" title={t('users.external')} />
    </div>
  );
}
