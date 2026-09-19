import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MessageSquare, FolderOpen,
  Mail, BookTemplate, BarChart2, Users, Settings, ChevronLeft,
  ChevronRight, LogOut, Building2, User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    icon: <LayoutDashboard className="h-4 w-4" />, to: '/app/dashboard' },
  { label: 'Forms',        icon: <FileText className="h-4 w-4" />,        to: '/app/forms' },
  { label: 'Responses',    icon: <MessageSquare className="h-4 w-4" />,   to: '/app/responses' },
  { label: 'Documents',    icon: <FolderOpen className="h-4 w-4" />,      to: '/app/documents' },
  { label: 'Email Center', icon: <Mail className="h-4 w-4" />,            to: '/app/email' },
  { label: 'Templates',    icon: <BookTemplate className="h-4 w-4" />,    to: '/app/templates' },
  { label: 'Analytics',    icon: <BarChart2 className="h-4 w-4" />,       to: '/app/analytics' },
  { label: 'Profile',      icon: <User className="h-4 w-4" />,           to: '/app/profile' },
  { label: 'Team',         icon: <Users className="h-4 w-4" />,           to: '/app/team' },
  { label: 'Settings',     icon: <Settings className="h-4 w-4" />,        to: '/app/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'sidebar',
          collapsed && 'collapsed',
          mobileOpen && 'mobile-open'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center justify-center w-7 h-7 bg-[var(--color-primary)] rounded-lg shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-[15px] text-[var(--color-text-primary)] tracking-tight">
              InfoDesk
            </span>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'ml-auto p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-gray-100 transition-colors hidden md:flex',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={cn('nav-item', isActive && 'active')}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-[var(--color-border)] p-3 shrink-0">
          <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--color-border)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user?.full_name ?? 'U')}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{user?.full_name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate capitalize">{user?.role?.replace('_', ' ') ?? 'User'}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={signOut}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={signOut}
              className="mt-2 w-full flex items-center justify-center p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
