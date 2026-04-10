import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  CalendarDays,
  FileBarChart,
  FileText,
  GitCompare,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
  Users,
  X,
  CreditCard,
  Shield,
  Building2,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: ('user' | 'admin' | 'super_admin')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/audit', label: 'Run Audit', icon: Sparkles },
  { href: '/dashboard/planner', label: 'Content Planner', icon: CalendarDays },
  { href: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
  { href: '/dashboard/analytics', label: 'Analytics', icon: PieChart },
  { href: '/dashboard/compare', label: 'Compare', icon: GitCompare },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin', 'super_admin'] },
  { href: '/admin/audits', label: 'All Audits', icon: FileBarChart, roles: ['admin', 'super_admin'] },
  { href: '/admin/branding', label: 'Branding', icon: Building2, roles: ['admin', 'super_admin'] },
];

const superAdminNavItems: NavItem[] = [
  { href: '/super-admin', label: 'System', icon: LayoutDashboard, roles: ['super_admin'] },
  { href: '/super-admin/users', label: 'Users', icon: Users, roles: ['super_admin'] },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCard, roles: ['super_admin'] },
  { href: '/super-admin/settings/general', label: 'Settings', icon: Settings, roles: ['super_admin'] },
];

export function DashboardLayout() {
  const { user, profile, signOut, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActive = (href: string) => {
    // Special handling for settings - any settings sub-route should highlight the settings nav item
    if (href === '/super-admin/settings/general' && location.pathname.startsWith('/super-admin/settings')) {
      return true;
    }
    return location.pathname === href || 
      (href !== '/dashboard' && href !== '/admin' && href !== '/super-admin' && !href.includes('/settings/') && location.pathname.startsWith(href));
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const active = isActive(item.href);
      
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            'sidebar-nav-item',
            active && 'active'
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
          {active && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-out lg:static lg:translate-x-0 shadow-sm',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link to="/" className="flex items-center gap-3 font-bold text-lg group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/25">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span>Pagelyzer</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* User Navigation */}
            <div className="space-y-1.5">
              <p className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                Dashboard
              </p>
              {renderNavItems(navItems)}
            </div>

            {/* Admin Navigation */}
            {isAdmin && (
              <div className="space-y-1.5">
                <p className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Admin
                </p>
                {renderNavItems(adminNavItems)}
              </div>
            )}

            {/* Super Admin Navigation */}
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <p className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Super Admin
                </p>
                {renderNavItems(superAdminNavItems)}
              </div>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-colors duration-200 hover:bg-muted">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-5 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20 hover:ring-offset-2">
                <Avatar className="h-11 w-11 shadow-sm">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/dashboard/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30 overflow-x-hidden">
          <div className="mx-auto max-w-[1400px] 2xl:max-w-[1560px] page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
