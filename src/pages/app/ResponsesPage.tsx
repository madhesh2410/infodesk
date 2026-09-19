import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Download, Filter, X, ChevronDown,
  FileText, Eye, MessageSquare, AlertTriangle,
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { StatusBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { exportToExcel, exportToCSV } from '@/lib/export';
import { AiResponseSummary } from '@/components/responses/AiResponseSummary';
import type { ResponseStatus } from '@/types';
import { useToast } from '@/context/ToastContext';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Complete', value: 'complete' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Rejected', value: 'rejected' },
];

const DEPT_OPTIONS = ['All Departments', 'CS', 'ME', 'ECE', 'CE', 'IT'];
const YEAR_OPTIONS = ['All Years', '1', '2', '3', '4'];
const PAGE_SIZE = 15;

export default function ResponsesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { forms, responses } = useDemo();
  const toast = useToast();

  const defaultFormId = searchParams.get('form') ?? forms[0]?.id ?? '';
  const [selectedFormId, setSelectedFormId] = useState(defaultFormId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const selectedForm = forms.find(f => f.id === selectedFormId);
  const formResponses = responses[selectedFormId] ?? [];
  const duplicateCount = formResponses.filter(r => r.is_duplicate && r.duplicate_status !== 'resolved_legitimate').length;

  const filtered = useMemo(() => {
    return formResponses.filter(r => {
      const searchLower = search.toLowerCase();
      const matchSearch = !search || [
        r.participant_name, r.participant_email, r.participant_phone,
        r.response_id, r.department,
      ].some(v => v?.toLowerCase().includes(searchLower));

      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchDept = deptFilter === 'All Departments' || r.department === deptFilter;
      const matchYear = yearFilter === 'All Years' || r.year === yearFilter;
      const matchDuplicates = !duplicatesOnly || Boolean(r.is_duplicate && r.duplicate_status !== 'resolved_legitimate');
      return matchSearch && matchStatus && matchDept && matchYear && matchDuplicates;
    });
  }, [formResponses, search, statusFilter, deptFilter, yearFilter, duplicatesOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setDeptFilter('All Departments');
    setYearFilter('All Years');
    setDuplicatesOnly(false);
  }

  const hasFilters = search || statusFilter !== 'all' || deptFilter !== 'All Departments' || yearFilter !== 'All Years' || duplicatesOnly;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="page-header">
        <div>
          <h1 className="page-title">Responses</h1>
          <p className="page-description">View, analyze, and manage form submissions and duplicate reviews.</p>
        </div>
      </div>

      {/* Form selector & Quick stats */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="form-group flex-1 max-w-xs">
          <label className="form-label">Viewing responses for</label>
          <select
            className="select"
            value={selectedFormId}
            onChange={e => { setSelectedFormId(e.target.value); setPage(1); clearFilters(); }}
          >
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>

        {selectedForm && (
          <div className="flex items-center gap-2 mt-4">
            <span className="badge badge-neutral">
              Total: {formResponses.length}
            </span>
            {duplicateCount > 0 && (
              <button
                type="button"
                onClick={() => { setDuplicatesOnly(!duplicatesOnly); setPage(1); }}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 transition-colors ${
                  duplicatesOnly
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                {duplicateCount} Possible Duplicate{duplicateCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Response Summary */}
      {selectedForm?.settings?.ai_summary_enabled !== false && (
        <AiResponseSummary form={selectedForm} responses={formResponses} />
      )}

      {/* Filters + search */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              className="input pl-8 w-56 h-8 text-xs"
              placeholder="Search name, email, ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status */}
          <select
            className="select h-8 text-xs w-40"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Department */}
          <select
            className="select h-8 text-xs w-36"
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
          >
            {DEPT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Year */}
          <select
            className="select h-8 text-xs w-28"
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1); }}
          >
            {YEAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm gap-1 text-xs text-red-500">
              <X className="h-3 w-3" /> Clear Filters
            </button>
          )}

          {/* Export */}
          <div className="sm:ml-auto relative">
            <button
              onClick={() => setExportMenuOpen(o => !o)}
              className="btn btn-secondary btn-sm gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export
              <ChevronDown className="h-3 w-3" />
            </button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 top-9 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-20 w-40 animate-scale-in">
                  <button
                    onClick={() => { exportToExcel(filtered, selectedForm?.title ?? 'Responses'); setExportMenuOpen(false); toast.success('Excel exported!'); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => { exportToCSV(filtered, selectedForm?.title ?? 'Responses'); setExportMenuOpen(false); toast.success('CSV exported!'); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        {pageItems.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No responses found"
            description={hasFilters ? 'Try adjusting your filters.' : 'No responses have been submitted yet.'}
            action={hasFilters ? <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Response ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Dept</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Docs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(resp => (
                  <tr key={resp.id}>
                    <td className="font-mono text-xs font-semibold text-[var(--color-primary)]">{resp.response_id}</td>
                    <td className="font-medium text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{resp.participant_name ?? '—'}</span>
                        {resp.is_duplicate && resp.duplicate_status !== 'resolved_legitimate' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full" title={`Duplicate of ${resp.duplicate_of_response_id || 'earlier response'}`}>
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Duplicate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-[var(--color-text-muted)] max-w-[160px] truncate">{resp.participant_email ?? '—'}</td>
                    <td className="text-xs">{resp.department ?? '—'}</td>
                    <td className="text-xs">{resp.year ?? '—'}</td>
                    <td><StatusBadge status={resp.status} /></td>
                    <td className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDateTime(resp.submitted_at)}</td>
                    <td className="text-xs text-center">
                      {resp.files.length > 0 ? (
                        <span className="text-green-600 font-medium">{resp.files.length} ✓</span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/app/responses/${resp.id}?form=${selectedFormId}`)}
                        className="btn btn-ghost btn-sm p-1.5"
                        title="View profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-ghost btn-sm px-2">←</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`btn btn-sm px-2.5 ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="text-xs text-[var(--color-text-muted)] px-1">…</span>}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-ghost btn-sm px-2">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
