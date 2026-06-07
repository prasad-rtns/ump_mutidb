'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  FolderTree,
  Globe,
  Hash,
  Layers,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MenuSquare,
  Settings,
  ShieldCheck,
  Tag,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { IModuleMenu } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  badge: BadgeCheck,
  badgecheck: BadgeCheck,
  building: Building2,
  building2: Building2,
  database: Database,
  filetext: FileText,
  'file-text': FileText,
  foldertree: FolderTree,
  'folder-tree': FolderTree,
  globe: Globe,
  hash: Hash,
  layers: Layers,
  layoutdashboard: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  map: MapIcon,
  menu: MenuSquare,
  menusquare: MenuSquare,
  'menu-square': MenuSquare,
  settings: Settings,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  'shield-check': ShieldCheck,
  tag: Tag,
  usercheck: UserCheck,
  'user-check': UserCheck,
  usercog: UserCog,
  'user-cog': UserCog,
  users: Users,
};

interface ModuleNode extends IModuleMenu {
  children: ModuleNode[];
}

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

function iconFor(icon?: string | null) {
  if (!icon) return Layers;
  return ICON_MAP[icon.replace(/\s+/g, '').toLowerCase()] ?? Layers;
}

function sortModules<T extends IModuleMenu>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
}

function buildTree(modules: IModuleMenu[]): ModuleNode[] {
  const nodes = new Map<string, ModuleNode>();
  sortModules(modules).forEach((module) => nodes.set(module.id, { ...module, children: [] }));

  const roots: ModuleNode[] = [];
  nodes.forEach((node) => {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  nodes.forEach((node) => {
    node.children = sortModules(node.children);
  });
  return sortModules(roots);
}

function moduleRoute(module: IModuleMenu) {
  return module.route && module.route !== '#' ? module.route : '';
}

function nodeContainsPath(module: ModuleNode, pathname: string): boolean {
  const href = moduleRoute(module);
  if (href && (pathname === href || pathname.startsWith(`${href}/`))) return true;
  return module.children.some((child) => nodeContainsPath(child, pathname));
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, canAny } = useAuth();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const { data: modules = [] } = useQuery<IModuleMenu[]>({
    queryKey: ['sidebar', 'modules'],
    queryFn: async () => (await authApi.get('/auth/master/modules')).data.data,
    staleTime: 5 * 60 * 1000,
  });

  const visibleTree = useMemo(() => {
    function filterNode(node: ModuleNode): ModuleNode | null {
      const visibleChildren = node.children.flatMap((child) => {
        const visible = filterNode(child);
        return visible ? [visible] : [];
      });
      const selfVisible = (node.permissions?.length ?? 0) === 0 || canAny(node.permissions);
      if (!selfVisible && visibleChildren.length === 0) return null;
      return { ...node, children: visibleChildren };
    }

    return buildTree(modules.filter((module) => module.isActive !== false))
      .flatMap((node) => {
        const visible = filterNode(node);
        return visible ? [visible] : [];
      });
  }, [canAny, modules]);

  function NavLink({ module, depth = 0 }: { module: ModuleNode; depth?: number }) {
    const href = moduleRoute(module);
    const Icon = iconFor(module.icon);
    const active = href ? pathname === href || pathname.startsWith(`${href}/`) : false;
    const padding = depth === 0 ? 'px-3' : depth === 1 ? 'pl-8 pr-3' : 'pl-12 pr-3';

    return (
      <Link href={href || '#'} className={cn(
        'flex items-center gap-2.5 py-2 rounded-md text-sm transition-colors',
        padding,
        active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )} onClick={onNavigate}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{module.name}</span>
      </Link>
    );
  }

  function NavNode({ module, depth = 0 }: { module: ModuleNode; depth?: number }) {
    const hasChildren = module.children.length > 0;
    const href = moduleRoute(module);
    const Icon = iconFor(module.icon);
    const expanded = open[module.id] ?? nodeContainsPath(module, pathname);
    const active = href ? pathname === href || pathname.startsWith(`${href}/`) : false;
    const padding = depth === 0 ? 'px-3' : depth === 1 ? 'pl-8 pr-3' : 'pl-12 pr-3';

    if (!hasChildren) return <NavLink module={module} depth={depth} />;

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((current) => ({ ...current, [module.id]: !expanded }))}
          className={cn(
            'flex w-full items-center justify-between gap-2 py-2 rounded-md text-sm transition-colors',
            padding,
            active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{module.name}</span>
          </span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        </button>
        {expanded && (
          <div className="mt-1 space-y-1">
            {module.children.map((child) => <NavNode key={child.id} module={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className={cn('w-60 shrink-0 bg-sidebar flex flex-col h-screen overflow-y-auto', className)}>
      <div className="px-4 py-5 border-b border-sidebar-border">
        <p className="text-sidebar-foreground font-bold text-lg">UMP Admin</p>
        <p className="text-sidebar-foreground/60 text-xs truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleTree.map((module) => <NavNode key={module.id} module={module} />)}
      </nav>

      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
