import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Copy, BookTemplate, Layers, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Dialog } from '@/components/shared/Dialog';
import { CreateFormModal } from '@/components/forms/CreateFormModal';
import { PREBUILT_TEMPLATES, type PrebuiltTemplate } from '@/data/formTemplates';
import { generateSlug, generateId } from '@/lib/utils';
import type { FormField } from '@/types';

const CATEGORIES = ['All', 'Student', 'Academic', 'Events', 'Documents', 'Feedback', 'Registration', 'Administration'];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createForm } = useDemo();
  const toast = useToast();

  const [category, setCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<PrebuiltTemplate | null>(null);
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<PrebuiltTemplate | null>(null);

  const filtered = PREBUILT_TEMPLATES.filter(t => category === 'All' || t.category === category);

  function handleUseTemplate(tpl: PrebuiltTemplate) {
    setSelectedTemplateForCreate(tpl);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-description">Start from a pre-built template to save time with all fields preloaded.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              category === cat
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(tpl => {
          const inputCount = tpl.fields.filter(f => f.type !== 'section').length;
          const sectionCount = tpl.fields.filter(f => f.type === 'section').length;

          return (
            <div key={tpl.id} className="card card-hover flex flex-col justify-between border-gray-200 hover:border-indigo-200 transition-all shadow-xs">
              <div>
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
                    <BookTemplate className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50/80 px-1.5 py-0.5 rounded">
                      {tpl.category}
                    </span>
                    <h3 className="text-xs font-bold text-[var(--color-text-primary)] leading-snug mt-1">
                      {tpl.title}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-3 line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] font-medium mb-3 pt-2 border-t border-gray-100">
                  <span className="text-indigo-600 font-semibold">{inputCount} fields</span>
                  <span>•</span>
                  <span>{sectionCount > 0 ? `${sectionCount} sections` : 'Single section'}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">Ready to use</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(tpl)}
                    className="btn btn-primary btn-sm flex-1 justify-center text-xs py-1.5 gap-1 shadow-2xs"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="btn btn-ghost btn-sm p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200"
                    title="Preview template fields"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Field Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `${previewTemplate.title} — Field Preview` : 'Template Preview'}
        description={previewTemplate?.description}
      >
        {previewTemplate && (
          <div className="space-y-3.5 mt-2">
            <div className="flex items-center justify-between text-xs bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg text-indigo-900 font-medium">
              <span>Category: <strong>{previewTemplate.category}</strong></span>
              <span>Total Fields: <strong>{previewTemplate.fields.filter(f => f.type !== 'section').length} Preloaded Fields</strong></span>
            </div>

            {/* Scrollable list of preloaded fields */}
            <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
              {previewTemplate.fields.map((field, idx) => {
                if (field.type === 'section') {
                  return (
                    <div key={idx} className="pt-2 pb-1 border-b border-indigo-200 text-indigo-900 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>{field.section_title || field.label}</span>
                      <span className="text-[10px] text-indigo-500 lowercase font-normal">section</span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white border border-gray-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-[11px] font-mono">{field.order ?? idx}.</span>
                      <span className="font-medium text-gray-800 truncate">{field.label}</span>
                      {field.required && <span className="text-red-500 font-bold text-[10px]">*</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {field.options && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {field.options.length} options
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {field.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="btn btn-primary flex-1 justify-center text-xs py-2 gap-1.5 shadow-xs"
              >
                <span>Use This Template ({previewTemplate.fields.filter(f => f.type !== 'section').length} fields)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modal to ensure user/admin enters/confirms form name before creating */}
      <CreateFormModal
        open={!!selectedTemplateForCreate}
        onClose={() => setSelectedTemplateForCreate(null)}
        template={selectedTemplateForCreate}
      />
    </div>
  );
}
