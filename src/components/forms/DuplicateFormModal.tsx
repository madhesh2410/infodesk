import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/shared/Dialog';
import { useToast } from '@/context/ToastContext';
import { Copy, AlertCircle } from 'lucide-react';
import type { Form } from '@/types';

interface DuplicateFormModalProps {
  open: boolean;
  onClose: () => void;
  form: Form | null;
  onDuplicate: (formId: string, newTitle: string) => void;
}

export function DuplicateFormModal({
  open,
  onClose,
  form,
  onDuplicate,
}: DuplicateFormModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && form) {
      setTitle(`${form.title} (Copy)`);
      setError(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open, form]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a name for the duplicated form.');
      inputRef.current?.focus();
      return;
    }

    onDuplicate(form.id, trimmed);
    onClose();
  }

  if (!form) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Duplicate Form"
      description={`Create a copy of "${form.title}" with all fields and settings.`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="duplicate-form-title"
              className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1"
            >
              New Form Name <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Required
            </span>
          </div>
          <input
            ref={inputRef}
            id="duplicate-form-title"
            type="text"
            className={`input w-full text-xs font-medium ${
              error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-300' : ''
            }`}
            placeholder="Enter form name..."
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (error && e.target.value.trim()) setError(null);
            }}
          />
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <button type="button" className="btn btn-secondary text-xs h-9 px-3" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary text-xs h-9 px-3.5 gap-1.5"
            disabled={!title.trim()}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate Form
          </button>
        </div>
      </form>
    </Dialog>
  );
}
