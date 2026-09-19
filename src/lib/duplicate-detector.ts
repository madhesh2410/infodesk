import type { Form, FormResponse, ResponseAnswer } from '@/types';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  originalResponseId?: string;
  matchField?: string;
  matchedValue?: string;
  originalName?: string;
  originalSubmittedAt?: string;
}

/**
 * Normalizes a field value for accurate identifier comparison
 */
function normalizeIdentifierValue(val: unknown, type?: string): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim().toLowerCase();
  if (type === 'phone' || str.replace(/\D/g, '').length >= 7) {
    // Return digits only if phone number or long numeric ID
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length >= 7) return digitsOnly;
  }
  return str;
}

/**
 * Checks if a field label or type matches a given identifier key
 */
function isMatchingIdentifier(
  fieldId: string,
  fieldLabel: string,
  fieldType: string,
  configuredIdentifier: string
): boolean {
  const normConfig = configuredIdentifier.toLowerCase().trim();
  const normLabel = fieldLabel.toLowerCase().trim();

  // Exact ID match
  if (fieldId.toLowerCase() === normConfig) return true;

  // Keyword / label match
  if (normConfig === 'email' && (fieldType === 'email' || normLabel.includes('email') || normLabel.includes('mail'))) {
    return true;
  }
  if (
    normConfig === 'phone' &&
    (fieldType === 'phone' || normLabel.includes('phone') || normLabel.includes('mobile') || normLabel.includes('contact'))
  ) {
    return true;
  }
  if (
    (normConfig === 'student_id' || normConfig === 'id' || normConfig === 'registration_number') &&
    (normLabel.includes('student id') || normLabel.includes('reg no') || normLabel.includes('roll no') || normLabel.includes('id number') || normLabel.includes('enrollment') || normLabel.includes('employee id'))
  ) {
    return true;
  }

  return normLabel === normConfig || normLabel.includes(normConfig);
}

/**
 * Detects if a new submission is a potential duplicate of an existing submission.
 */
export function checkSubmissionForDuplicate(
  form: Form | null | undefined,
  answers: Array<{ field_id: string; field_label: string; value: any }>,
  existingResponses: FormResponse[]
): DuplicateDetectionResult {
  // If duplicate detection explicitly disabled on form, skip
  if (form?.settings?.duplicate_detection_enabled === false) {
    return { isDuplicate: false };
  }

  // Determine active identifier rules
  let identifiers = form?.settings?.duplicate_identifiers;
  if (!identifiers || identifiers.length === 0) {
    // Default smart identifiers: email, phone, student/employee id
    identifiers = ['email', 'phone', 'student_id'];
  }

  // Filter existing responses for this form only
  const formResponses = form
    ? existingResponses.filter(r => r.form_id === form.id && r.duplicate_status !== 'resolved_legitimate')
    : existingResponses;

  if (formResponses.length === 0) {
    return { isDuplicate: false };
  }

  // Find matches across configured identifiers
  for (const identifier of identifiers) {
    // Find answer in the current submission corresponding to this identifier
    const targetAnswer = answers.find(a => {
      const fieldDef = form?.fields.find(f => f.id === a.field_id);
      return isMatchingIdentifier(a.field_id, a.field_label, fieldDef?.type || '', identifier);
    });

    if (!targetAnswer || !targetAnswer.value) continue;

    const currentNormalized = normalizeIdentifierValue(targetAnswer.value);
    if (!currentNormalized) continue;

    // Search existing responses
    for (const prevResp of formResponses) {
      const matchedPrevAnswer = prevResp.answers?.find(pa => {
        const fieldDef = form?.fields.find(f => f.id === pa.field_id);
        return isMatchingIdentifier(pa.field_id, pa.field_label, fieldDef?.type || '', identifier);
      });

      if (!matchedPrevAnswer || !matchedPrevAnswer.value) continue;

      const prevNormalized = normalizeIdentifierValue(matchedPrevAnswer.value);
      if (prevNormalized && prevNormalized === currentNormalized) {
        // MATCH FOUND!
        const originalName =
          prevResp.participant_name ||
          prevResp.respondent_name ||
          prevResp.answers.find(a => a.field_label.toLowerCase().includes('name'))?.value?.toString() ||
          'Previous Respondent';

        return {
          isDuplicate: true,
          originalResponseId: prevResp.response_id || prevResp.id,
          matchField: targetAnswer.field_label || identifier,
          matchedValue: String(targetAnswer.value),
          originalName,
          originalSubmittedAt: prevResp.submitted_at,
        };
      }
    }
  }

  return { isDuplicate: false };
}
