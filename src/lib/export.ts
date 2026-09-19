import * as XLSX from 'xlsx';
import { formatDateTime } from './utils';
import type { FormResponse } from '@/types';

export function exportToExcel(responses: FormResponse[], formTitle: string): void {
  const rows = responses.map(r => ({
    'Response ID': r.response_id,
    'Name': r.participant_name ?? '',
    'Email': r.participant_email ?? '',
    'Phone': r.participant_phone ?? '',
    'Department': r.department ?? '',
    'Year': r.year ?? '',
    'Status': r.status.replace('_', ' '),
    'Submitted Date': formatDateTime(r.submitted_at),
    'Documents': r.files.length,
    'Documents Verified': r.files.filter(f => f.status === 'verified').length,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 16 },
    { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Responses');

  // Metadata sheet
  const meta = XLSX.utils.aoa_to_sheet([
    ['InfoDesk Export'],
    ['Form', formTitle],
    ['Exported', formatDateTime(new Date().toISOString())],
    ['Total Responses', responses.length],
  ]);
  XLSX.utils.book_append_sheet(wb, meta, 'Info');

  XLSX.writeFile(wb, `${formTitle.replace(/\s+/g, '_')}_responses.xlsx`);
}

export function exportToCSV(responses: FormResponse[], formTitle: string): void {
  const rows = responses.map(r => ({
    'Response ID': r.response_id,
    'Name': r.participant_name ?? '',
    'Email': r.participant_email ?? '',
    'Phone': r.participant_phone ?? '',
    'Department': r.department ?? '',
    'Year': r.year ?? '',
    'Status': r.status.replace('_', ' '),
    'Submitted Date': formatDateTime(r.submitted_at),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formTitle.replace(/\s+/g, '_')}_responses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
