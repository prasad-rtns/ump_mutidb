'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe, Map, Building2, Tag, Hash, FileText, Layers, Settings,
  Users, UserCheck, UserCog, LayoutDashboard, LogOut, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSchemaCatalogue } from '@/hooks/use-schema';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  globe: Globe, map: Map, building: Building2, tag: Tag, hash: Hash,
  'file-text': FileText, layers: Layers, settings: Settings,
};

const MASTER_ENTITY_ORDER = ['countries','states','cities','categories','tags','document-types','service-types','settings'];

const USER_NAV = [
  { label: 'External Users', href: '/users/external', icon: Users, roles: ['super_admin','admin'] },
  { label: 'Internal Users', href: '/users/internal', icon: UserCheck, roles: ['super_admin','admin'] },
  { label: 'Admin Users',    href: '/users/admin',    icon: UserCog,  roles: ['super_admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: schema } = useSchemaCatalogue();
  const [masterOpen, setMasterOpen] = useState(true);
  const [usersOpen, setUsersOpen]   = useState(false);

  const role = user?.role?.slug ?? '';

  const masterItems = MASTER_ENTITY_ORDER.flatMap((key) => {
    const meta = schema?.[key];
    if (!meta) return [];
    return [{ key, meta }];
  });

  const userItems = USER_NAV.filter((n) => n.roles.includes(role));

  function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link href={href} className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
        active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <aside className="w-60 shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <p className="text-sidebar-foreground font-bold text-lg">UMP Admin</p>
        <p className="text-sidebar-foreground/60 text-xs truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        {/* Master Data section */}
        {masterItems.length > 0 && (
          <div>
            <button
              onClick={() => setMasterOpen((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              Master Data
              {masterOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {masterOpen && masterItems.map(({ key, meta }) => {
              const Icon = ICON_MAP[meta.icon] ?? Layers;
              return <NavItem key={key} href={`/master/${key}`} icon={Icon} label={meta.pluralLabel} />;
            })}
          </div>
        )}

        {/* Users section */}
        {userItems.length > 0 && (
          <div>
            <button
              onClick={() => setUsersOpen((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              Users
              {usersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {usersOpen && userItems.map((n) => <NavItem key={n.href} href={n.href} icon={n.icon} label={n.label} />)}
          </div>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={() => logout()}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
