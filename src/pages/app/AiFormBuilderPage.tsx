import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, RefreshCw, Send, CheckCircle2,
  Sliders, Eye, Plus, ArrowRight, Globe, Save,
  HelpCircle, AlertCircle, FileText, Check, ShieldCheck,
  ChevronUp, ChevronDown, Trash2, Layers, PlusCircle, X
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateFormFromPrompt, refineFormSchema, type GeneratedFormSchema } from '@/lib/ai-form-generator';
import { generateSlug, generateId } from '@/lib/utils';
import type { FormField, FieldType, FieldOption } from '@/types';
import { PublishDialog } from './PublishDialog';

const INSPIRATION_PROMPTS = [
  'name,college,id,dept,sec id,mail,pic',
  'name,email,phone,address,dob,gender,photo,id proof,certificate',
  'Student registration form with name, register number, department, year, email, phone and photo.',
  'Workshop registration with participant name, email, phone, department, preferred session and ID card upload.',
  'Hostel accommodation application with room preference and conditional local guardian details.',
  'Student information form with documents. Ask hostel name and room number only if hostel student is yes.',
];

const LOADING_MESSAGES = [
  'Understanding your request...',
  'Building fields...',
  'Organizing sections...',
  'Validating fields...',
  'Form ready.',
];

const AVAILABLE_FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'short_answer', label: 'Short Answer' },
  { type: 'long_answer', label: 'Long Answer' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone Number' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'multiple_choice', label: 'Multiple Choice' },
  { type: 'checkboxes', label: 'Checkboxes' },
  { type: 'yes_no', label: 'Yes / No' },
  { type: 'file_upload', label: 'File Upload' },
  { type: 'image_upload', label: 'Image Upload' },
  { type: 'signature', label: 'Signature' },
];

