'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { LayoutDashboard, Building2, Briefcase, Users, GitPullRequest, UsersRound, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { signOut } from '@/app/(login)/actions';

import { cn } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import type { User } from '@/lib/db/schema';
import type { Permission } from '@/lib/rbac';

import { mutate } from 'swr';

// Nav Config

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { label: 'Clients', href: '/clients', icon: Building2, permission: 'clients.read' },
  { label: 'Vacancies', href: '#', icon: Briefcase, permission: 'vacancies.read' },
  { label: 'Candidates', href: '#', icon: Users, permission: 'candidates.read' },
  { label: 'Submissions', href: '#', icon: GitPullRequest, permission: 'submissions.read' },
  { label: 'Team', href: '#', icon: UsersRound, permission: 'team.read' },
  { label: 'Settings', href: '#', icon: Settings, permission: 'settings.read' },
];

// Sidebar Content

function SidebarContent({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(user, item.permission));

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <Image src="/crm-software.png" alt="CRM Logo" width={40} height={40} />
        <span className="font-semibold text-sm tracking-tight">Recruitment CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
        <ul role="list" className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === '#') {
                      e.preventDefault();
                    }
                    if (onNavigate) onNavigate();
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User menu */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.crmRole?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="#">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Main Export

export function Sidebar({ user }: { user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-background z-30">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Image src="/crm-software.png" alt="CRM Logo" width={40} height={40} />
          <span className="font-semibold text-sm">Recruitment CRM</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile: drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-50 flex w-64 flex-col bg-background border-r border-border">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}