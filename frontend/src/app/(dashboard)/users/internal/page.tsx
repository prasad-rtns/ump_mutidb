import { UserTable } from '@/components/users/user-table';

export default function InternalUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Internal Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage internal staff with RBAC access to services</p>
      </div>
      <UserTable category="internal" title="Internal" />
    </div>
  );
}
