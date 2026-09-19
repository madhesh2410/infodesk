import { cn } from '@/lib/utils';
import type { ResponseStatus, FormStatus } from '@/types';

interface StatusBadgeProps {
  status: ResponseStatus | FormStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  // Response statuses
  complete:       { label: 'Complete',       cls: 'badge-success' },
  approved:       { label: 'Approved',       cls: 'badge-success' },
  pending_review: { label: 'Pending Review', cls: 'badge-warning' },
  incomplete:     { label: 'Incomplete',     cls: 'badge-error' },
  rejected:       { label: 'Rejected',       cls: 'badge-error' },
  // Form statuses
  published:      { label: 'Published',      cls: 'badge-success' },
  draft:          { label: 'Draft',          cls: 'badge-neutral' },
  closed:         { label: 'Closed',         cls: 'badge-error' },
  archived:       { label: 'Archived',       cls: 'badge-neutral' },
  // File statuses
  verified:       { label: 'Verified',       cls: 'badge-success' },
  pending:        { label: 'Pending',        cls: 'badge-warning' },
  // Email statuses
  sent:           { label: 'Sent',           cls: 'badge-success' },
  failed:         { label: 'Failed',         cls: 'badge-error' },
  // Team statuses
  active:         { label: 'Active',         cls: 'badge-success' },
  invited:        { label: 'Invited',        cls: 'badge-info' },
  inactive:       { label: 'Inactive',       cls: 'badge-neutral' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, cls: 'badge-neutral' };
  return (
    <span className={cn('badge', config.cls, className)}>
      {config.label}
    </span>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  super_admin: { label: 'Super Admin', cls: 'badge-primary' },
  admin:       { label: 'Admin',       cls: 'badge-info' },
  staff:       { label: 'Staff',       cls: 'badge-neutral' },
  user:        { label: 'User',        cls: 'badge-neutral' },
};

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? { label: role, cls: 'badge-neutral' };
  return <span className={cn('badge', config.cls)}>{config.label}</span>;
}
