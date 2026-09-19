import { useState } from 'react';
import { Search, Filter, FileText, Image, CheckCircle, Clock, X } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { StatusBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, formatFileSize } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import type { UploadedFile } from '@/types';
import { useNavigate } from 'react-router-dom';

const FILE_FILTERS = ['All', 'Images', 'PDFs', 'Pending', 'Verified'];

export default function DocumentsPage() {
  const { responses, forms } = useDemo();
  const toast = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Gather all files from all responses
  const allFiles: (UploadedFile & { participantName: string; responseId: string; formTitle: string; responseDbId: string; formId: string })[] = [];

  for (const [formId, formResponses] of Object.entries(responses)) {
    const form = forms.find(f => f.id === formId);
    for (const resp of formResponses) {
      for (const file of resp.files) {
        allFiles.push({
          ...file,
          participantName: resp.participant_name ?? 'Unknown',
          responseId: resp.response_id,
          responseDbId: resp.id,
          formTitle: form?.title ?? 'Unknown Form',
          formId,
        });
      }
    }
  }

  const filtered = allFiles.filter(f => {
    const matchSearch = !search ||
      f.participantName.toLowerCase().includes(search.toLowerCase()) ||
      f.field_label.toLowerCase().includes(search.toLowerCase()) ||
      f.responseId.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'All' ||
      (filter === 'Images' && f.type.startsWith('image')) ||
      (filter === 'PDFs' && f.type === 'application/pdf') ||
      (filter === 'Pending' && f.status === 'pending') ||
      (filter === 'Verified' && f.status === 'verified');

    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-description">All uploaded documents from form responses.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: allFiles.length, icon: <FileText className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Verified', value: allFiles.filter(f => f.status === 'verified').length, icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
          { label: 'Pending', value: allFiles.filter(f => f.status === 'pending').length, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Images', value: allFiles.filter(f => f.type.startsWith('image')).length, icon: <Image className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex gap-1 flex-wrap">
            {FILE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              className="input pl-8 w-48 h-8 text-xs"
              placeholder="Search participant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents found"
            description="Documents uploaded by participants will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Document</th>
                  <th>Form</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(file => (
                  <tr key={file.id}>
                    <td>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{file.participantName}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{file.responseId}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--color-primary-muted)] rounded flex items-center justify-center shrink-0">
                          {file.type.startsWith('image') ? <Image className="h-3.5 w-3.5 text-[var(--color-primary)]" /> : <FileText className="h-3.5 w-3.5 text-[var(--color-primary)]" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{file.field_label}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">{file.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[var(--color-text-muted)] max-w-[120px] truncate">{file.formTitle}</td>
                    <td className="text-[10px] text-[var(--color-text-muted)]">{file.type === 'application/pdf' ? 'PDF' : 'Image'}</td>
                    <td className="text-xs text-[var(--color-text-muted)]">{file.size > 0 ? formatFileSize(file.size) : '—'}</td>
                    <td className="text-xs text-[var(--color-text-muted)]">{formatDate(file.uploaded_at)}</td>
                    <td><StatusBadge status={file.status} /></td>
                    <td>
                      <button
                        onClick={() => navigate(`/app/responses/${file.responseDbId}?form=${file.formId}`)}
                        className="btn btn-ghost btn-sm p-1.5 text-xs"
                        title="View profile"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
