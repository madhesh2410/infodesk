import { useState, useEffect } from 'react';
import type { Form, FormField } from '@/types';
import { FieldRenderer } from './FieldRenderer';
import { cn } from '@/lib/utils';
import { Building2, Sparkles, X } from 'lucide-react';
import { getStoredParticipantProfile } from '@/lib/profile-service';

interface FormRendererProps {
  form: Form;
  previewMode?: boolean;
  onSubmit?: (answers: Record<string, string | string[] | boolean | null>) => void;
}

export function FormRenderer({ form, previewMode, onSubmit }: FormRendererProps) {
  // Split fields into sections/steps
  const steps = buildSteps(form.fields);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [autofilledFields, setAutofilledFields] = useState<string[]>([]);
  const [showAutofillNotice, setShowAutofillNotice] = useState(false);

  // Profile Auto-fill on initial load
  useEffect(() => {
    if (form.settings.profile_autofill_enabled === false) return;

    try {
      const profile = getStoredParticipantProfile();
      if (!profile) return;

      const newAnswers: Record<string, string | string[] | boolean | null> = {};
      const filledFieldNames: string[] = [];

      for (const field of form.fields) {
        if (field.type === 'section') continue;
        const normLabel = field.label.toLowerCase().trim();

        // 1. Email
        if ((field.type === 'email' || normLabel.includes('email') || normLabel.includes('mail')) && profile.email) {
          newAnswers[field.id] = profile.email;
          filledFieldNames.push(field.label);
          continue;
        }

        // 2. Phone
        if ((field.type === 'phone' || normLabel.includes('phone') || normLabel.includes('mobile') || normLabel.includes('contact')) && profile.phone) {
          newAnswers[field.id] = profile.phone;
          filledFieldNames.push(field.label);
          continue;
        }

        // 3. College / Organization
        if (
          (normLabel.includes('college') || normLabel.includes('institution') || normLabel.includes('university') || normLabel.includes('organization') || normLabel.includes('school')) &&
          profile.college_name
        ) {
          newAnswers[field.id] = profile.college_name;
          filledFieldNames.push(field.label);
          continue;
        }

        // 4. Student ID / Reg No
        if (
          (normLabel.includes('student id') || normLabel.includes('reg no') || normLabel.includes('registration no') || normLabel.includes('roll no') || normLabel.includes('enrollment') || normLabel.includes('employee id')) &&
          profile.student_id
        ) {
          newAnswers[field.id] = profile.student_id;
          filledFieldNames.push(field.label);
          continue;
        }

        // 5. Department
        if ((normLabel.includes('department') || normLabel.includes('dept')) && profile.department) {
          newAnswers[field.id] = profile.department;
          filledFieldNames.push(field.label);
          continue;
        }

        // 6. Course / Program / Degree
        if ((normLabel.includes('course') || normLabel.includes('degree') || normLabel.includes('program')) && profile.course) {
          newAnswers[field.id] = profile.course;
          filledFieldNames.push(field.label);
          continue;
        }

        // 7. Full Name (after ensuring it's not college name or company name)
        if (
          (normLabel === 'name' || normLabel === 'full name' || normLabel.includes('participant name') || normLabel.includes('student name')) &&
          !normLabel.includes('college') &&
          !normLabel.includes('company') &&
          !normLabel.includes('parent') &&
          profile.full_name
        ) {
          newAnswers[field.id] = profile.full_name;
          filledFieldNames.push(field.label);
          continue;
        }

        // 8. Date of Birth
        if ((field.type === 'date' || normLabel.includes('birth') || normLabel.includes('dob')) && profile.date_of_birth) {
          newAnswers[field.id] = profile.date_of_birth;
          filledFieldNames.push(field.label);
          continue;
        }

        // 9. City
        if (normLabel.includes('city') && profile.city) {
          newAnswers[field.id] = profile.city;
          filledFieldNames.push(field.label);
          continue;
        }

        // 10. State
        if (normLabel.includes('state') && profile.state) {
          newAnswers[field.id] = profile.state;
          filledFieldNames.push(field.label);
          continue;
        }

        // 11. Pincode
        if ((normLabel.includes('pincode') || normLabel.includes('zip') || normLabel.includes('postal')) && profile.pincode) {
          newAnswers[field.id] = profile.pincode;
          filledFieldNames.push(field.label);
          continue;
        }

        // 12. Address
        if (normLabel.includes('address') && !normLabel.includes('email') && profile.address) {
          newAnswers[field.id] = profile.address;
          filledFieldNames.push(field.label);
          continue;
        }
      }

      if (Object.keys(newAnswers).length > 0) {
        setAnswers(prev => ({ ...newAnswers, ...prev }));
        setAutofilledFields(filledFieldNames);
        setShowAutofillNotice(true);
      }
    } catch (e) {
      console.warn('Profile auto-fill check:', e);
    }
  }, [form.fields, form.settings.profile_autofill_enabled]);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  function isFieldVisible(field: FormField): boolean {
    if (form.settings.conditional_logic_enabled === false) return true;

    const logic = field.logic || field.conditional_logic;
    const dependsOn = logic?.dependsOn || logic?.depends_on_field_id;
    if (!logic?.enabled || !dependsOn) return true;

    const depValue = answers[dependsOn];
    const val = String(depValue ?? '').trim().toLowerCase();
    const cmpVal = String(logic.value || logic.show_when_value || '').trim().toLowerCase();
    const operator = logic.operator || logic.condition || 'equals';
    const action = logic.action || 'show';

    let conditionMet = false;
    switch (operator) {
      case 'equals':
        conditionMet = val === cmpVal;
        break;
      case 'not_equals':
        conditionMet = val !== '' && val !== cmpVal;
        break;
      case 'contains':
        conditionMet = val.includes(cmpVal);
        break;
      case 'is_not_empty':
        conditionMet = val.length > 0 && val !== 'false';
        break;
      default:
        conditionMet = val === cmpVal || (cmpVal === 'yes' && (val === 'yes' || val === 'true'));
    }

    // If action is show: visible when conditionMet is true. If action is hide: visible when conditionMet is false.
    return action === 'hide' ? !conditionMet : conditionMet;
  }

  function validateStep(): boolean {
    if (previewMode) return true;
    const errs: Record<string, string> = {};
    for (const field of step.fields) {
      if (!isFieldVisible(field)) continue;
      if (field.type === 'section') continue;
      if (field.required) {
        const val = answers[field.id];
        if (!val || (Array.isArray(val) && val.length === 0) || val === '') {
          errs[field.id] = 'This field is required.';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    setCurrentStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit() {
    if (previewMode) {
      setSubmitted(true);
      return;
    }
    // CRITICAL: Filter out hidden questions so they NEVER appear in submitted responses!
    const cleanAnswers: Record<string, string | string[] | boolean | null> = {};
    for (const [fieldId, val] of Object.entries(answers)) {
      const fieldDef = form.fields.find(f => f.id === fieldId);
      if (fieldDef && isFieldVisible(fieldDef)) {
        cleanAnswers[fieldId] = val;
      }
    }
    onSubmit?.(cleanAnswers);
  }

  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  if (submitted && previewMode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Preview Complete</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">This is how the confirmation will appear to participants.</p>
          <button onClick={() => { setSubmitted(false); setCurrentStep(0); setAnswers({}); }} className="btn btn-secondary mt-4">
            Reset Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Form header */}
      <div className="bg-[var(--color-primary)] px-6 py-6 text-white">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <Building2 className="h-4 w-4" />
            <span className="text-xs">Sri Sairam Demo Institution</span>
          </div>
          <h1 className="text-xl font-bold">{form.title}</h1>
          {form.description && <p className="text-sm text-indigo-200 mt-1">{form.description}</p>}

          {/* Progress */}
          {form.settings.show_progress_bar && totalSteps > 1 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-indigo-200">Step {currentStep + 1} of {totalSteps}</span>
                <span className="text-xs text-indigo-200">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step title */}
      {step.title && totalSteps > 1 && (
        <div className="px-6 pt-6 max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">{step.title}</h2>
          {step.description && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{step.description}</p>}
        </div>
      )}

      {/* Auto-fill notification */}
      {showAutofillNotice && autofilledFields.length > 0 && (
        <div className="px-6 pt-4 max-w-xl mx-auto">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs flex items-start justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Auto-filled from your profile:</span>
                <span className="text-indigo-800 ml-1">
                  {autofilledFields.slice(0, 3).join(', ')}
                  {autofilledFields.length > 3 ? ` and ${autofilledFields.length - 3} more` : ''}.
                  You can edit any response before submitting.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAutofillNotice(false)}
              className="text-indigo-400 hover:text-indigo-700 p-0.5"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="px-6 pb-6 pt-4 max-w-xl mx-auto space-y-5">
        {step.fields.filter(f => f.type !== 'section').map(field => {
          if (!isFieldVisible(field)) return null;
          return (
            <div key={field.id} className="form-group animate-fade-in">
              <label
                className={cn('form-label', field.required && 'required')}
                htmlFor={`field-${field.id}`}
              >
                {field.label || 'Untitled field'}
              </label>
              {field.description && (
                <p className="text-[11px] text-[var(--color-text-muted)] -mt-0.5 mb-1">{field.description}</p>
              )}
              <FieldRenderer
                field={field}
                value={answers[field.id] ?? null}
                onChange={v => {
                  setAnswers(a => ({ ...a, [field.id]: v }));
                  setErrors(e => { const next = { ...e }; delete next[field.id]; return next; });
                }}
                error={errors[field.id]}
                disabled={false}
              />
              {errors[field.id] && (
                <p className="form-error mt-1">{errors[field.id]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-[var(--color-border)] px-6 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <button type="button" onClick={handleBack} className="btn btn-secondary">
              ← Back
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
          >
            {currentStep < totalSteps - 1 ? 'Continue →' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Step {
  title: string;
  description?: string;
  fields: FormField[];
}

function buildSteps(fields: FormField[]): Step[] {
  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const steps: Step[] = [];
  let current: Step = { title: '', fields: [] };

  for (const field of sorted) {
    if (field.type === 'section') {
      if (current.fields.length > 0 || current.title) {
        steps.push(current);
      }
      current = { title: field.section_title ?? '', description: field.section_description, fields: [] };
    } else {
      current.fields.push(field);
    }
  }

  if (current.fields.length > 0 || current.title) {
    steps.push(current);
  }

  if (steps.length === 0) {
    return [{ title: '', fields: sorted }];
  }

  return steps;
}
