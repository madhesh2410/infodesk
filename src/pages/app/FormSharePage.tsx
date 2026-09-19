import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '@/context/DemoContext';
import { PublishDialog } from './PublishDialog';

export default function FormSharePage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { forms } = useDemo();

  const form = forms.find(f => f.id === formId);

  if (!form) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">Form not found.</p>
        <button onClick={() => navigate('/app/forms')} className="btn btn-primary mt-4">Back to Forms</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PublishDialog
        open={true}
        onClose={() => navigate('/app/forms')}
        formId={form.id}
        slug={form.slug}
        title={form.title}
      />
    </div>
  );
}
