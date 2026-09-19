import { useState } from 'react';
import { Mail, Send, Users, Eye, FlaskConical, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/shared/Badge';
import { formatDateTime, interpolateTemplate } from '@/lib/utils';
import type { EmailTemplate } from '@/types';

type Tab = 'compose' | 'history';

export default function EmailCenterPage() {
  const { forms, responses, emailTemplates, emailLogs, sendEmail } = useDemo();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('compose');
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'filtered'>('all');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedForm = forms.find(f => f.id === selectedFormId);
  const formResponses = responses[selectedFormId] ?? [];
  const recipients = formResponses.filter(r => r.participant_email);

  function applyTemplate(tmpl: EmailTemplate) {
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setSelectedTemplateId(tmpl.id);
  }

  const sampleVars: Record<string, string> = {
    name: recipients[0]?.participant_name ?? 'Participant Name',
    email: recipients[0]?.participant_email ?? 'participant@email.com',
    response_id: recipients[0]?.response_id ?? 'INF-2026-00001',
    form_name: selectedForm?.title ?? 'Form Name',
    deadline: selectedForm?.settings.deadline ? new Date(selectedForm.settings.deadline).toLocaleDateString('en-IN') : 'N/A',
  };

  const previewSubject = interpolateTemplate(subject, sampleVars);
  const previewBody = interpolateTemplate(body, sampleVars);

  async function handleSend() {
    if (!subject || !body) {
      toast.error('Please fill in subject and message.');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));

    sendEmail({
      organization_id: 'org-demo-001',
      template_id: selectedTemplateId || undefined,
      template_name: emailTemplates.find(t => t.id === selectedTemplateId)?.name,
      form_id: selectedFormId,
      form_title: selectedForm?.title,
      recipients: recipients.map(r => r.participant_email!),
      recipient_count: recipients.length,
      subject,
      body,
      status: 'sent',
    });

    setSending(false);
    toast.success('Emails sent! (Demo)', `Email queued for ${recipients.length} recipients. In demo mode, no real emails are sent.`);
    setSubject('');
    setBody('');
    setSelectedTemplateId('');
    setTab('history');
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Center</h1>
          <p className="page-description">Communicate with participants using templates and bulk sending.</p>
        </div>
      </div>

      {/* Demo mode banner */}
      <div className="demo-banner">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Demo Mode:</strong> Email interface is fully functional but no real emails are sent in this demo environment.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {(['compose', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t === 'compose' ? 'Compose Email' : 'Email History'}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Compose panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Template selector */}
            <div className="card">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Choose a Template</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {emailTemplates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{tmpl.name}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{tmpl.subject}</p>
                  </button>
                ))}
                <button
                  onClick={() => { setSubject(''); setBody(''); setSelectedTemplateId(''); }}
                  className="p-3 rounded-lg border border-dashed border-[var(--color-border-strong)] text-left hover:border-[var(--color-primary)] text-[var(--color-text-muted)] text-xs hover:text-[var(--color-primary)] transition-colors"
                >
                  + Blank email
                </button>
              </div>
            </div>

            {/* Recipients */}
            <div className="card">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Recipients
              </h3>
              <div className="form-group mb-3">
                <label className="form-label">Select Form</label>
                <select className="select" value={selectedFormId} onChange={e => setSelectedFormId(e.target.value)}>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 py-2 bg-blue-50 border border-blue-100 rounded-lg px-3">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs text-blue-700">
                  <strong>{recipients.length}</strong> participants with email addresses
                </span>
              </div>
            </div>

            {/* Compose */}
            <div className="card space-y-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">Compose</h3>

              <div className="form-group">
                <label className="form-label required">Subject</label>
                <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" />
              </div>

              <div className="form-group">
                <label className="form-label required">Message</label>
                <textarea className="textarea" rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" />
                <p className="form-hint mt-1">
                  Variables: <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{response_id}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{form_name}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{deadline}}'}</code>
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setPreview(p => !p)} className="btn btn-secondary gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {preview ? 'Hide Preview' : 'Preview'}
                </button>
                <button onClick={handleSend} disabled={sending || !subject || !body} className="btn btn-primary gap-1.5">
                  <Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : `Send to ${recipients.length} recipients`}
                </button>
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">
                {preview ? 'Email Preview' : 'Tips'}
              </h3>
              {preview ? (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-[var(--color-border)]">
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">To</p>
                    <p className="text-xs text-[var(--color-text-primary)]">{sampleVars.name} &lt;{sampleVars.email}&gt;</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Subject</p>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{previewSubject || '(no subject)'}</p>
                  </div>
                  <div className="h-px bg-[var(--color-border)]" />
                  <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                    {previewBody || '(no message)'}
                  </pre>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
                  <p>• Use templates for consistent messaging</p>
                  <p>• Variables are replaced with each participant's data</p>
                  <p>• Preview before sending to verify the message</p>
                  <p>• All sent emails are logged in Email History</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card p-0 overflow-hidden">
          {emailLogs.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">No emails sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Template</th>
                    <th>Form</th>
                    <th>Recipients</th>
                    <th>Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map(log => (
                    <tr key={log.id}>
                      <td className="font-medium text-xs">{log.subject}</td>
                      <td className="text-xs text-[var(--color-text-muted)]">{log.template_name ?? '—'}</td>
                      <td className="text-xs text-[var(--color-text-muted)] max-w-[140px] truncate">{log.form_title ?? '—'}</td>
                      <td className="text-xs font-medium">{log.recipient_count}</td>
                      <td className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDateTime(log.sent_at)}</td>
                      <td><StatusBadge status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
