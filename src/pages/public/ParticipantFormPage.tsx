import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDemo } from '@/context/DemoContext';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Building2, RefreshCw } from 'lucide-react';
import { decodeFormPayload } from '@/lib/form-payload';
import { useState, useEffect } from 'react';
import type { Form } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ParticipantFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { forms, addResponse } = useDemo();
  const navigate = useNavigate();
  const [remoteForm, setRemoteForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Check local context (creator device)
  const localForm = forms.find(f => f.slug === slug);

  // 2. Check URL payload (?d=...) or Supabase database for external participants / mobile scanners
  useEffect(() => {
    if (localForm) return;

    const dataPayload = searchParams.get('d');
    if (dataPayload) {
      const decoded = decodeFormPayload(dataPayload);
      if (decoded) {
        setRemoteForm(decoded);
        return;
      }
    }

    // 3. Fallback: Query Supabase
    async function loadFromDb() {
      if (isSupabaseConfigured() && supabase && slug) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (!error && data) {
            const parsedForm: Form = {
              id: data.id,
              organization_id: data.organization_id || 'org-public',
              created_by: data.user_id || 'creator',
              title: data.title,
              description: data.description,
              category: data.category,
              slug: data.slug,
              status: data.status,
              created_at: data.created_at,
              updated_at: data.updated_at,
              response_count: data.response_count || 0,
              fields: data.schema?.fields || [],
              settings: data.schema?.settings || {},
            };
            setRemoteForm(parsedForm);
          }
        } catch (e) {
          console.warn('Could not fetch form from Supabase:', e);
        } finally {
          setLoading(false);
        }
      }
    }

    loadFromDb();
  }, [slug, searchParams, localForm]);

  const form = localForm || remoteForm;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[var(--color-text-secondary)]">
          <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          <span className="text-xs font-medium">Loading form…</span>
        </div>
      </div>
    );
  }

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
