import { UserTable } from '@/components/users/user-table';

export default function ExternalUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">External Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage external users with RBAC access to services</p>
      </div>
      <UserTable category="external" title="External" />
    </div>
  );
}
