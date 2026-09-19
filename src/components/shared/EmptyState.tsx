import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state-icon">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
