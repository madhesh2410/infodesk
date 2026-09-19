import { useMemo } from 'react';
import type { Form, FormResponse } from '@/types';
import { Sparkles, AlertTriangle, CheckCircle2, Users, FileText, Info } from 'lucide-react';

interface AiResponseSummaryProps {
  form?: Form;
  responses: FormResponse[];
}

export function AiResponseSummary({ form, responses }: AiResponseSummaryProps) {
  const summary = useMemo(() => {
    const total = responses.length;
    if (total < 2) {
      return null;
    }

    const incomplete = responses.filter(r => r.status === 'incomplete').length;
    const complete = responses.filter(r => r.status === 'complete').length;
    const duplicates = responses.filter(r => r.is_duplicate && r.duplicate_status !== 'resolved_legitimate').length;
    const pendingReview = responses.filter(r => r.status === 'pending_review').length;
    const totalFiles = responses.reduce((acc, r) => acc + (r.files?.length || 0), 0);

    // Department counts
    const deptCounts: Record<string, number> = {};
    for (const r of responses) {
      const dept = r.department || r.answers?.find(a => a.field_label.toLowerCase().includes('department') || a.field_label.toLowerCase().includes('dept'))?.value;
      if (dept && typeof dept === 'string' && dept.trim()) {
        const d = dept.trim();
        deptCounts[d] = (deptCounts[d] || 0) + 1;
      }
    }
    const topDeptEntry = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
    const topDepartment = topDeptEntry ? topDeptEntry[0] : null;
    const topDeptPct = topDeptEntry ? Math.round((topDeptEntry[1] / total) * 100) : null;

    // Value frequencies across all answers
    const valCounts: Record<string, number> = {};
    let totalAnswersExamined = 0;
    for (const r of responses) {
      for (const a of r.answers || []) {
        if (a.value && typeof a.value === 'string' && a.value.length < 40) {
          const v = a.value.trim();
          valCounts[v] = (valCounts[v] || 0) + 1;
          totalAnswersExamined++;
        }
      }
    }
    const topValEntry = Object.entries(valCounts).sort((a, b) => b[1] - a[1])[0];
    const topSelectedValue = topValEntry ? topValEntry[0] : null;

    // Generate observations strictly from stored data
    const observations: string[] = [];

    const completionPct = Math.round((complete / total) * 100);
    observations.push(`${completionPct}% of respondents (${complete} of ${total}) submitted complete entries.`);

    if (duplicates > 0) {
      observations.push(`${duplicates} possible duplicate submission${duplicates > 1 ? 's were' : ' was'} detected and flagged.`);
    } else {
      observations.push('Zero duplicate submissions detected; all participants appear unique.');
    }

    if (topDepartment && topDeptPct !== null) {
      observations.push(`${topDepartment} is the most common department, representing ${topDeptPct}% of respondents.`);
    }

    if (pendingReview > 0) {
      observations.push(`${pendingReview} response${pendingReview > 1 ? 's require' : ' requires'} manual administrative review.`);
    }

    if (totalFiles > 0) {
      observations.push(`${totalFiles} file attachment${totalFiles > 1 ? 's have' : ' has'} been uploaded by respondents.`);
    }

    return {
      total,
      incomplete,
      complete,
      duplicates,
      pendingReview,
      topDepartment,
      topDeptPct,
      topSelectedValue,
      observations,
    };
  }, [responses]);

  if (!summary) {
    return (
      <div className="card bg-gradient-to-r from-blue-50/50 to-indigo-50/40 border border-blue-200/70 p-4 rounded-xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100/80 rounded-lg text-blue-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              AI Response Summary
              <span className="text-[11px] font-normal text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                Live Analysis
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Not enough responses to generate meaningful insights. Collect at least 2 responses to generate statistical observations and department distributions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 border border-indigo-200/80 p-5 rounded-xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-indigo-100/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[var(--color-primary)] text-white rounded-lg shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">AI Response Summary</h3>
            <p className="text-[11px] text-gray-500">Real-time statistics computed strictly from actual stored submissions.</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
          {summary.total} responses analyzed
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Received</span>
          <span className="text-xl font-bold text-gray-900 mt-0.5 block">{summary.total}</span>
          <span className="text-[10px] text-emerald-600 font-medium">100% recorded</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Incomplete</span>
          <span className="text-xl font-bold text-gray-900 mt-0.5 block">{summary.incomplete}</span>
          <span className="text-[10px] text-amber-600 font-medium">
            {summary.total > 0 ? Math.round((summary.incomplete / summary.total) * 100) : 0}% of total
          </span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Possible Duplicates</span>
          <span className={`text-xl font-bold mt-0.5 block ${summary.duplicates > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {summary.duplicates}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {summary.duplicates > 0 ? 'Requires review' : 'None detected'}
          </span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Top Department</span>
          <span className="text-xs font-bold text-gray-900 mt-1.5 block truncate" title={summary.topDepartment || 'N/A'}>
            {summary.topDepartment || 'N/A'}
          </span>
          <span className="text-[10px] text-indigo-600 font-medium">
            {summary.topDeptPct !== null ? `${summary.topDeptPct}% representation` : 'No dept data'}
          </span>
        </div>
      </div>

      {/* Observations */}
      <div className="bg-white/80 rounded-lg p-3.5 border border-indigo-100">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          Important Observations
        </h4>
        <ul className="space-y-1.5">
          {summary.observations.map((obs, idx) => (
            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
