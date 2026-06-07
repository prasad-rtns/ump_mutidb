'use client';
import { useMemo, useState } from 'react';
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
import { LanguageSwitcher } from '@/components/language/language-switcher';
import { useTranslation } from '@/i18n';
import type { IRole, IDepartment, IDesignation } from '@/types';

type FormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
  departmentId: string;
  designationId: string;
  userCategory: 'external' | 'internal' | 'admin';
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const schema = useMemo(() => z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8, t('auth.validation.min8')),
    phone: z.string().optional(),
    roleId: z.string().min(1, t('auth.validation.selectRole')),
    departmentId: z.string().min(1, t('auth.validation.selectDepartment')),
    designationId: z.string().min(1, t('auth.validation.selectDesignation')),
    userCategory: z.enum(['external', 'internal', 'admin']),
  }), [t]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userCategory: 'external' },
  });

  const deptId = watch('departmentId');

  const { data: roles } = useQuery<IRole[]>({ queryKey: ['roles'], queryFn: async () => (await authApi.get('/auth/master/roles')).data.data });
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
      toast({ title: t('auth.registered'), description: t('auth.accountCreatedLogin') });
      router.push('/login');
    } catch (e) {
      toast({ title: t('auth.registrationFailed'), description: apiErrorMessage(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="fixed right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.createAccount')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['firstName', 'lastName'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label>{field === 'firstName' ? t('auth.firstName') : t('auth.lastName')}</Label>
                <Input {...register(field)} />
                {errors[field] && <p className="text-xs text-destructive">{errors[field]?.message}</p>}
              </div>
            ))}
            <div className="space-y-1">
              <Label>{t('auth.username')}</Label>
              <Input {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('auth.email')}</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('auth.password')}</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('auth.phone')}</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-1">
              <Label>{t('auth.userCategory')}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('userCategory')}>
                <option value="external">{t('users.external')}</option>
                <option value="internal">{t('users.internal')}</option>
                <option value="admin">{t('users.admin')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t('auth.role')}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('roleId')}>
                <option value="">{t('auth.selectRole')}</option>
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('auth.department')}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('departmentId')}>
                <option value="">{t('auth.selectDepartment')}</option>
                {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t('auth.designation')}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('designationId')} disabled={!deptId}>
                <option value="">{t('auth.selectDesignation')}</option>
                {designations?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.designationId && <p className="text-xs text-destructive">{errors.designationId.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.registering')}</> : t('auth.createAccount')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline">{t('auth.signInLink')}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
