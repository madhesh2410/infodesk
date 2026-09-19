import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useDemo } from '@/context/DemoContext';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

export default function ParticipantFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const { forms, addResponse } = useDemo();
  const navigate = useNavigate();

  // Find form by slug
  const form = forms.find(f => f.slug === slug);

  if (!form) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Form Not Found</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This form link is invalid or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (form.status === 'closed') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Form Closed</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This form is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  if (form.status === 'draft') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Form Not Available</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This form has not been published yet.
          </p>
        </div>
      </div>
    );
  }

  function handleSubmit(answers: Record<string, string | string[] | boolean | null>) {
    const nameField = form!.fields.find(f => f.label.toLowerCase().includes('name') && f.type === 'short_answer');
    const emailField = form!.fields.find(f => f.type === 'email');
    const phoneField = form!.fields.find(f => f.type === 'phone');
    const deptField = form!.fields.find(f => f.label.toLowerCase().includes('department'));
    const yearField = form!.fields.find(f => f.label.toLowerCase().includes('year'));

    const responseAnswers = Object.entries(answers).map(([fieldId, value]) => {
      const field = form!.fields.find(f => f.id === fieldId);
      return {
        id: `ans-${fieldId}`,
        response_id: '',
        field_id: fieldId,
        field_label: field?.label ?? fieldId,
        value,
      };
    });

    const resp = addResponse({
      form_id: form!.id,
      form_title: form!.title,
      status: 'complete',
      answers: responseAnswers,
      files: [],
      notes: [],
      participant_name: nameField ? String(answers[nameField.id] ?? '') : undefined,
      participant_email: emailField ? String(answers[emailField.id] ?? '') : undefined,
      participant_phone: phoneField ? String(answers[phoneField.id] ?? '') : undefined,
      department: deptField ? String(answers[deptField.id] ?? '') : undefined,
      year: yearField ? String(answers[yearField.id] ?? '') : undefined,
    });

    navigate(`/submission-success/${resp.response_id}?form=${form!.id}`);
  }

  return <FormRenderer form={form} onSubmit={handleSubmit} />;
}
