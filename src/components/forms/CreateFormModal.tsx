import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/shared/Dialog';
import { useDemo } from '@/context/DemoContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateSlug, generateId } from '@/lib/utils';
import { FileText, Sparkles, BookTemplate, ArrowRight, AlertCircle } from 'lucide-react';
import type { PrebuiltTemplate } from '@/data/formTemplates';
import type { FormField } from '@/types';

interface CreateFormModalProps {
  open: boolean;
  onClose: () => void;
  template?: PrebuiltTemplate | null;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: string;
}

const CATEGORIES = [
  'General',
  'Student',
  'Academic',
  'Events',
  'Documents',
  'Feedback',
  'Registration',
  'Administration',
];

export function CreateFormModal({
  open,
  onClose,
  template,
  initialTitle = '',
  initialDescription = '',
  initialCategory = 'General',
}: CreateFormModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createForm } = useDemo();
  const toast = useToast();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // When modal opens or template changes, sync state and focus
  useEffect(() => {
    if (open) {
      const suggestedTitle = template ? template.title : initialTitle;
      setTitle(suggestedTitle);
      setDescription(template ? template.description : initialDescription);
      setCategory(template ? template.category : initialCategory);
      setError(null);
      setSubmitting(false);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open, template, initialTitle, initialDescription, initialCategory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('The form name is required. Please enter a name to continue.');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const now = Date.now().toString(36);

    let fields: FormField[] = [];
    let settings = {
      allow_multiple_submissions: false,
      allow_multiple: false,
      allow_edit_after_submission: false,
      confirmation_message: 'Thank you! Your response has been submitted successfully.',
      require_email: true,
      max_file_size_mb: 10,
      allowed_file_types: ['image/jpeg', 'image/png', 'application/pdf'],
      show_progress_bar: true,
      collect_documents: false,
    };

    if (template) {
      fields = template.fields.map(f => ({
        ...f,
        id: `fld-${generateId()}`,
        form_id: undefined,
        options: f.options ? f.options.map(o => ({ ...o, id: `opt-${generateId()}` })) : undefined,
      }));

      settings = {
        ...settings,
        allow_multiple_submissions: template.settings.allow_multiple_submissions ?? false,
        allow_multiple: template.settings.allow_multiple_submissions ?? false,
        allow_edit_after_submission: template.settings.allow_edit_after_submission ?? false,
        confirmation_message: template.settings.confirmation_message ?? 'Thank you! Your response has been submitted.',
        require_email: template.settings.require_email ?? true,
        max_file_size_mb: template.settings.max_file_size_mb ?? 10,
        allowed_file_types: template.settings.allowed_file_types ?? ['image/jpeg', 'image/png', 'application/pdf'],
        show_progress_bar: template.settings.show_progress_bar ?? true,
        collect_documents: fields.some(f => f.type === 'file_upload' || f.type === 'image_upload'),
      };
    }

    const newForm = createForm({
      organization_id: user?.organization_id ?? 'org-001',
      created_by: user?.id ?? 'user-001',
      title: trimmedTitle,
      description: description.trim(),
      category: category || 'General',
      slug: `${generateSlug(trimmedTitle)}-${now}`,
      status: 'draft',
      fields,
      settings,
    });

    toast.success(
      'Form created!',
      template
        ? `"${trimmedTitle}" created from template with ${fields.length} fields.`
        : `"${trimmedTitle}" created. You can now build its fields.`
    );

    onClose();
    navigate(`/app/forms/${newForm.id}/edit`);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={template ? 'Name Your Form' : 'Create New Form'}
      description={
        template
          ? `Configure the name for your new form based on the "${template.title}" template.`
          : 'Please enter a name for your form to get started.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {template && (
          <div className="flex items-center gap-2.5 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
            <BookTemplate className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-indigo-700">Selected Template: </span>
              <span>{template.title}</span>
              <span className="text-[10px] text-indigo-500 ml-1.5 font-medium uppercase">
                ({template.category})
              </span>
            </div>
          </div>
        )}

        {/* Form Name Input (Required) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="create-form-title"
              className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1"
            >
              Form Name <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Required
            </span>
          </div>
          <input
            ref={inputRef}
            id="create-form-title"
            type="text"
            className={`input w-full text-sm font-medium ${
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-200 ring-1 ring-red-300' : ''
            }`}
            placeholder="e.g., Student Registration 2026, Course Evaluation..."
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (error && e.target.value.trim()) setError(null);
            }}
          />
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
            Always enter a clear, unique title so respondents and administrators can easily identify this form.
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="create-form-desc" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Description <span className="text-[11px] font-normal text-[var(--color-text-muted)]">(Optional)</span>
          </label>
          <textarea
            id="create-form-desc"
            className="input w-full text-xs h-20 resize-none"
            placeholder="Briefly describe what this form is used for..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="create-form-cat" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Category
          </label>
          <select
            id="create-form-cat"
            className="input w-full text-xs h-9"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <button
            type="button"
            className="btn btn-secondary text-xs h-9 px-3.5"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary text-xs h-9 px-4 gap-1.5 shadow-xs"
            disabled={submitting || !title.trim()}
          >
            <span>{template ? 'Create from Template' : 'Create & Open Builder'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
