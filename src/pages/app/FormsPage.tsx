import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, FileText, MoreHorizontal, Eye, Edit,
  Share2, Copy, Archive, Trash2, Globe, X, Sparkles,
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/Dialog';
import { CreateFormModal } from '@/components/forms/CreateFormModal';
import { DuplicateFormModal } from '@/components/forms/DuplicateFormModal';
import { formatDate } from '@/lib/utils';
import type { Form, FormStatus } from '@/types';

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' },
];

export default function FormsPage() {
  const navigate = useNavigate();
  const { forms, deleteForm, duplicateForm, updateForm } = useDemo();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<Form | null>(null);

  const filtered = forms.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || f.status === activeTab;
    return matchSearch && matchTab;
  });

  function handleDuplicateClick(form: Form) {
    setDuplicateTarget(form);
    setMenuOpen(null);
  }

  function handlePerformDuplicate(formId: string, newTitle: string) {
    const copy = duplicateForm(formId, newTitle);
    toast.success('Form duplicated', `"${copy.title}" created as a draft.`);
    setDuplicateTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteForm(deleteTarget.id);
    toast.success('Form deleted', `"${deleteTarget.title}" has been deleted.`);
    setDeleteTarget(null);
  }

  function handleStatusChange(form: Form, status: FormStatus) {
    updateForm(form.id, { status });
    toast.success('Status updated', `Form is now ${status}.`);
    setMenuOpen(null);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Forms</h1>
          <p className="page-description">Create and manage your information collection forms.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/app/forms/ai" className="btn btn-primary shrink-0 gap-1.5 shadow-xs">
            <Sparkles className="h-4 w-4" />
            Create with AI
          </Link>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-secondary shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Manually
          </button>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              className="input pl-8 w-56 h-8 text-xs"
              placeholder="Search forms…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {search ? 'No forms match your search' : 'No forms in this workspace yet'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {search ? 'Try a different search term or clear the filter.' : 'Describe your form in plain English or build it step-by-step.'}
              </p>
            </div>
            {!search && (
              <div className="flex justify-center gap-2 pt-1">
                <Link to="/app/forms/ai" className="btn btn-primary btn-sm gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Create with AI
                </Link>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="btn btn-secondary btn-sm gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(form => (
                  <tr key={form.id} className="relative">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[var(--color-primary-muted)] rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[var(--color-text-primary)]">{form.title}</p>
                          {form.description && (
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[220px]">
                              {form.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={form.status} /></td>
                    <td className="font-medium text-xs">{form.response_count}</td>
                    <td className="text-xs text-[var(--color-text-muted)]">{formatDate(form.created_at)}</td>
                    <td className="text-xs text-[var(--color-text-muted)]">{formatDate(form.updated_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/app/forms/${form.id}/edit`)}
                          className="btn btn-ghost btn-sm p-1.5"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/app/forms/${form.id}/preview`)}
                          className="btn btn-ghost btn-sm p-1.5"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {form.status === 'published' && (
                          <button
                            onClick={() => navigate(`/app/forms/${form.id}/share`)}
                            className="btn btn-ghost btn-sm p-1.5"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* More menu */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === form.id ? null : form.id)}
                            className="btn btn-ghost btn-sm p-1.5"
                            title="More"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {menuOpen === form.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-8 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-20 w-44 animate-scale-in">
                                <button
                                  onClick={() => handleDuplicateClick(form)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                                >
                                  <Copy className="h-3.5 w-3.5" /> Duplicate
                                </button>
                                {form.status === 'published' && (
                                  <button
                                    onClick={() => handleStatusChange(form, 'closed')}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                                  >
                                    <X className="h-3.5 w-3.5" /> Close Form
                                  </button>
                                )}
                                {form.status === 'draft' && (
                                  <button
                                    onClick={() => { handleStatusChange(form, 'published'); navigate(`/app/forms/${form.id}/share`); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50"
                                  >
                                    <Globe className="h-3.5 w-3.5" /> Publish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(form, 'archived')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                                >
                                  <Archive className="h-3.5 w-3.5" /> Archive
                                </button>
                                <div className="my-1 h-px bg-gray-100" />
                                <button
                                  onClick={() => { setDeleteTarget(form); setMenuOpen(null); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Form"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone. All responses will be permanently deleted.`}
        confirmLabel="Delete Form"
        variant="destructive"
      />

      {/* Form Creation Modal requiring title */}
      <CreateFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Duplicate Form Modal requiring title */}
      <DuplicateFormModal
        open={!!duplicateTarget}
        onClose={() => setDuplicateTarget(null)}
        form={duplicateTarget}
        onDuplicate={handlePerformDuplicate}
      />
    </div>
  );
}
