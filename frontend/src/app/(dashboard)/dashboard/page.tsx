'use client';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, Tag, Layers } from 'lucide-react';
import { authApi, masterApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [usersRes, countriesRes, tagsRes, serviceTypesRes] = await Promise.allSettled([
        authApi.get('/users/dashboard'),
        masterApi.get('/master/countries'),
        masterApi.get('/master/tags'),
        masterApi.get('/master/service-types'),
      ]);
      return {
        users: usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.totalUsers ?? 0) : 0,
        countries: countriesRes.status === 'fulfilled' ? (countriesRes.value.data?.data?.length ?? 0) : 0,
        tags: tagsRes.status === 'fulfilled' ? (tagsRes.value.data?.data?.length ?? 0) : 0,
        serviceTypes: serviceTypesRes.status === 'fulfilled' ? (serviceTypesRes.value.data?.data?.length ?? 0) : 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={dashStats?.users        ?? '–'} icon={Users}  color="bg-blue-500" />
        <StatCard title="Countries"      value={dashStats?.countries    ?? '–'} icon={Globe}  color="bg-green-500" />
        <StatCard title="Tags"           value={dashStats?.tags         ?? '–'} icon={Tag}    color="bg-purple-500" />
        <StatCard title="Service Types"  value={dashStats?.serviceTypes ?? '–'} icon={Layers} color="bg-orange-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground">Name</p><p className="font-medium">{user?.firstName} {user?.lastName}</p></div>
          <div><p className="text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-muted-foreground">Role</p><p className="font-medium capitalize">{user?.role?.name ?? user?.role?.slug}</p></div>
          <div><p className="text-muted-foreground">Category</p><p className="font-medium capitalize">{user?.userCategory}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
