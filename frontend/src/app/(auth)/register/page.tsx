'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { IRole, IDepartment, IDesignation } from '@/types';

const schema = z.object({
  firstName:     z.string().min(1),
  lastName:      z.string().min(1),
  username:      z.string().min(3),
  email:         z.string().email(),
  password:      z.string().min(8, 'Min 8 characters'),
  phone:         z.string().optional(),
  roleId:        z.string().min(1, 'Select a role'),
  departmentId:  z.string().min(1, 'Select a department'),
  designationId: z.string().min(1, 'Select a designation'),
  userCategory:  z.enum(['external', 'internal', 'admin']),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userCategory: 'external' },
  });

  const deptId = watch('departmentId');

  const { data: roles }       = useQuery<IRole[]>({ queryKey: ['roles'],       queryFn: async () => (await authApi.get('/auth/master/roles')).data.data });
  const { data: departments } = useQuery<IDepartment[]>({ queryKey: ['departments'], queryFn: async () => (await authApi.get('/auth/master/departments')).data.data });
  const { data: designations } = useQuery<IDesignation[]>({
    queryKey: ['designations', deptId],
    queryFn: async () => (await authApi.get(`/auth/master/designations?departmentId=${deptId}`)).data.data,
    enabled: !!deptId,
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      await authApi.post('/auth/register', values);
      toast({ title: 'Registered!', description: 'Account created. Please login.' });
      router.push('/login');
    } catch (e) {
      toast({ title: 'Registration failed', description: apiErrorMessage(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register for UMP Admin access</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-2 gap-4">
            {(['firstName','lastName'] as const).map((f) => (
              <div key={f} className="space-y-1">
                <Label>{f === 'firstName' ? 'First Name' : 'Last Name'}</Label>
                <Input {...register(f)} />
                {errors[f] && <p className="text-xs text-destructive">{errors[f]?.message}</p>}
              </div>
            ))}
            <div className="space-y-1">
              <Label>Username</Label>
              <Input {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-1">
              <Label>User Category</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('userCategory')}>
                <option value="external">External</option>
                <option value="internal">Internal</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('roleId')}>
                <option value="">Select role</option>
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('departmentId')}>
                <option value="">Select department</option>
                {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Designation</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('designationId')} disabled={!deptId}>
                <option value="">Select designation</option>
                {designations?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.designationId && <p className="text-xs text-destructive">{errors.designationId.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering…</> : 'Create Account'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