export default function AiFormBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createForm } = useDemo();
  const toast = useToast();

  const [prompt, setPrompt] = useState('');
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [schema, setSchema] = useState<GeneratedFormSchema | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishedForm, setPublishedForm] = useState<any>(null);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);

  // Trigger form generation
  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setLoadingStep(0);

    const stepTimer1 = setTimeout(() => setLoadingStep(1), 500);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), 1000);
    const stepTimer3 = setTimeout(() => setLoadingStep(3), 1500);
    const stepTimer4 = setTimeout(() => setLoadingStep(4), 2000);

    try {
      const generated = await generateFormFromPrompt(prompt);
      setSchema(generated);
      if (generated.fields.length > 0) {
        const firstInput = generated.fields.find(f => f.type !== 'section');
        if (firstInput) setSelectedFieldId(firstInput.id);
      }
      toast.success('Form generated!', `${generated.summary?.generatedFieldCount ?? generated.fields.length} fields created successfully.`);
    } catch (err: any) {
      toast.error('Generation failed', 'Unable to generate the form structure. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setLoading(false);
    }
  }

  // Follow-up refinement
  async function handleRefine(e: React.FormEvent) {
    e.preventDefault();
    if (!refinementPrompt.trim() || !schema || loading) return;

    setLoading(true);
    setLoadingStep(0);

    try {
      const updated = await refineFormSchema(schema, refinementPrompt);
      setSchema(updated);
      setRefinementPrompt('');
      toast.success('Form updated!', 'Applied your requested modifications.');
    } catch (err: any) {
      toast.error('Refinement failed', 'Could not apply changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Reordering fields
  function handleMoveField(fieldId: string, direction: 'up' | 'down') {
    if (!schema) return;
    const index = schema.fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schema.fields.length) return;

    const newFields = [...schema.fields];
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, moved);

    setSchema({
      ...schema,
      fields: newFields,
    });
    setSelectedFieldId(fieldId);
  }

  // Split non-section questions evenly into 2 sections
  function handleSplitInto2Sections() {
    if (!schema) return;
    const questions = schema.fields.filter(f => f.type !== 'section');
    if (questions.length < 2) {
      toast.error('Not enough questions', 'Need at least 2 questions to divide into sections.');
      return;
    }
    const mid = Math.ceil(questions.length / 2);
    const part1 = questions.slice(0, mid);
    const part2 = questions.slice(mid);

    const newFields: FormField[] = [
      {
        id: `sec-${generateId()}`,
        type: 'section',
        label: 'Section 1',
        section_title: 'Section 1',
        section_description: 'Basic Information',
        required: false,
      },
      ...part1,
      {
        id: `sec-${generateId()}`,
        type: 'section',
        label: 'Section 2',
        section_title: 'Section 2',
        section_description: 'Additional Details',
        required: false,
      },
      ...part2,
    ];

    setSchema({
      ...schema,
      fields: newFields,
    });
    toast.success('Sections created!', `Divided ${questions.length} questions into 2 sections.`);
  }

  // Remove all section dividers
  function handleRemoveSections() {
    if (!schema) return;
    const questions = schema.fields.filter(f => f.type !== 'section');
    setSchema({
      ...schema,
      fields: questions,
    });
    toast.success('Sections removed', 'All questions are now in a single section.');
  }

  // Delete a field
  function handleDeleteField(fieldId: string) {
    if (!schema) return;
    const newFields = schema.fields.filter(f => f.id !== fieldId);
    setSchema({
      ...schema,
      fields: newFields,
    });
    if (selectedFieldId === fieldId) {
      const nextField = newFields.find(f => f.type !== 'section');
      setSelectedFieldId(nextField ? nextField.id : null);
    }
    toast.success('Field removed');
  }

  // Add field manually
  function handleAddField(type: FieldType) {
    if (!schema) return;
    const id = `fld-${generateId()}`;
    const typeObj = AVAILABLE_FIELD_TYPES.find(t => t.type === type);
    const label = typeObj ? `New ${typeObj.label}` : 'New Question';

    let options: FieldOption[] | undefined;
    if (type === 'dropdown' || type === 'multiple_choice' || type === 'checkboxes') {
      options = [
        { id: `opt-${generateId()}`, label: 'Option 1', value: 'Option 1' },
        { id: `opt-${generateId()}`, label: 'Option 2', value: 'Option 2' },
      ];
    }

    const newField: FormField = {
      id,
      type,
      label,
      required: true,
      options,
      conditional_logic: { enabled: false },
    };

    setSchema({
      ...schema,
      fields: [...schema.fields, newField],
    });
    setSelectedFieldId(id);
    setShowAddFieldMenu(false);
    toast.success('Field added');
  }

  // Save as Draft
  function handleSaveDraft(): string {
    if (!schema) return '';
    const trimmedTitle = schema.title?.trim();
    if (!trimmedTitle) {
      toast.error('Form name required', 'Please enter a name for the form before saving.');
      return '';
    }
    const newForm = createForm({
      organization_id: user?.organization_id ?? 'org-001',
      created_by: user?.id ?? 'user-001',
      title: trimmedTitle,
      description: schema.description,
      category: schema.category || 'General',
      slug: generateSlug(trimmedTitle),
      status: 'draft',
      fields: schema.fields,
      settings: {
        require_login: false,
        allow_multiple: false,
        send_email_receipt: true,
        collect_documents: schema.fields.some(f => f.type === 'file_upload' || f.type === 'image_upload'),
      },
    });
    toast.success('Draft saved!', 'You can now customize or publish your form.');
    return newForm.id;
  }

  // Open manual builder with this schema
  function handleEditInBuilder() {
    const formId = handleSaveDraft();
    if (formId) {
      navigate(`/app/forms/${formId}/edit`);
    }
  }

  // Publish form
  function handlePublish() {
    if (!schema) return;
    const trimmedTitle = schema.title?.trim();
    if (!trimmedTitle) {
      toast.error('Form name required', 'Please enter a name for the form before publishing.');
      return;
    }
    const newForm = createForm({
      organization_id: user?.organization_id ?? 'org-001',
      created_by: user?.id ?? 'user-001',
      title: trimmedTitle,
      description: schema.description,
      category: schema.category || 'General',
      slug: generateSlug(trimmedTitle),
      status: 'published',
      fields: schema.fields,
      settings: {
        require_login: false,
        allow_multiple: false,
        send_email_receipt: true,
        collect_documents: schema.fields.some(f => f.type === 'file_upload' || f.type === 'image_upload'),
      },
    });
    setPublishedForm(newForm);
    setPublishDialogOpen(true);
  }

  const selectedField = schema?.fields.find(f => f.id === selectedFieldId);

  // Update a field property in local schema preview
  function updateSelectedField(updates: Partial<FormField>) {
    if (!schema || !selectedFieldId) return;
    setSchema(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map(f => f.id === selectedFieldId ? { ...f, ...updates } : f),
      };
    });
  }

  // Option handlers
  function handleAddOption() {
    if (!selectedField) return;
    const newOpt: FieldOption = {
      id: `opt-${generateId()}`,
      label: `Option ${(selectedField.options?.length || 0) + 1}`,
      value: `Option ${(selectedField.options?.length || 0) + 1}`,
    };
    updateSelectedField({
      options: [...(selectedField.options || []), newOpt],
    });
  }

  function handleRemoveOption(optId: string) {
    if (!selectedField || !selectedField.options) return;
    updateSelectedField({
      options: selectedField.options.filter(o => o.id !== optId),
    });
  }

  function handleUpdateOption(optId: string, label: string) {
    if (!selectedField || !selectedField.options) return;
    updateSelectedField({
      options: selectedField.options.map(o => o.id === optId ? { ...o, label, value: label } : o),
    });
  }

  const inputFieldsCount = schema?.fields.filter(f => f.type !== 'section').length ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/forms')}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-gray-100 text-[var(--color-text-secondary)] transition-colors"
            title="Back to Forms"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-base font-bold text-[var(--color-text-primary)]">Create with AI</h1>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                Natural Language Generator
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Describe your form in plain English — InfoDesk builds and validates every requested field.
            </p>
          </div>
        </div>

        {schema && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditInBuilder}
              className="btn btn-secondary text-xs py-1.5 gap-1.5"
              title="Open form in full manual builder"
            >
              <Sliders className="h-3.5 w-3.5" /> Edit in Builder
            </button>
            <button
              onClick={handlePublish}
              className="btn btn-primary text-xs py-1.5 gap-1.5 shadow-xs"
              title="Publish form"
            >
              <Globe className="h-3.5 w-3.5" /> Publish Form
            </button>
          </div>
        )}
      </div>

      {/* Clean Status Banner */}
      {schema && (
        <div className="bg-white border border-indigo-100 rounded-lg px-3.5 py-2 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-gray-900">Form Generated</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{inputFieldsCount} fields generated in your prompt order</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {schema.fields.filter(f => f.type === 'section').length} Sections
            </span>
          </div>
        </div>
      )}

      {/* Main 3-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: AI Prompt & Chat Refinement */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card space-y-4 border-indigo-100 shadow-sm">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider block mb-1">
                What information do you need to collect?
              </label>
              <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">
                Enter comma-separated fields or describe the full form in natural language.
              </p>
              <textarea
                className="input text-xs min-h-[110px] resize-y leading-relaxed"
                placeholder="Example: name, college, id, dept, sec id, mail, pic"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="btn btn-primary w-full justify-center text-xs py-2.5 gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{LOADING_MESSAGES[loadingStep]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Form</span>
                </>
              )}
            </button>

            {/* Quick Inspiration Chips */}
            {!schema && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-[11px] font-semibold text-[var(--color-text-muted)] mb-2">
                  Sample Prompts (Click to test):
                </p>
                <div className="space-y-1.5">
                  {INSPIRATION_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="w-full text-left text-[11px] p-2 rounded-lg bg-gray-50 hover:bg-indigo-50/70 hover:text-indigo-900 border border-gray-200 transition-colors text-[var(--color-text-secondary)] line-clamp-2"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Follow-Up Refinement Card */}
          {schema && (
            <div className="card space-y-3 bg-gradient-to-b from-indigo-50/40 to-white border-indigo-200 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Want to change anything?</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Instruct the AI to add fields, change types to dropdowns, remove questions, or add conditional logic. Existing fields are preserved.
              </p>
              <form onSubmit={handleRefine} className="space-y-2">
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Add parent phone number and make department a dropdown"
                  value={refinementPrompt}
                  onChange={e => setRefinementPrompt(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !refinementPrompt.trim()}
                  className="btn btn-secondary w-full justify-center text-xs py-2 gap-1.5 font-medium"
                >
                  <Send className="h-3 w-3" /> Update Form
                </button>
              </form>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Live Interactive Form Preview */}
        <div className="lg:col-span-5 space-y-3">
          {schema ? (
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden animate-fade-in">
              {/* Form Title Banner */}
              <div className="p-5 border-b border-[var(--color-border)] bg-gray-50/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Form Name</span>
                      <span className="text-red-500 font-bold text-xs">*</span>
                      {!schema.title?.trim() && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded ml-1">
                          Required
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={schema.title}
                      onChange={e => setSchema({ ...schema, title: e.target.value })}
                      className={`text-base font-bold text-[var(--color-text-primary)] bg-transparent hover:bg-white focus:bg-white border rounded px-1.5 py-0.5 -ml-1.5 transition-all outline-none w-full ${
                        !schema.title?.trim() ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200' : 'border-transparent hover:border-gray-300 focus:border-indigo-500'
                      }`}
                      placeholder="Enter form title (Required)..."
                      title="Click to edit form title"
                    />
                  </div>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full shrink-0 self-start mt-4">
                    {schema.category || 'General'}
                  </span>
                </div>
                <input
                  type="text"
                  value={schema.description || ''}
                  onChange={e => setSchema({ ...schema, description: e.target.value })}
                  className="text-xs text-[var(--color-text-secondary)] mt-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-300 focus:border-indigo-500 rounded px-1.5 py-0.5 -ml-1.5 transition-all outline-none w-full"
                  placeholder="Form description (optional)"
                  title="Click to edit form description"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{inputFieldsCount} Questions</span>
                    <span className="text-gray-300">•</span>
                    {/* Section partition controls */}
                    {schema.fields.some(f => f.type === 'section') ? (
                      <button
                        type="button"
                        onClick={handleRemoveSections}
                        className="text-[11px] font-medium text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 bg-white px-2 py-0.5 rounded transition-colors"
                        title="Remove all section headers"
                      >
                        Remove Sections
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSplitInto2Sections}
                        className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 bg-white px-2 py-0.5 rounded transition-colors shadow-2xs"
                        title="Divide questions equally into 2 sections"
                      >
                        Divide into 2 Sections
                      </button>
                    )}
                  </div>

                  {/* Add Field Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddFieldMenu(s => !s)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Field
                    </button>

                    {showAddFieldMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-20 space-y-0.5 max-h-60 overflow-y-auto">
                        <div className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1">Select Field Type</div>
                        {AVAILABLE_FIELD_TYPES.map(ft => (
                          <button
                            key={ft.type}
                            type="button"
                            onClick={() => handleAddField(ft.type)}
                            className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-900 text-gray-700 transition-colors"
                          >
                            {ft.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields Render */}
              <div className="p-5 space-y-3 max-h-[700px] overflow-y-auto">
                {schema.fields.map((field, idx) => {
                  const isSelected = selectedFieldId === field.id;

                  if (field.type === 'section') {
                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`pt-3.5 pb-2 border-b-2 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected ? 'border-indigo-600 bg-indigo-50/40 px-2 rounded-t' : 'border-indigo-200'
                        }`}
                      >
                        <div>
                          <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{field.section_title || field.label}</span>
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-200 font-semibold px-1.5 py-0.2 rounded lowercase">section</span>
                          </h3>
                          {field.section_description && (
                            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                              {field.section_description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }}
                          title="Delete Section Header"
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={`group p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/20 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <label className="text-xs font-medium text-[var(--color-text-primary)]">
                          {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {field.type.replace('_', ' ')}
                          </span>

                          {/* Reordering and Delete Quick Actions */}
                          <div className="flex items-center gap-0.5 bg-gray-100/90 rounded px-1 py-0.5 border border-gray-200">
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); handleMoveField(field.id, 'up'); }}
                              disabled={idx === 0}
                              title="Move Question Up"
                              className="text-gray-600 hover:text-indigo-600 disabled:opacity-25 p-1 rounded hover:bg-white transition-colors"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); handleMoveField(field.id, 'down'); }}
                              disabled={idx === schema.fields.length - 1}
                              title="Move Question Down"
                              className="text-gray-600 hover:text-indigo-600 disabled:opacity-25 p-1 rounded hover:bg-white transition-colors"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }}
                            title="Delete Field"
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 ml-0.5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mock input display */}
                      {field.type === 'short_answer' && (
                        <input className="input text-xs pointer-events-none bg-gray-50" placeholder={field.placeholder || 'Your answer'} readOnly />
                      )}
                      {field.type === 'long_answer' && (
                        <textarea className="input text-xs pointer-events-none bg-gray-50 h-16 resize-none" placeholder={field.placeholder || 'Your detailed answer'} readOnly />
                      )}
                      {field.type === 'email' && (
                        <input className="input text-xs pointer-events-none bg-gray-50" placeholder={field.placeholder || 'name@institution.edu'} readOnly />
                      )}
                      {field.type === 'phone' && (
                        <input className="input text-xs pointer-events-none bg-gray-50" placeholder={field.placeholder || '+91 98765 43210'} readOnly />
                      )}
                      {field.type === 'number' && (
                        <input className="input text-xs pointer-events-none bg-gray-50" type="number" placeholder={field.placeholder || '0'} readOnly />
                      )}
                      {field.type === 'date' && (
                        <input className="input text-xs pointer-events-none bg-gray-50" type="date" readOnly />
                      )}
                      {field.type === 'dropdown' && (
                        <select className="select text-xs pointer-events-none bg-gray-50" disabled>
                          <option>Select an option ({field.options?.length || 0} options available)</option>
                        </select>
                      )}
                      {field.type === 'multiple_choice' && (
                        <div className="space-y-1 pt-1">
                          {(field.options || []).map(opt => (
                            <div key={opt.id} className="flex items-center gap-2 text-xs text-gray-700 pointer-events-none">
                              <input type="radio" readOnly />
                              <span>{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {field.type === 'checkboxes' && (
                        <div className="space-y-1 pt-1">
                          {(field.options || []).map(opt => (
                            <div key={opt.id} className="flex items-center gap-2 text-xs text-gray-700 pointer-events-none">
                              <input type="checkbox" readOnly />
                              <span>{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {field.type === 'yes_no' && (
                        <div className="flex gap-4 pt-1 text-xs text-gray-700 pointer-events-none">
                          <label className="flex items-center gap-1.5"><input type="radio" readOnly /> Yes</label>
                          <label className="flex items-center gap-1.5"><input type="radio" readOnly /> No</label>
                        </div>
                      )}
                      {(field.type === 'file_upload' || field.type === 'image_upload') && (
                        <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center bg-gray-50 text-[11px] text-gray-500 pointer-events-none">
                          Upload {field.type === 'image_upload' ? 'Photo / Image (PNG, JPG)' : 'Document (PDF, DOCX, max 10MB)'}
                        </div>
                      )}
                      {field.type === 'signature' && (
                        <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center bg-gray-50 text-[11px] text-gray-400 italic pointer-events-none">
                          Draw or upload legal signature
                        </div>
                      )}

                      {/* Conditional logic badge */}
                      {field.conditional_logic?.enabled && (
                        <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Conditional: Shown when condition matches</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[460px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No Form Generated Yet</p>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Enter your requirements on the left and click "Generate Form" to see the live preview.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Field Inspector & Form Settings */}
        <div className="lg:col-span-3 space-y-4">
          {schema ? (
            <div className="card space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Field Inspector
                </h3>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 font-medium px-2 py-0.5 rounded border border-indigo-200">
                  Live Editor
                </span>
              </div>

              {selectedField ? (
                <div className="space-y-3.5 animate-fade-in">
                  {/* Order & Reordering Position Control */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Question Order</span>
                      <span className="text-[10px] text-gray-500">
                        Position {schema.fields.findIndex(f => f.id === selectedField.id) + 1} of {schema.fields.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(selectedField.id, 'up')}
                        disabled={schema.fields.findIndex(f => f.id === selectedField.id) === 0}
                        className="btn btn-secondary btn-sm text-xs py-1 px-2 gap-1 disabled:opacity-25"
                        title="Move Question Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" /> Up
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(selectedField.id, 'down')}
                        disabled={schema.fields.findIndex(f => f.id === selectedField.id) === schema.fields.length - 1}
                        className="btn btn-secondary btn-sm text-xs py-1 px-2 gap-1 disabled:opacity-25"
                        title="Move Question Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" /> Down
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs">Field Label</label>
                    <input
                      className="input text-xs"
                      value={selectedField.label}
                      onChange={e => updateSelectedField({ label: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs">Field Type</label>
                    <select
                      className="select text-xs"
                      value={selectedField.type}
                      onChange={e => {
                        const newType = e.target.value as FieldType;
                        let options = selectedField.options;
                        if ((newType === 'dropdown' || newType === 'multiple_choice' || newType === 'checkboxes') && (!options || options.length === 0)) {
                          options = [
                            { id: `opt-${generateId()}`, label: 'Option 1', value: 'Option 1' },
                            { id: `opt-${generateId()}`, label: 'Option 2', value: 'Option 2' },
                          ];
                        }
                        updateSelectedField({ type: newType, options });
                      }}
                    >
                      {AVAILABLE_FIELD_TYPES.map(t => (
                        <option key={t.type} value={t.type}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedField.type !== 'section' && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                      <span className="text-xs font-medium text-gray-700">Required Field</span>
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={e => updateSelectedField({ required: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {selectedField.type !== 'section' && (
                    <div className="form-group">
                      <label className="form-label text-xs">Placeholder Text</label>
                      <input
                        className="input text-xs"
                        value={selectedField.placeholder || ''}
                        placeholder="Optional placeholder..."
                        onChange={e => updateSelectedField({ placeholder: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Options Editor */}
                  {(selectedField.type === 'dropdown' || selectedField.type === 'multiple_choice' || selectedField.type === 'checkboxes') && (
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <label className="form-label text-xs">Options ({selectedField.options?.length || 0})</label>
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {(selectedField.options || []).map(opt => (
                          <div key={opt.id} className="flex items-center gap-1.5">
                            <input
                              className="input text-xs py-1"
                              value={opt.label}
                              onChange={e => handleUpdateOption(opt.id, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(opt.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Delete option"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleDeleteField(selectedField.id)}
                      className="btn btn-secondary text-xs text-red-600 hover:bg-red-50 hover:border-red-200 w-full justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Field
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">
                  Select any field in the preview to inspect or edit its properties.
                </p>
              )}

              {/* Form Title & Category */}
              <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    Form Title <span className="text-red-500">*</span>
                  </h4>
                  {!schema.title?.trim() && (
                    <span className="text-[10px] text-red-600 font-semibold">Required</span>
                  )}
                </div>
                <input
                  className={`input text-xs ${!schema.title?.trim() ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                  value={schema.title}
                  onChange={e => setSchema({ ...schema, title: e.target.value })}
                  placeholder="Enter form name (Required)..."
                />
              </div>
            </div>
          ) : (
            <div className="card text-center p-6 text-gray-400 space-y-2">
              <Sliders className="h-5 w-5 mx-auto text-gray-300" />
              <p className="text-xs font-medium text-gray-600">Field Inspector</p>
              <p className="text-[11px] text-gray-400">
                Select generated fields to review validation, options, and settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Publish Dialog */}
      {publishedForm && (
        <PublishDialog
          open={publishDialogOpen}
          onClose={() => {
            setPublishDialogOpen(false);
            navigate('/app/forms');
          }}
          formId={publishedForm.id}
          slug={publishedForm.slug}
          title={publishedForm.title}
        />
      )}
    </div>
  );
}
