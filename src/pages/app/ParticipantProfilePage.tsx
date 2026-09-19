import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Edit, Mail, FileText,
  Clock, CheckCircle, XCircle, MessageSquare, Plus,
  User, Phone, AtSign, Building, Calendar, AlertTriangle,
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/shared/Badge';
import { formatDate, formatDateTime, formatFileSize, getInitials } from '@/lib/utils';
import { generateResponsePDF } from '@/lib/pdf';
import { ConfirmDialog } from '@/components/shared/Dialog';
import type { ResponseStatus, InternalNote } from '@/types';
import { DEMO_FORMS } from '@/lib/demo-data';
import { useAuth } from '@/context/AuthContext';

const STATUS_OPTIONS: { label: string; value: ResponseStatus }[] = [
  { label: 'Complete', value: 'complete' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ParticipantProfilePage() {
  const { responseId } = useParams<{ responseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { responses, updateResponseStatus, updateResponseDuplicateStatus, addNote } = useDemo();
  const toast = useToast();

  const formId = searchParams.get('form') ?? '';
  const formResponses = responses[formId] ?? Object.values(responses).flat();
  const response = formResponses.find(r => r.id === responseId);
  const form = DEMO_FORMS.find(f => f.id === formId) ?? DEMO_FORMS.find(f => f.id === response?.form_id);

  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  if (!response) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">Response not found.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  function handleStatusChange(status: ResponseStatus) {
    if (status === 'rejected') { setConfirmReject(true); return; }
    updateResponseStatus(formId || response!.form_id, response!.id, status);
    toast.success('Status updated', `Response is now "${status.replace('_', ' ')}".`);
    setStatusMenuOpen(false);
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    addNote(formId || response!.form_id, response!.id, {
      response_id: response!.id,
      author_id: user?.id ?? '',
      author_name: user?.full_name ?? 'Admin',
      content: newNote,
    });
    setNewNote('');
    toast.success('Note added');
  }

  function handleDownloadPDF() {
    generateResponsePDF(response!, form);
    toast.success('PDF generated!');
  }

  // Group answers by form sections
  const infoFields = ['Full Name', 'Register Number', 'Email Address', 'Phone Number', 'Date of Birth', 'Gender'];
  const academicFields = ['Department', 'Year of Study', 'Section', 'CGPA'];
  const contactFields = ['Address', 'City', 'State', 'Pincode'];
  const otherAnswers = response.answers.filter(a =>
    ![...infoFields, ...academicFields, ...contactFields].includes(a.field_label)
  );

  function getAnswerValue(label: string): string {
    const a = response!.answers.find(ans => ans.field_label === label);
    if (!a || a.value === null) return '—';
    if (Array.isArray(a.value)) return a.value.join(', ');
    return String(a.value) || '—';
  }

  function renderInfoGrid(labels: string[]) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {labels.map(label => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-[var(--color-text-primary)]">{getAnswerValue(label)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5 -ml-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Responses
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-lg font-bold shrink-0">
            {getInitials(response.participant_name ?? 'U')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-[var(--color-text-primary)]">{response.participant_name ?? 'Unknown'}</h1>
                <p className="text-sm text-[var(--color-text-muted)] font-mono">{response.response_id}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{response.form_title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <StatusBadge status={response.status} />

                {/* Status change */}
                <div className="relative">
                  <button
                    onClick={() => setStatusMenuOpen(o => !o)}
                    className="btn btn-secondary btn-sm gap-1"
                  >
                    Change Status
                  </button>
                  {statusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                      <div className="absolute right-0 top-9 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-20 w-40 animate-scale-in">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                          >
                            <StatusBadge status={opt.value} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {response.participant_email && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <AtSign className="h-3.5 w-3.5" />
                  {response.participant_email}
                </div>
              )}
              {response.participant_phone && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Phone className="h-3.5 w-3.5" />
                  {response.participant_phone}
                </div>
              )}
              {response.department && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Building className="h-3.5 w-3.5" />
                  {response.department} — Year {response.year}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Calendar className="h-3.5 w-3.5" />
                Submitted {formatDateTime(response.submitted_at)}
              </div>
            </div>

            {/* Duplicate Review Alert */}
            {response.is_duplicate && response.duplicate_status !== 'resolved_legitimate' && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        ⚠️ Possible Duplicate Submission
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        Previous submission found matching <strong>{response.duplicate_match_field || 'identifier'}</strong>: <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-semibold">{response.duplicate_matched_value || 'N/A'}</span>.
                      </p>
                      {response.duplicate_of_response_id && (
                        <p className="text-[11px] text-amber-700 mt-1">
                          Previous submission found for: <strong>{response.duplicate_original_name || 'Respondent'}</strong> (ID: {response.duplicate_of_response_id}) submitted {response.duplicate_original_submitted_at ? formatDateTime(response.duplicate_original_submitted_at) : 'earlier'}.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        updateResponseDuplicateStatus(formId || response.form_id, response.id, 'resolved_legitimate');
                        toast.success('Marked as Legitimate', 'This submission has been confirmed as a legitimate, non-duplicate response.');
                      }}
                      className="btn btn-sm bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold"
                    >
                      ✓ Mark as Legitimate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateResponseDuplicateStatus(formId || response.form_id, response.id, 'confirmed_duplicate');
                        toast.warning('Duplicate Confirmed', 'This submission has been confirmed as an actual duplicate.');
                      }}
                      className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    >
                      Confirm as Duplicate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Resolved notification */}
            {response.duplicate_status === 'resolved_legitimate' && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>This submission was reviewed and confirmed as legitimate by an administrator.</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
          <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button onClick={() => navigate(`/app/email?to=${response.participant_email}`)} className="btn btn-secondary btn-sm gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Send Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {[
          { id: 'info', label: 'Information', icon: <User className="h-3.5 w-3.5" /> },
          { id: 'documents', label: `Documents (${response.files.length})`, icon: <FileText className="h-3.5 w-3.5" /> },
          { id: 'notes', label: `Notes (${(response.notes ?? []).length})`, icon: <MessageSquare className="h-3.5 w-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Personal Information
            </h3>
            {renderInfoGrid(infoFields)}
          </div>

          {/* Academic Information */}
          {response.answers.some(a => academicFields.includes(a.field_label)) && (
            <div className="card">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building className="h-3.5 w-3.5" /> Academic Information
              </h3>
              {renderInfoGrid(academicFields)}
            </div>
          )}

          {/* Contact / Address */}
          {response.answers.some(a => contactFields.includes(a.field_label)) && (
            <div className="card">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Address
              </h3>
              {renderInfoGrid(contactFields)}
            </div>
          )}

          {/* Other answers */}
          {otherAnswers.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Other Fields
              </h3>
              <div className="space-y-3">
                {otherAnswers.map(a => (
                  <div key={a.id}>
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">{a.field_label}</p>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      {Array.isArray(a.value) ? a.value.join(', ') : a.value === null ? '—' : String(a.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          {response.files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">No documents uploaded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {response.files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-lg">
                  <div className="w-9 h-9 bg-[var(--color-primary-muted)] rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{file.field_label}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{file.name} · {formatFileSize(file.size)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Uploaded {formatDate(file.uploaded_at)}</p>
                  </div>
                  <StatusBadge status={file.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add note */}
          <div className="card">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Add Internal Note</h3>
            <textarea
              className="textarea w-full"
              rows={3}
              placeholder="Add a private note about this submission…"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button onClick={handleAddNote} disabled={!newNote.trim()} className="btn btn-primary btn-sm mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Note
            </button>
          </div>

          {/* Notes list */}
          {(response.notes ?? []).length === 0 ? (
            <div className="card text-center py-8">
              <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">No internal notes yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(response.notes ?? []).map((note: InternalNote) => (
                <div key={note.id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {getInitials(note.author_name)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">{note.author_name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{formatDateTime(note.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject confirmation */}
      <ConfirmDialog
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={() => {
          updateResponseStatus(formId || response.form_id, response.id, 'rejected');
          toast.success('Response rejected.');
          setConfirmReject(false);
        }}
        title="Reject Response"
        description="Are you sure you want to reject this response? The participant will not be automatically notified unless you send an email."
        confirmLabel="Reject"
        variant="destructive"
      />
    </div>
  );
}
