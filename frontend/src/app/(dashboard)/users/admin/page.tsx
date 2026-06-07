import { UserTable } from '@/components/users/user-table';

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage admin users who handle master data</p>
      </div>
      <UserTable category="admin" title="Admin" />
    </div>
  );
}
