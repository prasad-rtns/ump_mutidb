'use client';
import { UserTable } from '@/components/users/user-table';
import { useTranslation } from '@/i18n';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('users.adminTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('users.adminDescription')}</p>
      </div>
      <UserTable category="admin" title={t('users.admin')} />
    </div>
  );
}
