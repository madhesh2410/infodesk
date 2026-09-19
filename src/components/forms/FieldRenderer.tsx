import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Check } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import type { FormField, UploadedFile } from '@/types';
import { generateId } from '@/lib/utils';

// ─── Field Renderer ────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormField;
  value: string | string[] | boolean | null;
  onChange: (value: string | string[] | boolean | null) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
  if (field.type === 'section') {
    return (
      <div className="border-b border-[var(--color-border)] pb-2 pt-4 first:pt-0">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{field.section_title}</h3>
        {field.section_description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{field.section_description}</p>
        )}
      </div>
    );
  }

  const baseProps = {
    disabled,
    'aria-required': field.required,
    'aria-invalid': !!error,
    id: `field-${field.id}`,
  };

  switch (field.type) {
    case 'short_answer':
    case 'phone':
    case 'number':
      return (
        <input
          {...baseProps}
          type={field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : 'text'}
          className={cn('input', error && 'input-error')}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      );

    case 'email':
      return (
        <input
          {...baseProps}
          type="email"
          className={cn('input', error && 'input-error')}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? 'your@email.com'}
          autoComplete="email"
        />
      );

    case 'long_answer':
      return (
        <textarea
          {...baseProps}
          className={cn('textarea', error && 'input-error')}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      );

    case 'date':
      return (
        <input
          {...baseProps}
          type="date"
          className={cn('input', error && 'input-error')}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'dropdown':
      return (
        <select
          {...baseProps}
          className={cn('select', error && 'input-error')}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select an option…</option>
          {field.options?.map(opt => (
            <option key={opt.id} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {field.options?.map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={`field-${field.id}`}
                value={opt.value}
                checked={(value as string) === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled}
                className="w-4 h-4 text-[var(--color-primary)] border-gray-300 focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkboxes':
      return (
        <div className="space-y-2">
          {field.options?.map(opt => {
            const selected = ((value as string[]) ?? []).includes(opt.value);
            return (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected}
                  onChange={e => {
                    const current = (value as string[]) ?? [];
                    onChange(e.target.checked
                      ? [...current, opt.value]
                      : current.filter(v => v !== opt.value)
                    );
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">{opt.label}</span>
              </label>
            );
          })}
        </div>
      );

    case 'yes_no':
      return (
        <div className="flex gap-3">
          {(['Yes', 'No'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt.toLowerCase())}
              disabled={disabled}
              className={cn(
                'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                (value as string) === opt.toLowerCase()
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case 'file_upload':
    case 'image_upload':
      return <FileUploadField field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

    case 'signature':
      return (
        <div className="border border-[var(--color-border-strong)] rounded-lg p-4 bg-gray-50 text-center">
          <PenLine className="h-5 w-5 text-[var(--color-text-muted)] mx-auto mb-1" />
          <p className="text-xs text-[var(--color-text-muted)]">Signature field (click to sign)</p>
          {value && <p className="text-xs text-green-600 mt-1">✓ Signed</p>}
          {!value && (
            <button
              type="button"
              onClick={() => onChange('signed')}
              className="mt-2 btn btn-secondary btn-sm"
              disabled={disabled}
            >
              Click to Sign
            </button>
          )}
        </div>
      );

    default:
      return (
        <input
          {...baseProps}
          type="text"
          className="input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
}

// ─── File Upload Field ─────────────────────────────────────────────────────────

function PenLine({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
  );
}

interface FileUploadFieldProps {
  field: FormField;
  value: string | string[] | boolean | null;
  onChange: (value: string | string[] | boolean | null) => void;
  error?: string;
  disabled?: boolean;
}

function FileUploadField({ field, value, onChange, error, disabled }: FileUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(
    value ? { name: String(value), size: 0, type: '' } : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = field.type === 'image_upload'
    ? 'image/jpeg,image/png,image/webp'
    : (field.validation?.allowedTypes ?? ['image/jpeg', 'image/png', 'application/pdf']).join(',');

  const maxSizeMB = field.validation?.maxSizeMB ?? 10;

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      onChange(null);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 20;
      });
    }, 150);

    await new Promise(r => setTimeout(r, 900));
    clearInterval(interval);
    setUploadProgress(100);
    setUploading(false);
    setUploadedFile({ name: file.name, size: file.size, type: file.type });
    onChange(file.name);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function removeFile() {
    setUploadedFile(null);
    setUploadProgress(0);
    onChange(null);
  }

  if (uploadedFile) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center shrink-0">
          {uploadedFile.type.startsWith('image') ? <ImageIcon className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4 text-green-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-800 truncate">{uploadedFile.name}</p>
          {uploadedFile.size > 0 && <p className="text-[10px] text-green-600">{formatFileSize(uploadedFile.size)}</p>}
          <div className="flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-[10px] text-green-600 font-medium">Uploaded</span>
          </div>
        </div>
        {!disabled && (
          <button type="button" onClick={removeFile} className="text-green-600 hover:text-red-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn('dropzone', dragOver && 'drag-over', error && 'border-red-300')}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={disabled}
        />
        {uploading ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-text-secondary)]">Uploading…</p>
            <div className="progress-bar-track w-40 mx-auto">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Drop file here or <span className="text-[var(--color-primary)]">browse</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Max {maxSizeMB}MB • {field.type === 'image_upload' ? 'JPG, PNG' : 'PDF, JPG, PNG'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
