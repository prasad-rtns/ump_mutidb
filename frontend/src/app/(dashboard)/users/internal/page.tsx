'use client';
import { UserTable } from '@/components/users/user-table';
import { useTranslation } from '@/i18n';

export default function InternalUsersPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('users.internalTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('users.internalDescription')}</p>
      </div>
      <UserTable category="internal" title={t('users.internal')} />
    </div>
  );
}
