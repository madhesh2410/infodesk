import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, MessageSquare, TrendingUp, Clock,
  Plus, Eye, Mail, BookTemplate, ArrowRight,
  Activity, Sparkles, AlertTriangle,
} from 'lucide-react';
import { CreateFormModal } from '@/components/forms/CreateFormModal';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { StatusBadge } from '@/components/shared/Badge';
import { formatDate, timeAgo } from '@/lib/utils';

function getGreetingName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'there';
  const cleaned = fullName.trim();

  // Handle titles like Dr., Prof., Mr., Mrs., Ms.
  const titleMatch = cleaned.match(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|shri\.?|smt\.?)\s+(.*)$/i);
  if (titleMatch) {
    const title = titleMatch[1].replace(/\.?$/, '.');
    const rest = titleMatch[2].trim();
    const parts = rest.split(/\s+/).filter(Boolean);
    const mainName = parts.length > 0 ? parts[parts.length - 1].replace(/\.$/, '') : '';
    if (mainName) {
      return `${title} ${mainName}`;
    }
  }

  // Standard name: extract first name
  const firstWord = cleaned.split(/\s+/)[0];
  return firstWord.replace(/\.$/, '') || 'there';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { forms, responses, emailLogs } = useDemo();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const totalForms = forms.length;
  const allResponses = Object.values(responses).flat();
  const totalResponses = allResponses.length;
  const totalDocuments = allResponses.reduce((acc, r) => acc + (r.files?.length || 0), 0);
  const totalEmails = emailLogs?.length || 0;

  const stats = [
    { label: 'Forms', value: totalForms, icon: <FileText className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Responses', value: totalResponses, icon: <MessageSquare className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Documents', value: totalDocuments, icon: <FileText className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Emails', value: totalEmails, icon: <Mail className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
  ];

  const recentForms = forms.slice(0, 5);

  const greetingName = getGreetingName(user?.full_name);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Welcome back, {greetingName}.
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          {greeting}. Here's what's happening at {user?.organization_name || 'your institutional workspace'}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      {forms.length === 0 ? (
        <div className="card text-center py-16 px-6 border-2 border-dashed border-gray-200 bg-white space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Welcome to InfoDesk
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Describe what you want to collect and let our AI build the schema, or design your form step-by-step with the manual builder.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/app/forms/ai')}
              className="btn btn-primary gap-2 shadow-xs py-2.5 px-5"
            >
              <Sparkles className="h-4 w-4" /> Create with AI
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn btn-secondary gap-2 py-2.5 px-4"
            >
              <Plus className="h-4 w-4" /> Create Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Forms */}
          <div className="lg:col-span-2 card overflow-hidden p-0">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold">Recent Forms</h2>
              <Link to="/app/forms" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Form Name</th>
                    <th>Status</th>
                    <th>Responses</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentForms.map(form => (
                    <tr key={form.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[var(--color-primary-muted)] rounded flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)] text-xs">{form.title}</p>
                            {form.settings.deadline && (
                              <p className="text-[10px] text-[var(--color-text-muted)]">
                                Due {formatDate(form.settings.deadline)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={form.status} /></td>
                      <td className="font-medium text-xs">{(responses[form.id] ?? []).length || form.response_count}</td>
                      <td className="text-xs text-[var(--color-text-muted)]">{formatDate(form.created_at)}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/app/forms/${form.id}/edit`)}
                          className="btn btn-ghost btn-sm text-xs"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/app/forms/ai"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-all border text-xs font-medium bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Create with AI
                </Link>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-all border text-xs font-medium bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                >
                  <Plus className="h-4 w-4" />
                  Create Manually
                </button>
                <Link
                  to="/app/responses"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-all border text-xs font-medium bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                >
                  <Eye className="h-4 w-4" />
                  View Responses
                </Link>
                <Link
                  to="/app/email"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-all border text-xs font-medium bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {allResponses.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
                    No activity yet. Responses will appear here as participants submit your forms.
                  </p>
                ) : (
                  allResponses.slice(0, 5).map(resp => (
                    <div key={resp.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 bg-[var(--color-primary-muted)] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-[var(--color-primary)]">
                          {(resp.respondent_name || 'R').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-text-primary)] font-medium leading-snug">
                          New submission from {resp.respondent_name || resp.respondent_email || 'Participant'}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{timeAgo(resp.submitted_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Creation Modal requiring title */}
      <CreateFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
