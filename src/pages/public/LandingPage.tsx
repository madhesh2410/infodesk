import { Link } from 'react-router-dom';
import {
  Building2, ArrowRight, FileText, Users, FolderOpen,
  Download, Mail, ChevronRight, CheckCircle,
} from 'lucide-react';

const WHY_ITEMS = [
  { icon: <FileText className="h-5 w-5" />, title: 'Digital Form Creation', desc: 'Build professional forms with drag-and-drop. Add sections, conditions, and file uploads.' },
  { icon: <Users className="h-5 w-5" />, title: 'Structured Information Collection', desc: 'Collect responses from participants with validation, required fields, and multi-step flows.' },
  { icon: <FolderOpen className="h-5 w-5" />, title: 'Document Management', desc: 'Accept and verify uploaded documents. Track what is pending, verified, or missing.' },
  { icon: <CheckCircle className="h-5 w-5" />, title: 'Centralized Records', desc: 'Every participant response is stored in one place. Search, filter, and view complete profiles.' },
  { icon: <Download className="h-5 w-5" />, title: 'PDF & Excel Exports', desc: 'Generate structured PDFs per participant and export entire datasets to Excel in one click.' },
  { icon: <Mail className="h-5 w-5" />, title: 'Automated Communication', desc: 'Send confirmation and reminder emails using templates with dynamic participant variables.' },
];

const HOW_STEPS = [
  { num: '01', title: 'Create a Form', desc: 'Use the form builder to create sections, add fields, and configure settings.' },
  { num: '02', title: 'Share the Link', desc: 'Publish and share the form link or QR code with participants.' },
  { num: '03', title: 'Collect Responses', desc: 'Participants fill and submit the form with file uploads from any device.' },
  { num: '04', title: 'Manage Information', desc: 'View, search, filter, and update responses from your dashboard.' },
  { num: '05', title: 'Export & Communicate', desc: 'Export to Excel, generate PDFs, and send emails from one place.' },
];

const BUILT_FOR = [
  'Colleges & Universities',
  'Schools',
  'Coaching Centres',
  'Organizations',
  'Events & Conferences',
  'Administrative Teams',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-[var(--color-text-primary)]">InfoDesk</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Sign In</Link>
            <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span>Version 2026</span>
          <ChevronRight className="h-3 w-3" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight tracking-tight">
          InfoDesk
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[var(--color-primary)] mb-6 tracking-tight">
          Collect. Organize. Access.
        </p>
        <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          One platform to collect information, manage responses, organize documents, and communicate with your participants. Replace scattered forms and spreadsheets with one seamless workflow.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/login" className="btn btn-primary btn-lg gap-2">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        {/* Dashboard preview */}
        <div className="mt-16 relative">
          <div className="bg-[var(--color-bg)] border border-gray-200 rounded-2xl p-4 shadow-xl max-w-4xl mx-auto overflow-hidden">
            {/* Mock dashboard header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Forms', value: '4' },
                { label: 'Active Forms', value: '2' },
                { label: 'Total Responses', value: '609' },
                { label: 'Pending Review', value: '47' },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-lg p-3 text-left">
                  <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Recent Forms</span>
                <span className="text-[10px] text-[var(--color-primary)] font-medium">View all</span>
              </div>
              {[
                { name: 'Student Information Collection', status: 'Published', responses: '482' },
                { name: 'Workshop Registration', status: 'Published', responses: '127' },
                { name: 'Scholarship Application', status: 'Closed', responses: '312' },
              ].map(row => (
                <div key={row.name} className="px-3 py-2 flex items-center justify-between border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-700">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{row.status}</span>
                    <span className="text-[10px] text-gray-500">{row.responses}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why InfoDesk */}
      <section className="bg-[var(--color-bg)] border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-3">Why InfoDesk?</h2>
            <p className="text-[var(--color-text-secondary)]">Everything you need to manage institutional information — in one place.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_ITEMS.map(item => (
              <div key={item.title} className="card card-hover">
                <div className="w-9 h-9 bg-[var(--color-primary-muted)] rounded-lg flex items-center justify-center text-[var(--color-primary)] mb-3">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-3">How It Works</h2>
            <p className="text-[var(--color-text-secondary)]">From form creation to data export in five simple steps.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-px bg-gray-200" />
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {HOW_STEPS.map(step => (
                <div key={step.num} className="text-center relative">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold mx-auto mb-3 relative z-10">
                    {step.num}
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{step.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Built for */}
      <section className="bg-[var(--color-primary)] py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Built For</h2>
          <p className="text-indigo-200 text-sm mb-8">InfoDesk works for any institution that needs to collect and manage information.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {BUILT_FOR.map(item => (
              <div key={item} className="bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/login" className="btn btn-lg bg-white text-[var(--color-primary)] hover:bg-gray-50 border-0 font-semibold">
              Start Using InfoDesk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--color-primary)] rounded flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">InfoDesk</p>
              <p className="text-xs text-[var(--color-text-muted)]">Collect. Organize. Access.</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            © 2026 InfoDesk. Built for institutional information management.
          </p>
        </div>
      </footer>
    </div>
  );
}
