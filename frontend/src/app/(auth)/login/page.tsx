'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { authApi, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language/language-switcher';
import { useTranslation } from '@/i18n';

type FormData = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const schema = useMemo(() => z.object({
    identifier: z.string().min(1, t('auth.validation.emailOrUsernameRequired')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  }), [t]);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      const { data } = await authApi.post('/auth/login', values);
      const result = data.data;
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast({ title: t('auth.welcomeBack'), description: t('auth.hello', { name: result.user.firstName }) });
      router.replace('/dashboard');
    } catch (e) {
      toast({ title: t('auth.loginFailed'), description: apiErrorMessage(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="fixed right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('app.name')}</CardTitle>
          <CardDescription>{t('auth.signInDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('auth.emailOrUsername')}</Label>
              <Input id="identifier" placeholder="admin@example.com" {...register('identifier')} />
              {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.signingIn')}</> : t('auth.signIn')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline">{t('auth.register')}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
