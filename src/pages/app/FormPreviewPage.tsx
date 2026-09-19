import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Monitor, Smartphone } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { PublishDialog } from './PublishDialog';
import { useToast } from '@/context/ToastContext';

export default function FormPreviewPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { forms, updateForm } = useDemo();
  const toast = useToast();

  const form = forms.find(f => f.id === formId);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [publishOpen, setPublishOpen] = useState(false);

  if (!form) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">Form not found.</p>
        <button onClick={() => navigate('/app/forms')} className="btn btn-primary mt-4">Back to Forms</button>
      </div>
    );
  }

  function handlePublish() {
    if (!form) return;
    updateForm(form.id, { status: 'published' });
    toast.success('Form published!');
    setPublishOpen(true);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen -m-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-white border-b border-[var(--color-border)] shrink-0">
        <button onClick={() => navigate(`/app/forms/${formId}/edit`)} className="btn btn-ghost btn-sm p-1.5">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">{form.title}</span>
        <div className="flex items-center gap-1 border border-[var(--color-border)] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'desktop' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'mobile' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={() => navigate(`/app/forms/${formId}/edit`)} className="btn btn-secondary btn-sm">
          Back to Builder
        </button>
        {form.status !== 'published' && (
          <button onClick={handlePublish} className="btn btn-primary btn-sm gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Publish
          </button>
        )}
        {form.status === 'published' && (
          <button onClick={() => setPublishOpen(true)} className="btn btn-primary btn-sm gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Share
          </button>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg)] flex justify-center pt-8 pb-8">
        <div
          className={`transition-all duration-300 ${
            viewMode === 'mobile' ? 'w-[390px] min-h-[600px] bg-white border border-[var(--color-border)] rounded-3xl shadow-xl overflow-hidden' : 'w-full max-w-2xl'
          }`}
        >
          {viewMode === 'mobile' && (
            <div className="flex items-center justify-center py-3 bg-gray-900 rounded-t-3xl">
              <div className="w-20 h-1.5 bg-gray-600 rounded-full" />
            </div>
          )}
          <div className={viewMode === 'mobile' ? 'overflow-y-auto max-h-[700px]' : ''}>
            <FormRenderer form={form} previewMode />
          </div>
        </div>
      </div>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        formId={form.id}
        slug={form.slug}
        title={form.title}
      />
    </div>
  );
}
