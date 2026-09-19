import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  GripVertical, Plus, Trash2, Copy, Settings, Eye,
  ChevronDown, ChevronRight, Globe, Save, ArrowLeft,
  Type, AlignLeft, AtSign, Phone, Hash, Calendar,
  ChevronDownSquare, CircleDot, CheckSquare, ToggleLeft,
  Upload, ImageIcon, Minus, PenLine, X, AlertTriangle,
  Sparkles, Send, RefreshCw,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDemo } from '@/context/DemoContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateId, generateSlug } from '@/lib/utils';
import { refineFormSchema } from '@/lib/ai-form-generator';
import type { FormField, FieldType, FormSettings, FieldOption } from '@/types';
import { PublishDialog } from './PublishDialog';

// ─── Field type palette ────────────────────────────────────────────────────────

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'short_answer', label: 'Short Answer', icon: <Type className="h-3.5 w-3.5" /> },
  { type: 'long_answer',  label: 'Long Answer',  icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { type: 'email',        label: 'Email',         icon: <AtSign className="h-3.5 w-3.5" /> },
  { type: 'phone',        label: 'Phone',         icon: <Phone className="h-3.5 w-3.5" /> },
  { type: 'number',       label: 'Number',        icon: <Hash className="h-3.5 w-3.5" /> },
  { type: 'date',         label: 'Date',          icon: <Calendar className="h-3.5 w-3.5" /> },
  { type: 'dropdown',     label: 'Dropdown',      icon: <ChevronDownSquare className="h-3.5 w-3.5" /> },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: <CircleDot className="h-3.5 w-3.5" /> },
  { type: 'checkboxes',   label: 'Checkboxes',    icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { type: 'yes_no',       label: 'Yes / No',      icon: <ToggleLeft className="h-3.5 w-3.5" /> },
  { type: 'file_upload',  label: 'File Upload',   icon: <Upload className="h-3.5 w-3.5" /> },
  { type: 'image_upload', label: 'Image Upload',  icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { type: 'section',      label: 'Section',       icon: <Minus className="h-3.5 w-3.5" /> },
  { type: 'signature',    label: 'Signature',     icon: <PenLine className="h-3.5 w-3.5" /> },
];

// ─── Sortable Field Card ───────────────────────────────────────────────────────

function SortableFieldCard({
  field, isSelected, onSelect, onDelete, onDuplicate, formId,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  formId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (field.type === 'section') {
    return (
      <div ref={setNodeRef} style={style} onClick={onSelect}
        className={`relative border-b-2 pb-2 pt-3 cursor-pointer group ${isSelected ? 'border-[var(--color-primary)]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="drag-handle p-1 opacity-0 group-hover:opacity-100">
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">{field.section_title || 'Section'}</p>
            {field.section_description && <p className="text-[11px] text-[var(--color-text-secondary)]">{field.section_description}</p>}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="btn btn-ghost btn-sm p-1"><Copy className="h-3 w-3" /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="btn btn-ghost btn-sm p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`border rounded-lg p-3 cursor-pointer group transition-all ${
        isSelected ? 'border-[var(--color-primary)] shadow-sm bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="drag-handle p-1 mt-0.5 opacity-0 group-hover:opacity-100">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">{field.label || 'Untitled field'}</span>
            {field.required && <span className="text-red-500 text-xs">*</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-text-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
              {FIELD_TYPES.find(ft => ft.type === field.type)?.label ?? field.type}
            </span>
            {field.description && (
              <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">{field.description}</span>
            )}
            {field.conditional_logic?.enabled && (
              <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                Conditional
              </span>
            )}
          </div>
          {field.type === 'yes_no' && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 pointer-events-none">
              <label className="flex items-center gap-1.5 font-normal"><input type="radio" readOnly disabled className="accent-[var(--color-primary)]" /> Yes</label>
              <label className="flex items-center gap-1.5 font-normal"><input type="radio" readOnly disabled className="accent-[var(--color-primary)]" /> No</label>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="btn btn-ghost btn-sm p-1 text-[var(--color-text-muted)]"><Copy className="h-3 w-3" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="btn btn-ghost btn-sm p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Field Settings Panel ──────────────────────────────────────────────────────

function FieldSettingsPanel({ field, onChange, allFields }: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
  allFields: FormField[];
}) {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (!newOption.trim()) return;
    const option: FieldOption = { id: generateId(), label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') };
    onChange({ options: [...(field.options ?? []), option] });
    setNewOption('');
  };

  const removeOption = (id: string) => {
    onChange({ options: (field.options ?? []).filter(o => o.id !== id) });
  };

  const updateOption = (id: string, label: string) => {
    onChange({ options: (field.options ?? []).map(o => o.id === id ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, '_') } : o) });
  };

  const hasOptions = ['dropdown', 'multiple_choice', 'checkboxes'].includes(field.type);
  const isSection = field.type === 'section';

  if (isSection) {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Section Settings</h3>
        <div className="form-group">
          <label className="form-label">Section Title</label>
          <input className="input" value={field.section_title ?? ''} onChange={e => onChange({ section_title: e.target.value })} placeholder="Section Title" />
        </div>
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea className="textarea" value={field.section_description ?? ''} onChange={e => onChange({ section_description: e.target.value })} placeholder="Describe this section…" rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Field Settings</h3>

      <div className="form-group">
        <label className="form-label">Label</label>
        <input className="input" value={field.label} onChange={e => onChange({ label: e.target.value })} placeholder="Question label" />
      </div>

      <div className="form-group">
        <label className="form-label">Description / Help text</label>
        <textarea className="textarea" rows={2} value={field.description ?? ''} onChange={e => onChange({ description: e.target.value })} placeholder="Optional helper text…" />
      </div>

      {!['file_upload', 'image_upload', 'yes_no', 'date', 'signature'].includes(field.type) && (
        <div className="form-group">
          <label className="form-label">Placeholder</label>
          <input className="input" value={field.placeholder ?? ''} onChange={e => onChange({ placeholder: e.target.value })} placeholder="e.g. Enter your name…" />
        </div>
      )}

      {/* Options */}
      {hasOptions && (
        <div className="form-group">
          <label className="form-label">Options</label>
          <div className="space-y-1.5">
            {(field.options ?? []).map(opt => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <input
                  className="input flex-1 text-xs h-8"
                  value={opt.label}
                  onChange={e => updateOption(opt.id, e.target.value)}
                />
                <button onClick={() => removeOption(opt.id)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1.5 mt-1">
              <input
                className="input flex-1 text-xs h-8"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addOption(); }}
                placeholder="Add option…"
              />
              <button onClick={addOption} className="btn btn-secondary btn-sm shrink-0">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      {['number'].includes(field.type) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="form-group">
            <label className="form-label">Min</label>
            <input type="number" className="input" value={field.validation?.min ?? ''} onChange={e => onChange({ validation: { ...field.validation, min: Number(e.target.value) } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Max</label>
            <input type="number" className="input" value={field.validation?.max ?? ''} onChange={e => onChange({ validation: { ...field.validation, max: Number(e.target.value) } })} />
          </div>
        </div>
      )}

      {['file_upload', 'image_upload'].includes(field.type) && (
        <div className="form-group">
          <label className="form-label">Max file size (MB)</label>
          <input type="number" className="input" value={field.validation?.maxSizeMB ?? 10} onChange={e => onChange({ validation: { ...field.validation, maxSizeMB: Number(e.target.value) } })} min={1} max={50} />
        </div>
      )}

      {/* Required */}
      <div className="flex items-center justify-between py-2 border-t border-[var(--color-border)]">
        <label className="text-xs font-medium text-[var(--color-text-primary)]">Required field</label>
        <button
          onClick={() => onChange({ required: !field.required })}
          className={`relative w-10 h-5 rounded-full transition-colors ${field.required ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Conditional Logic */}
      <div className="border-t border-[var(--color-border)] pt-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">Smart Conditional Logic</label>
            <p className="text-[10px] text-[var(--color-text-muted)]">Show or hide based on previous answers</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const currentLogic = field.logic || field.conditional_logic;
              const nextEnabled = !currentLogic?.enabled;
              const newLogic = {
                enabled: nextEnabled,
                dependsOn: currentLogic?.dependsOn || currentLogic?.depends_on_field_id || '',
                depends_on_field_id: currentLogic?.dependsOn || currentLogic?.depends_on_field_id || '',
                condition: currentLogic?.condition || 'equals',
                operator: currentLogic?.operator || 'equals',
                value: currentLogic?.value || 'Yes',
                action: currentLogic?.action || 'show',
              };
              onChange({ logic: newLogic, conditional_logic: newLogic });
            }}
            className={`relative w-10 h-5 rounded-full transition-colors ${(field.logic?.enabled || field.conditional_logic?.enabled) ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(field.logic?.enabled || field.conditional_logic?.enabled) ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {(field.logic?.enabled || field.conditional_logic?.enabled) && (() => {
          const logic = field.logic || field.conditional_logic || { enabled: true, dependsOn: '', condition: 'equals', value: '' };
          const activeDepField = allFields.find(f => f.id === (logic.dependsOn || logic.depends_on_field_id));
          const isDepYesNo = activeDepField?.type === 'yes_no';
          const isDepChoice = activeDepField && ['dropdown', 'multiple_choice', 'checkboxes'].includes(activeDepField.type) && (activeDepField.options?.length ?? 0) > 0;

          return (
            <div className="space-y-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  WHEN QUESTION:
                </span>
                <select
                  className="select h-8 text-xs bg-white w-full border-blue-200"
                  value={logic.dependsOn || logic.depends_on_field_id || ''}
                  onChange={e => {
                    const depId = e.target.value;
                    const depF = allFields.find(f => f.id === depId);
                    const defaultVal = depF?.type === 'yes_no' ? 'Yes' : (depF?.options?.[0]?.label || '');
                    const updated = {
                      ...logic,
                      enabled: true,
                      dependsOn: depId,
                      depends_on_field_id: depId,
                      value: defaultVal,
                    };
                    onChange({ logic: updated, conditional_logic: updated });
                  }}
                >
                  <option value="">Select trigger question…</option>
                  {allFields.filter(f => f.id !== field.id && f.type !== 'section').map(f => (
                    <option key={f.id} value={f.id}>{f.label || 'Untitled'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                    IS:
                  </span>
                  <select
                    className="select h-8 text-xs bg-white w-full border-blue-200"
                    value={logic.operator || logic.condition || 'equals'}
                    onChange={e => {
                      const op = e.target.value as any;
                      const updated = { ...logic, condition: op, operator: op };
                      onChange({ logic: updated, conditional_logic: updated });
                    }}
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">does not equal</option>
                    <option value="contains">contains</option>
                    <option value="is_not_empty">is answered</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                    VALUE:
                  </span>
                  {isDepYesNo ? (
                    <select
                      className="select h-8 text-xs bg-white w-full border-blue-200"
                      value={logic.value || 'Yes'}
                      onChange={e => {
                        const updated = { ...logic, value: e.target.value };
                        onChange({ logic: updated, conditional_logic: updated });
                      }}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : isDepChoice ? (
                    <select
                      className="select h-8 text-xs bg-white w-full border-blue-200"
                      value={logic.value || ''}
                      onChange={e => {
                        const updated = { ...logic, value: e.target.value };
                        onChange({ logic: updated, conditional_logic: updated });
                      }}
                    >
                      <option value="">Select option…</option>
                      {activeDepField?.options?.map(opt => (
                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input h-8 text-xs bg-white w-full border-blue-200"
                      placeholder="e.g. Yes"
                      value={logic.value ?? ''}
                      onChange={e => {
                        const updated = { ...logic, value: e.target.value };
                        onChange({ logic: updated, conditional_logic: updated });
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  THEN:
                </span>
                <select
                  className="select h-8 text-xs bg-white w-full border-blue-200 font-medium"
                  value={logic.action || 'show'}
                  onChange={e => {
                    const updated = { ...logic, action: e.target.value as 'show' | 'hide' };
                    onChange({ logic: updated, conditional_logic: updated });
                  }}
                >
                  <option value="show">Show this question</option>
                  <option value="hide">Hide this question</option>
                </select>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Form Settings Panel ───────────────────────────────────────────────────────

function FormSettingsPanel({ settings, onChange }: {
  settings: FormSettings;
  onChange: (updates: Partial<FormSettings>) => void;
}) {
  const activeIdentifiers = settings.duplicate_identifiers ?? ['email', 'phone', 'student_id'];

  const toggleIdentifier = (id: string) => {
    if (activeIdentifiers.includes(id)) {
      onChange({ duplicate_identifiers: activeIdentifiers.filter(x => x !== id) });
    } else {
      onChange({ duplicate_identifiers: [...activeIdentifiers, id] });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Form Settings</h3>
        <p className="text-[11px] text-gray-500">Configure submissions, features, and smart rules.</p>
      </div>

      {/* Smart Feature Settings */}
      <div className="card p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3.5">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          Smart Features & Logic
        </h4>

        {/* 1. Conditional Logic Toggle */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-gray-800 block">Conditional Logic</label>
            <p className="text-[11px] text-gray-500">Enable dynamic show/hide questions based on answers.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ conditional_logic_enabled: settings.conditional_logic_enabled === false ? true : false })}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${settings.conditional_logic_enabled !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.conditional_logic_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* 2. Personal Profile Auto-Fill Toggle */}
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-gray-200">
          <div>
            <label className="text-xs font-semibold text-gray-800 block">Personal Profile Auto-Fill</label>
            <p className="text-[11px] text-gray-500">Auto-fill participant details (Name, Email, College, etc.) if stored.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ profile_autofill_enabled: settings.profile_autofill_enabled === false ? true : false })}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${settings.profile_autofill_enabled !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.profile_autofill_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* 3. AI Summary Toggle */}
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-gray-200">
          <div>
            <label className="text-xs font-semibold text-gray-800 block">AI Response Summary</label>
            <p className="text-[11px] text-gray-500">Compute AI analytics summary from stored responses.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ai_summary_enabled: settings.ai_summary_enabled === false ? true : false })}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${settings.ai_summary_enabled !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.ai_summary_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* 4. Duplicate Detection */}
        <div className="pt-2 border-t border-gray-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-800 block">Duplicate Detection</label>
              <p className="text-[11px] text-gray-500">Detect and flag repeat submissions without deleting them.</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ duplicate_detection_enabled: settings.duplicate_detection_enabled === false ? true : false })}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${settings.duplicate_detection_enabled !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.duplicate_detection_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {settings.duplicate_detection_enabled !== false && (
            <div className="pt-1.5 pl-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                Matching Identifiers:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'email', label: 'Email' },
                  { id: 'phone', label: 'Phone number' },
                  { id: 'student_id', label: 'Student / Employee ID' },
                  { id: 'id', label: 'Aadhaar / National ID' },
                ].map(ident => {
                  const active = activeIdentifiers.includes(ident.id);
                  return (
                    <button
                      key={ident.id}
                      type="button"
                      onClick={() => toggleIdentifier(ident.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium border transition-colors ${
                        active
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{ident.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* General Form Settings */}
      <div className="space-y-3 pt-1">
        <div className="form-group">
          <label className="form-label">Submission deadline</label>
          <input type="datetime-local" className="input" value={settings.deadline ? settings.deadline.slice(0, 16) : ''} onChange={e => onChange({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        </div>

        <div className="form-group">
          <label className="form-label">Confirmation message</label>
          <textarea className="textarea" rows={3} value={settings.confirmation_message} onChange={e => onChange({ confirmation_message: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Max file size (MB)</label>
          <input type="number" className="input" value={settings.max_file_size_mb} onChange={e => onChange({ max_file_size_mb: Number(e.target.value) })} min={1} max={100} />
        </div>

        {[
          { key: 'allow_multiple_submissions', label: 'Allow multiple submissions' },
          { key: 'allow_edit_after_submission', label: 'Allow editing after submission' },
          { key: 'require_email', label: 'Require email address' },
          { key: 'show_progress_bar', label: 'Show progress bar' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-text-primary)]">{label}</label>
            <button
              onClick={() => onChange({ [key]: !settings[key as keyof FormSettings] })}
              className={`relative w-10 h-5 rounded-full transition-colors ${settings[key as keyof FormSettings] ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key as keyof FormSettings] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Form Builder ─────────────────────────────────────────────────────────

export default function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { forms, createForm, updateForm } = useDemo();
  const toast = useToast();

  const isNew = formId === 'new';
  const existingForm = forms.find(f => f.id === formId);
  const locationState = location.state as { title?: string; description?: string; category?: string } | undefined;

  const [title, setTitle] = useState(existingForm?.title ?? locationState?.title ?? '');
  const [titleTouched, setTitleTouched] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasTitleInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(existingForm?.description ?? locationState?.description ?? '');
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields ?? []);
  const [settings, setSettings] = useState<FormSettings>(existingForm?.settings ?? {
    allow_multiple_submissions: false,
    allow_edit_after_submission: false,
    confirmation_message: 'Thank you! Your response has been submitted successfully.',
    require_email: true,
    max_file_size_mb: 10,
    allowed_file_types: ['image/jpeg', 'image/png', 'application/pdf'],
    show_progress_bar: true,
  });

  const { user } = useAuth();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'field' | 'form'>('field');
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(isNew ? null : formId ?? null);

  // AI Assist state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiAssist(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const refined = await refineFormSchema({ title, description, fields }, aiPrompt);
      setFields(refined.fields);
      if (refined.title) setTitle(refined.title);
      toast.success('Form updated!', 'AI Assist modified your form schema.');
      setAiPrompt('');
      setAiModalOpen(false);
    } catch {
      toast.error('AI Assist failed', 'Could not apply requested modification.');
    } finally {
      setAiLoading(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedField = fields.find(f => f.id === selectedFieldId) ?? null;

  const addField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      form_id: savedFormId ?? 'new',
      type,
      label: type === 'section' ? 'New Section' : '',
      required: false,
      order: fields.length,
      section_title: type === 'section' ? 'New Section' : undefined,
      options: type === 'yes_no'
        ? [
          { id: generateId(), label: 'Yes', value: 'Yes' },
          { id: generateId(), label: 'No', value: 'No' },
        ]
        : (['dropdown', 'multiple_choice', 'checkboxes'].includes(type)
          ? [
            { id: generateId(), label: 'Option 1', value: 'option_1' },
            { id: generateId(), label: 'Option 2', value: 'option_2' },
          ]
          : undefined),
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setRightPanel('field');
  }, [fields.length, savedFormId]);

  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId]);

  const duplicateField = useCallback((id: string) => {
    const original = fields.find(f => f.id === id);
    if (!original) return;
    const copy = { ...original, id: generateId(), label: original.label ? `${original.label} (copy)` : '' };
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, [fields]);

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields(prev => {
      const oldIndex = prev.findIndex(f => f.id === active.id);
      const newIndex = prev.findIndex(f => f.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
    });
  }

  async function handleSave(status?: 'draft' | 'published') {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Form name required', 'Please enter a name for the form before saving.');
      setTitleTouched(true);
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (canvasTitleInputRef.current) {
        canvasTitleInputRef.current.focus();
      }
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 300)); // simulate async

    const slug = generateSlug(trimmedTitle) + '-' + Date.now().toString(36);
    const formData = {
      organization_id: user?.organization_id ?? 'org-001',
      title: trimmedTitle,
      description,
      slug,
      status: status ?? (isNew ? 'draft' : (existingForm?.status ?? 'draft')),
      fields: fields.map((f, i) => ({ ...f, order: i })),
      settings,
      created_by: user?.id ?? 'user-001',
    };

    let fId = savedFormId;
    if (isNew && !savedFormId) {
      const newForm = createForm(formData as Parameters<typeof createForm>[0]);
      fId = newForm.id;
      setSavedFormId(newForm.id);
    } else if (fId) {
      updateForm(fId, formData);
    }

    setSaving(false);
    toast.success('Form saved', status === 'published' ? 'Your form has been published.' : 'Draft saved.');

    if (status === 'published' && fId) {
      updateForm(fId, { status: 'published' });
      setPublishOpen(true);
    }

    return fId;
  }

  const currentFormSlug = savedFormId ? forms.find(f => f.id === savedFormId)?.slug : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen -m-6 bg-[var(--color-bg)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-white border-b border-[var(--color-border)] shrink-0">
        <button onClick={() => navigate('/app/forms')} className="btn btn-ghost btn-sm p-1.5">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            ref={titleInputRef}
            className={`text-sm font-semibold bg-transparent border-none outline-none w-full truncate text-[var(--color-text-primary)] placeholder:text-gray-400 ${
              !title.trim() && titleTouched ? 'text-red-600' : ''
            }`}
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleTouched(false);
            }}
            placeholder="Enter form title (Required)…"
          />
          {!title.trim() && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
              Name required *
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAiModalOpen(true)}
            className="btn btn-secondary btn-sm gap-1.5 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
            title="Describe changes to make to this form with AI"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> ✨ AI Assist
          </button>
          <button
            onClick={() => navigate(savedFormId ? `/app/forms/${savedFormId}/preview` : '#')}
            className="btn btn-secondary btn-sm gap-1.5"
            disabled={!savedFormId && isNew}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button onClick={() => handleSave()} disabled={saving} className="btn btn-secondary btn-sm gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="btn btn-primary btn-sm gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Publish
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Field palette */}
        <div className="w-48 border-r border-[var(--color-border)] bg-white overflow-y-auto shrink-0 hidden md:block">
          <div className="p-3">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Field Types</p>
            <div className="space-y-0.5">
              {FIELD_TYPES.map(ft => (
                <button
                  key={ft.type}
                  onClick={() => addField(ft.type)}
                  className="flex items-center gap-2 w-full px-2 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] rounded-md transition-colors text-left"
                >
                  {ft.icon}
                  {ft.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form header */}
          <div className="max-w-2xl mx-auto">
            <div className="card mb-4 border-t-4 border-t-[var(--color-primary)]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  Form Name <span className="text-red-500 font-bold">*</span>
                </label>
                {!title.trim() && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Title required by user/admin
                  </span>
                )}
              </div>
              <input
                ref={canvasTitleInputRef}
                className={`text-base font-bold bg-transparent border-none outline-none w-full text-[var(--color-text-primary)] placeholder:text-gray-400 mb-1 ${
                  !title.trim() && titleTouched ? 'ring-1 ring-red-400 rounded px-1' : ''
                }`}
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleTouched(false);
                }}
                placeholder="Enter form title (Required)..."
              />
              <textarea
                className="text-sm bg-transparent border-none outline-none w-full resize-none text-[var(--color-text-secondary)] placeholder:text-gray-400"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Form description (optional)"
                rows={2}
              />
            </div>

            {/* Fields */}
            {fields.length === 0 ? (
              <div className="card border-2 border-dashed text-center py-12">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Add your first field</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">Click a field type on the left to add it to your form.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {FIELD_TYPES.slice(0, 4).map(ft => (
                    <button
                      key={ft.type}
                      onClick={() => addField(ft.type)}
                      className="btn btn-secondary btn-sm gap-1.5"
                    >
                      {ft.icon} {ft.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map(field => (
                      <SortableFieldCard
                        key={field.id}
                        field={field}
                        formId={savedFormId ?? 'new'}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => { setSelectedFieldId(field.id); setRightPanel('field'); }}
                        onDelete={() => deleteField(field.id)}
                        onDuplicate={() => duplicateField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add field buttons (mobile) */}
            <div className="mt-4 md:hidden">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Add Field</p>
              <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => addField(ft.type)} className="btn btn-secondary btn-sm gap-1">
                    {ft.icon} {ft.label}
                  </button>
                ))}
              </div>
            </div>

            {fields.length > 0 && (
              <button
                onClick={() => addField('short_answer')}
                className="mt-3 flex items-center gap-2 w-full px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Field
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Settings panel */}
        <div className="w-60 border-l border-[var(--color-border)] bg-white overflow-y-auto shrink-0 hidden lg:block">
          {/* Panel tabs */}
          <div className="flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setRightPanel('field')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${rightPanel === 'field' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              <Settings className="h-3.5 w-3.5" /> Field
            </button>
            <button
              onClick={() => setRightPanel('form')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${rightPanel === 'form' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              <Settings className="h-3.5 w-3.5" /> Form
            </button>
          </div>

          <div className="p-3">
            {rightPanel === 'field' ? (
              selectedField ? (
                <FieldSettingsPanel
                  field={selectedField}
                  onChange={updates => updateField(selectedField.id, updates)}
                  allFields={fields}
                />
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)]">Select a field to edit its settings.</p>
                </div>
              )
            ) : (
              <FormSettingsPanel settings={settings} onChange={updates => setSettings(s => ({ ...s, ...updates }))} />
            )}
          </div>
        </div>
      </div>

      {/* Publish dialog */}
      {savedFormId && (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          formId={savedFormId}
          slug={currentFormSlug ?? forms.find(f => f.id === savedFormId)?.slug ?? ''}
          title={title}
        />
      )}

      {/* AI Assist Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">AI Form Assistant</h3>
                  <p className="text-[11px] text-gray-500">Tell me what you want to change</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAiAssist} className="space-y-3">
              <textarea
                className="input text-xs min-h-[90px] resize-none"
                placeholder="e.g. Add an academic section with department dropdown, or add conditional hostel questions..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={aiLoading}
                autoFocus
              />

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Add an academic details section',
                    'Add fields for parent contact details',
                    'Make all document uploads required',
                    'Add conditional hostel questions',
                    'Make department a dropdown',
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setAiPrompt(sug)}
                      className="text-[11px] bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-900 px-2 py-1 rounded border border-gray-200 transition-colors text-left"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="btn btn-primary btn-sm gap-1.5"
                >
                  {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {aiLoading ? 'Updating…' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
