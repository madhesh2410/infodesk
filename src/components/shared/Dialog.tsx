import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, description, children, className, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="dialog-overlay"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={cn('dialog-content', SIZE_MAP[size], className)}>
        {(title || description) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>}
              {description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-gray-100 rounded transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', variant = 'destructive', loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-2 mt-4 justify-end">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={cn('btn', variant === 'destructive' ? 'btn-destructive' : 'btn-primary')}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
