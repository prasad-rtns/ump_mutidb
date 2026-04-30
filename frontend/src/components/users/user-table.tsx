'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/dynamic-form/dynamic-form';
import type { IUser, IDepartment, IRole, IDesignation, UserCategory, FieldMeta } from '@/types';

const USER_FIELDS: FieldMeta[] = [
  { name: 'firstName',    label: 'First Name',   type: 'text',    required: true  },
  { name: 'lastName',     label: 'Last Name',    type: 'text',    required: true  },
  { name: 'username',     label: 'Username',     type: 'text',    required: true  },
  { name: 'email',        label: 'Email',        type: 'email',   required: true  },
  { name: 'password',     label: 'Password',     type: 'text',    required: true  },
  { name: 'phone',        label: 'Phone',        type: 'text'                     },
  { name: 'roleId',       label: 'Role',         type: 'select',  required: true  },
  { name: 'departmentId', label: 'Department',   type: 'select',  required: true  },
  { name: 'designationId',label: 'Designation',  type: 'select',  required: true  },
  { name: 'status',       label: 'Status',       type: 'select',  default: 'active',
    options: [{ value:'active',label:'Active' },{ value:'inactive',label:'Inactive' },{ value:'suspended',label:'Suspended' }] },
];

const UPDATE_FIELDS: FieldMeta[] = USER_FIELDS.filter((f) => !['username','email','password'].includes(f.name));

interface Props { category: UserCategory; title: string }

const PAGE_SIZE = 20;

function statusVariant(status: string) {
  if (status === 'active')    return 'success' as const;
  if (status === 'suspended') return 'destructive' as const;
  return 'secondary' as const;
}

export function UserTable({ category, title }: Props) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]     = useState<IUser | null>(null);
  const [saving, setSaving]         = useState(false);

  const canManage = ['super_admin','admin'].includes(me?.role?.slug ?? '');

  const { data: roles }       = useQuery<IRole[]>({ queryKey: ['roles'],       queryFn: async () => (await authApi.get('/master/roles')).data.data });
  const { data: departments } = useQuery<IDepartment[]>({ queryKey: ['departments'], queryFn: async () => (await authApi.get('/master/departments')).data.data });
  const { data: designations } = useQuery<IDesignation[]>({ queryKey: ['designations'], queryFn: async () => (await authApi.get('/master/designations')).data.data });

  const { data, isLoading } = useQuery({
    queryKey: ['users', category, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), userCategory: category });
      if (search) params.set('search', search);
      const { data } = await authApi.get(`/users?${params}`);
      const payload = data.data;
      if (Array.isArray(payload)) return { users: payload as IUser[], total: payload.length };
      return { users: (payload.data ?? []) as IUser[], total: payload.total ?? 0 };
    },
  });

  const createMut = useMutation({ mutationFn: (body: Record<string,unknown>) => authApi.post('/auth/register', { ...body, userCategory: category }) });
  const updateMut = useMutation({ mutationFn: ({ id, body }: { id:string; body:Record<string,unknown> }) => authApi.put(`/users/${id}`, body) });
  const deleteMut = useMutation({ mutationFn: (id: string) => authApi.delete(`/users/${id}`) });
  const statusMut = useMutation({ mutationFn: ({ id, status }: { id:string; status:string }) => authApi.patch(`/users/${id}/status`, { status }) });

  function invalidate() { qc.invalidateQueries({ queryKey: ['users', category] }); }

  async function onCreate(values: Record<string,unknown>) {
    setSaving(true);
    try { await createMut.mutateAsync(values); invalidate(); toast({ title: 'User created' }); setShowCreate(false); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); throw e; }
    finally { setSaving(false); }
  }
  async function onUpdate(values: Record<string,unknown>) {
    if (!editUser) return;
    setSaving(true);
    try { await updateMut.mutateAsync({ id: editUser.id, body: values }); invalidate(); toast({ title: 'User updated' }); setEditUser(null); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); throw e; }
    finally { setSaving(false); }
  }
  async function onDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    try { await deleteMut.mutateAsync(id); invalidate(); toast({ title: 'User deleted' }); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); }
  }
  async function onToggleStatus(u: IUser) {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try { await statusMut.mutateAsync({ id: u.id, status: newStatus }); invalidate(); }
    catch (e) { toast({ title: 'Error', description: apiErrorMessage(e), variant: 'destructive' }); }
  }

  const selectOptions = {
    roleId:        roles?.map((r)       => ({ value: r.id, label: r.name })) ?? [],
    departmentId:  departments?.map((d) => ({ value: d.id, label: d.name })) ?? [],
    designationId: designations?.map((d)=> ({ value: d.id, label: d.name })) ?? [],
  };

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search users…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setShowCreate(true); setEditUser(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">New {title} User</h3>
          <DynamicForm fields={USER_FIELDS} onSubmit={onCreate} isLoading={saving}
            submitLabel="Create User" onCancel={() => setShowCreate(false)} selectOptions={selectOptions} />
        </div>
      )}

      {editUser && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-semibold mb-3">Edit User — {editUser.firstName} {editUser.lastName}</h3>
          <DynamicForm fields={UPDATE_FIELDS} defaultValues={editUser as unknown as Record<string,unknown>}
            onSubmit={onUpdate} isLoading={saving} submitLabel="Update" onCancel={() => setEditUser(null)} selectOptions={selectOptions} />
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Name','Username','Email','Role','Department','Status',''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </td></tr>
            )}
            {!isLoading && (data?.users ?? []).length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No users found.</td></tr>
            )}
            {!isLoading && (data?.users ?? []).map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-muted-foreground">@{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{typeof u.role === 'object' ? u.role?.name : u.roleId}</td>
                <td className="px-4 py-3">{typeof u.department === 'object' ? u.department?.name : u.departmentId}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(u.status)} className="cursor-pointer" onClick={() => canManage && onToggleStatus(u)}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {canManage && (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditUser(u); setShowCreate(false); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} total users</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span>{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
