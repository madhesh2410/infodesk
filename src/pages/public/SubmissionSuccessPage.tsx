import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Eye, Building2 } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { generateResponsePDF } from '@/lib/pdf';
import type { FormResponse, Form } from '@/types';

export default function SubmissionSuccessPage() {
  const { responseId } = useParams<{ responseId: string }>();
  const [searchParams] = useSearchParams();
  const { responses, forms } = useDemo();
  const formId = searchParams.get('form');

  const formResponses: FormResponse[] = (Object.values(responses) as FormResponse[][]).flat();
  const response: FormResponse | undefined = formResponses.find(r => r.response_id === responseId);
  const form: Form | undefined = forms.find(f => f.id === (formId ?? response?.form_id));

  function handleDownloadPDF() {
    if (!response) return;
    generateResponsePDF(response, form);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-8 max-w-md w-full text-center animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-[var(--color-text-primary)]">InfoDesk</span>
        </div>

        {/* Success icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-9 w-9 text-green-600" />
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Submission Successful!</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Your information has been submitted successfully.
          {form ? ` Thank you for completing the ${form.title}.` : ''}
        </p>

        {/* Response ID */}
        <div className="bg-[var(--color-primary-muted)] rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-[var(--color-primary)] mb-1">Your Response ID</p>
          <p className="text-2xl font-bold text-[var(--color-primary)] tracking-widest font-mono">
            {responseId}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Keep this ID for your records.
          </p>
        </div>

        {/* Confirmation message */}
        {form?.settings.confirmation_message && (
          <div className="bg-gray-50 rounded-lg p-3 mb-5 text-left">
            <p className="text-xs text-[var(--color-text-secondary)]">{form.settings.confirmation_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary w-full justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF Copy
          </button>

          {response && (
            <Link
              to={`/app/responses/${response.id}?form=${response.form_id}`}
              className="btn btn-secondary w-full justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Submission
            </Link>
          )}
        </div>

        <p className="text-[11px] text-[var(--color-text-muted)] mt-5">
          Powered by <span className="font-semibold">InfoDesk</span> · Collect. Organize. Access.
        </p>
      </div>
    </div>
  );
}
