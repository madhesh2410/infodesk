import { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, XCircle, FileText, Sparkles } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AiResponseSummary } from '@/components/responses/AiResponseSummary';
import type { FormResponse } from '@/types';

const COLORS = ['#3730a3', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

function computeRealTimeSeries(responses: FormResponse[], days = 7) {
  const countsByDate: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    countsByDate[key] = 0;
  }

  for (const r of responses) {
    if (r.submitted_at) {
      const d = new Date(r.submitted_at);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (key in countsByDate) {
        countsByDate[key] += 1;
      } else {
        countsByDate[key] = (countsByDate[key] || 0) + 1;
      }
    }
  }

  return Object.entries(countsByDate).map(([date, count]) => ({ date, responses: count }));
}

export default function AnalyticsPage() {
  const { forms, responses } = useDemo();
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? '');

  const selectedForm = forms.find(f => f.id === selectedFormId);
  const formResponses = responses[selectedFormId] ?? [];

  const total = formResponses.length;
  const complete = formResponses.filter(r => r.status === 'complete').length;
  const incomplete = formResponses.filter(r => r.status === 'incomplete').length;
  const duplicates = formResponses.filter(r => r.is_duplicate && r.duplicate_status !== 'resolved_legitimate').length;
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Real Department distribution
  const deptData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    for (const r of formResponses) {
      const dept = r.department || r.answers?.find(a => a.field_label.toLowerCase().includes('department') || a.field_label.toLowerCase().includes('dept'))?.value;
      if (dept && typeof dept === 'string' && dept.trim()) {
        const d = dept.trim();
        deptMap[d] = (deptMap[d] || 0) + 1;
      }
    }
    return Object.entries(deptMap).map(([dept, count]) => ({ dept, count }));
  }, [formResponses]);

  // Real Status distribution
  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    for (const r of formResponses) {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    }
    return Object.entries(statusMap).map(([status, value]) => ({
      name: status.replace('_', ' '),
      value,
    }));
  }, [formResponses]);

  // Real Most Common Answers
  const commonAnswers = useMemo(() => {
    const counts: Record<string, { label: string; count: number; fieldLabel: string }> = {};
    for (const r of formResponses) {
      for (const a of r.answers || []) {
        if (a.value && typeof a.value === 'string' && a.value.length < 35 && !a.field_label.toLowerCase().includes('email') && !a.field_label.toLowerCase().includes('name') && !a.field_label.toLowerCase().includes('phone')) {
          const key = `${a.field_label}:${a.value}`;
          if (!counts[key]) {
            counts[key] = { label: a.value, count: 0, fieldLabel: a.field_label };
          }
          counts[key].count += 1;
        }
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [formResponses]);

  // Real Time series (no random generation!)
  const timeSeries = useMemo(() => computeRealTimeSeries(formResponses, 7), [formResponses]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900">Response Analytics</h1>
          <p className="page-description text-gray-500 mt-1">Real-time submission analytics, completion rates, and answers.</p>
        </div>
        <select
          className="select w-full sm:w-64"
          value={selectedFormId}
          onChange={e => setSelectedFormId(e.target.value)}
        >
          {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </div>

      {/* 4 Simple Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Responses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">All recorded submissions</p>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Complete Responses</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{complete}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{completionRate}% completion rate</p>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Incomplete Responses</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{incomplete}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Missing required answers</p>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Possible Duplicates</p>
          <p className={`text-2xl font-bold mt-1 ${duplicates > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {duplicates}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {duplicates > 0 ? 'Flagged for review' : 'Zero duplicates detected'}
          </p>
        </div>
      </div>

      {/* AI Response Summary Section */}
      {selectedForm?.settings?.ai_summary_enabled !== false && (
        <AiResponseSummary form={selectedForm} responses={formResponses} />
      )}

      {/* Responses Over Time (Real) */}
      <div className="card p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Responses Over Time (Last 7 Days)</h3>
        <p className="text-xs text-gray-500 mb-4">Daily submission volume strictly recorded from actual database timestamps.</p>
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="responses" stroke="#4f46e5" fill="url(#realGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Common Answers */}
        <div className="card p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Most Common Answers</h3>
          <p className="text-xs text-gray-500 mb-4">Top recurring answers across questions.</p>
          {commonAnswers.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No answer data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {commonAnswers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="min-w-0 pr-3">
                    <span className="font-semibold text-gray-900 block truncate">{item.label}</span>
                    <span className="text-[10px] text-gray-500 truncate block">Question: {item.fieldLabel}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--color-primary)] bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                    {item.count} response{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department / Status Distribution */}
        <div className="card p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Status & Department Breakdown</h3>
          <p className="text-xs text-gray-500 mb-4">Distribution by submission status.</p>
          {statusData.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No submissions recorded yet.
            </div>
          ) : (
            <div className="w-full h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={entry => `${entry.name} (${entry.value})`} fontSize={11}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
