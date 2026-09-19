import type { FormField, FieldType, FieldOption } from '@/types';
import { generateId } from './utils';

export interface FormGenerationSummary {
  requestedFieldCount: number;
  generatedFieldCount: number;
  missingFieldCount: number;
  sections: { name: string; count: number }[];
}

export interface GeneratedFormSchema {
  title: string;
  description: string;
  category?: string;
  fields: FormField[];
  summary?: FormGenerationSummary;
}

// ─── 1. Field Normalization & Canonical Key Mapping ─────────────────────────────

export function normalizeFieldName(token: string): string {
  const t = token.trim().toLowerCase()
    .replace(/[_\-\/\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Name variants
  if (t === 'name' || t === 'full name' || t === 'student name' || t === 'candidate name' || t === 'applicant name') {
    return 'full_name';
  }
  if (t === 'participant name') {
    return 'participant_name';
  }

  // College / Institution variants
  if (t === 'college' || t === 'college name' || t === 'institution' || t === 'institution name' || t === 'school' || t === 'university') {
    return 'college_name';
  }

  // ID variants
  if (t === 'id' || t === 'identification' || t === 'identification number' || t === 'id no') {
    return 'id_number';
  }
  if (t === 'college id' || t === 'student id' || t === 'inst id') {
    return 'student_id';
  }
  if (
    t === 'reg no' || t === 'reg' || t === 'register no' || t === 'register number' ||
    t === 'reg number' || t === 'roll no' || t === 'roll' || t === 'roll number' ||
    t === 'registration number' || t === 'register'
  ) {
    return 'register_number';
  }

  // Department variants
  if (t === 'dept' || t === 'department' || t === 'branch') {
    return 'department';
  }

  // Section variants
  if (t === 'sec id' || t === 'section id' || t === 'sec_id' || t === 'section_id') {
    return 'section_id';
  }
  if (t === 'sec' || t === 'section') {
    return 'section';
  }

  // Email variants
  if (t === 'mail' || t === 'email' || t === 'email id' || t === 'mail id' || t === 'e mail' || t === 'email address') {
    return 'email';
  }

  // Phone variants
  if (
    t === 'phone' || t === 'phone number' || t === 'phone no' || t === 'mobile' ||
    t === 'mobile number' || t === 'mobile no' || t === 'contact' || t === 'contact no' ||
    t === 'contact number'
  ) {
    return 'phone_number';
  }

  // Parent variants
  if (t === 'parent name' || t === 'father name' || t === 'mother name' || t === 'guardian name') {
    return 'parent_name';
  }
  if (
    t === 'parent phone' || t === 'parent contact' || t === 'parent phone number' ||
    t === 'parents phone' || t === 'father phone' || t === 'emergency contact' ||
    t === 'parent mobile' || t === 'local guardian' || t === 'guardian contact'
  ) {
    return 'parent_phone_number';
  }

  // Photo / Image variants
  if (
    t === 'pic' || t === 'photo' || t === 'picture' || t === 'student photo' ||
    t === 'profile pic' || t === 'profile picture' || t === 'photograph' || t === 'image'
  ) {
    return 'photo';
  }

  // Document Upload variants
  if (t === 'id card' || t === 'id proof' || t === 'id card upload' || t === 'college id card' || t === 'id upload') {
    return 'id_card_proof';
  }
  if (t === 'certificate' || t === 'certificates' || t === 'certificate upload') {
    return 'certificate_upload';
  }
  if (t === 'mark sheet' || t === 'marksheet' || t === 'marksheets' || t === 'marksheet upload') {
    return 'marksheet_upload';
  }
  if (t === 'document' || t === 'documents' || t === 'document upload' || t === 'doc' || t === 'docs') {
    return 'document_upload';
  }
  if (t === 'resume' || t === 'cv') {
    return 'resume_upload';
  }

  // Demographic variants
  // Personal demographic variants
  if (
    t === 'disabled' ||
    t === 'disability' ||
    t === 'differently abled' ||
    t === 'physically challenged' ||
    t === 'pwd' ||
    t === 'handicapped' ||
    t === 'disbled'
  ) {
    return 'disability_status';
  }
  if (t === 'address' || t === 'residential address' || t === 'permanent address' || t === 'home address') {
    return 'address';
  }
  if (t === 'dob' || t === 'date of birth' || t === 'birth date' || t === 'birthdate') {
    return 'date_of_birth';
  }
  if (t === 'gender' || t === 'sex') {
    return 'gender';
  }
  if (t === 'age') {
    return 'age';
  }
  if (t === 'blood' || t === 'blood group') {
    return 'blood_group';
  }

  // Academic program variants
  if (t === 'highest qualification' || t === 'qualification' || t === 'degree' || t === 'education' || t === 'educational' || t === 'educational details' || t === 'educational background') {
    return 'highest_qualification';
  }
  if (t === 'year' || t === 'year of study' || t === 'current year') {
    return 'year_of_study';
  }
  if (t === 'class' || t === 'grade' || t === 'standard' || t === 'course') {
    return 'class_grade';
  }
  if (t === 'preferred session' || t === 'session' || t === 'workshop session' || t === 'batch') {
    return 'preferred_session';
  }
  if (t === 'cgpa' || t === 'marks' || t === 'percentage' || t === 'gpa') {
    return 'cgpa';
  }

  // Financial & Family variants
  if (t === 'mother' || t === 'mother name' || t === 'mothers name' || t === "mother's name") {
    return 'mother_name';
  }
  if (t === 'family' || t === 'family questionnaire' || t === 'family details') {
    return 'parent_name';
  }
  if (t === 'personal' || t === 'personal details' || t === 'personal information') {
    return 'full_name';
  }
  if (t === 'income' || t === 'family income' || t === 'annual income' || t === 'parent income') {
    return 'family_income';
  }
  if (t === 'bank' || t === 'bank details' || t === 'bank name' || t === 'bank account' || t === 'account number') {
    return 'bank_details';
  }
  if (t === 'ifsc' || t === 'ifsc code') {
    return 'ifsc_code';
  }

  // Hostel variants
  if (t === 'hostel' || t === 'hostel student' || t === 'hostel resident' || t === 'hostel status' || t === 'hostel accommodation' || t === 'living in hostel') {
    return 'hostel_resident';
  }
  if (t === 'hostel name' || t === 'hostel block') {
    return 'hostel_name';
  }
  if (t === 'room' || t === 'room number' || t === 'room no') {
    return 'room_number';
  }
  if (t === 'room preference' || t === 'room type') {
    return 'room_preference';
  }

  // Work Experience & Professional variants
  if (
    t === 'previous experience' || t === 'experience' || t === 'work experience' ||
    t === 'experienced' || t === 'previous work experience' || t === 'prior experience' ||
    t === 'any experience' || t === 'past experience'
  ) {
    return 'previous_experience';
  }
  if (
    t === 'company name' || t === 'company' || t === 'organization name' ||
    t === 'previous company' || t === 'current company' || t === 'employer' || t === 'firm'
  ) {
    return 'company_name';
  }
  if (t === 'job role' || t === 'role' || t === 'designation' || t === 'position' || t === 'job title') {
    return 'job_role';
  }
  if (t === 'years of experience' || t === 'experience years' || t === 'total experience' || t === 'experience in years') {
    return 'years_of_experience';
  }
  if (t === 'previous salary' || t === 'salary' || t === 'ctc' || t === 'current salary' || t === 'last drawn salary') {
    return 'previous_salary';
  }

  // Legal / Confirmation variants
  if (t === 'signature' || t === 'sign' || t === 'applicant signature') {
    return 'signature';
  }
  if (t === 'declaration' || t === 'agreement' || t === 'terms') {
    return 'declaration';
  }

  // Custom / arbitrary field fallback
  return t.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// ─── 2. Global Type Modifier & Token Extraction ────────────────────────────────

export function inferFieldTypeFromString(str: string): FieldType | undefined {
  const s = str.trim().toLowerCase();
  if (/yes\s*[\/-]?\s*no|yes\s+or\s+no|boolean|toggle/i.test(s)) return 'yes_no';
  if (/dropdown|select/i.test(s)) return 'dropdown';
  if (/check|checkbox(?:es)?/i.test(s)) return 'checkboxes';
  if (/multiple\s*choice|mcq|radio/i.test(s)) return 'multiple_choice';
  if (/photo|image|pic/i.test(s)) return 'image_upload';
  if (/file|upload|doc|pdf/i.test(s)) return 'file_upload';
  if (/sign(?:ature)?/i.test(s)) return 'signature';
  if (/date|dob/i.test(s)) return 'date';
  if (/num(?:ber)?|amount|count|int/i.test(s)) return 'number';
  if (/phone|mobile/i.test(s)) return 'phone';
  if (/email|mail/i.test(s)) return 'email';
  if (/long|area|paragraph|textarea/i.test(s)) return 'long_answer';
  if (/short|text/i.test(s)) return 'short_answer';
  return undefined;
}

export function detectGlobalTypeModifier(promptText: string): { cleanedText: string; globalType?: FieldType } {
  let text = promptText.trim();
  let globalType: FieldType | undefined;

  // Patterns for Yes/No global format
  // e.g. "hulk,iron,people all yes no", "all yes/no", "all in yes or no format", "convert into yes or no format"
  const yesNoPatterns = [
    /\b(?:convert\s+(?:them\s+|all\s+)?into\s+)?(?:all\s+(?:of\s+them\s+|them\s+)?|all\s+(?:fields\s+|questions\s+)?)(?:in\s+|as\s+|to\s+|should\s+be\s+)?(?:yes\s*[\/-]?\s*no|yes\s+or\s+no)(?:\s+format)?\b/i,
    /\ball\s+(?:questions\s+|fields\s+)?(?:as\s+|in\s+|to\s+|should\s+be\s+)?yes\s*[\/-]?\s*no(?:\s+format)?\b/i,
    /\ball\s+(?:questions\s+|fields\s+)?(?:as\s+|in\s+|to\s+|should\s+be\s+)?yes\s+or\s+no(?:\s+format)?\b/i,
    /\bmake\s+(?:them\s+|all\s+)?(?:as\s+|to\s+)?yes\s*[\/-]?\s*no(?:\s+format)?\b/i,
    /\bconvert\s+(?:them\s+|all\s+)?into\s+yes\s+(?:or|\/)\s*no(?:\s+format)?\b/i,
    /\byes\s*[\/-]?\s*no\s+format\b/i,
    /\byes\s+or\s+no\s+format\b/i,
    /\b(?:in|as)\s+yes\s*[\/-]?\s*no\b/i,
  ];

  for (const pattern of yesNoPatterns) {
    if (pattern.test(text)) {
      globalType = 'yes_no';
      text = text.replace(pattern, '').trim();
      break;
    }
  }

  if (!globalType) {
    // Dropdown global
    const dropdownPatterns = [
      /\b(?:all|make\s+(?:them|all)?|all\s+fields|all\s+questions)\s+(?:as\s+|in\s+|to\s+|should\s+be\s+)?dropdowns?\b/i,
      /\ball\s+dropdowns?\b/i,
    ];
    for (const p of dropdownPatterns) {
      if (p.test(text)) {
        globalType = 'dropdown';
        text = text.replace(p, '').trim();
        break;
      }
    }
  }

  if (!globalType) {
    // Checkboxes global
    const checkboxPatterns = [
      /\b(?:all|make\s+(?:them|all)?|all\s+fields|all\s+questions)\s+(?:as\s+|in\s+|to\s+|should\s+be\s+)?checkbox(?:es)?\b/i,
      /\ball\s+checkbox(?:es)?\b/i,
    ];
    for (const p of checkboxPatterns) {
      if (p.test(text)) {
        globalType = 'checkboxes';
        text = text.replace(p, '').trim();
        break;
      }
    }
  }

  // Clean trailing commas, colons, dashes or whitespace
  text = text.replace(/[,;:\-\s]+$/, '').replace(/^[,;:\-\s]+/, '').trim();

  return { cleanedText: text, globalType };
}

export interface PromptTokenDetail {
  token: string;
  label: string;
  overrideType?: FieldType;
  conditionalOn?: string;
}

export function analyzePromptTokens(userPrompt: string): {
  tokens: PromptTokenDetail[];
  globalType?: FieldType;
} {
  const { cleanedText, globalType } = detectGlobalTypeModifier(userPrompt);
  // Strip markdown bold/italic/code symbols e.g. **Biodata Collection Form** -> Biodata Collection Form
  let text = cleanedText.replace(/[\*\_`]+/g, ' ');

  // Filter out metadata and conversational instruction lines (e.g. "General", "Category: ...", "Please provide the requested details accurately.")
  text = text
    .split('\n')
    .map(l => l.trim())
    .filter(trimmed => {
      if (!trimmed) return false;
      if (/^(?:category|description|title|instructions?|note|notice|summary)\s*[:\-]/i.test(trimmed)) return false;
      if (/^please\s+(?:provide|fill|enter|complete|answer)\b/i.test(trimmed)) return false;
      if (/^(?:general|academic|events|feedback|registration|documents|administration)$/i.test(trimmed)) return false;
      return true;
    })
    .join('\n');

  // Strip natural language introductory text e.g. "Create a student form that collects name, college..."
  const introPatterns = [
    /^(?:please\s+)?(?:create|build|generate|make)\s+(?:a\s+)?(?:complete\s+|new\s+|official\s+|simple\s+)?(?:[\w\s-]+\s+)?(?:form|application|questionnaire|survey|checklist)\s+(?:for\s+collecting|that\s+collects|to\s+collect|for\s+collect|collecting|with|including|includes|having|for)\s+/i,
    /^(?:a\s+)?(?:complete\s+|new\s+)?(?:[\w\s-]+\s+)?(?:form|application|questionnaire|survey)\s+(?:for\s+collecting|that\s+collects|to\s+collect|collecting|with|including|includes|having|for)\s+/i,
    /^(?:collect|collecting)\s+/i,
  ];

  for (const pattern of introPatterns) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '');
      break;
    }
  }

  // Check for conditional clauses e.g. "Ask hostel name and room number only if hostel student is yes"
  const conditionalMatches: string[] = [];
  const lowerText = text.toLowerCase();
  if (lowerText.includes('only if') || lowerText.includes('if ')) {
    if (lowerText.includes('hostel name')) conditionalMatches.push('hostel name');
    if (lowerText.includes('room number') || lowerText.includes('room')) conditionalMatches.push('room number');
    if (lowerText.includes('hostel student') || lowerText.includes('hostel resident') || lowerText.includes('hostel')) {
      conditionalMatches.push('hostel student');
    }
    // Remove the condition sentence from pure token splitting if it matches full sentence pattern
    text = text.replace(/(?:ask\s+)?(?:hostel\s+name|room\s+number|room).*?(?:only\s+if|if\s+).*?(?:yes|is\s+yes)[\.]?/i, '').trim();
  }

  // Split on delimiters: commas, semicolons, newlines, or conjunctions " and ", " & ", " as well as "
  const splitRegex = /[,;\n]+|\s+and\s+|\s+&\s+|\s+as\s+well\s+as\s+|\s+along\s+with\s+/i;
  const parts = text.split(splitRegex);

  const rawTokens: { token: string; inlineType?: FieldType; conditionalOn?: string }[] = [];

  for (const part of parts) {
    let clean = part.trim()
      .replace(/^[•\-\*0-9\.\)\s]+/, '') // Strip bullet points
      .replace(/[\.\?!]+$/, '')         // Strip trailing punctuation
      .replace(/[\*\_`]+/g, '')        // Strip remaining markdown chars
      .trim();

    if (!clean) continue;
    // Strip trailing 'all'
    clean = clean.replace(/\s+all$/i, '').trim();
    if (!clean) continue;
    // Ignore conversational filler, categories, and instructions
    if (
      /^(?:please|also|etc|etc\.|and|or|the|a|an|details|information|info|questions|fields|general|academic|events|feedback|registration|documents|administration)$/i.test(clean) ||
      /^please\s+(?:provide|fill|enter|complete|answer)\b/i.test(clean) ||
      /^(?:category|description|title|instructions?|note|notice|summary)\s*[:\-]/i.test(clean)
    ) {
      continue;
    }

    // Check if token has an inline conditional constraint: e.g. "company name if experienced"
    let conditionalOn: string | undefined;
    const condMatch = clean.match(/^(.*?)\s+(?:only\s+)?if\s+(?:experienced|experience|working)/i);
    if (condMatch && condMatch[1].trim()) {
      clean = condMatch[1].trim();
      conditionalOn = 'previous_experience';
    } else {
      const hostelMatch = clean.match(/^(.*?)\s+(?:only\s+)?if\s+(?:hostel)/i);
      if (hostelMatch && hostelMatch[1].trim()) {
        clean = hostelMatch[1].trim();
        conditionalOn = 'hostel_resident';
      }
    }

    // Check inline type: e.g. "hulk (yes/no)", "hulk: yes/no", "Disabled Yes Or No"
    let inlineType: FieldType | undefined;
    const parenMatch = clean.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      clean = parenMatch[1].trim();
      inlineType = inferFieldTypeFromString(parenMatch[2]);
    } else {
      const colonMatch = clean.match(
        /^(.*?)\s*[:\-]\s*(yes\s*[\/-]?\s*no|yes\s+or\s+no|dropdown|checkboxes|multiple\s+choice|file\s+upload|image\s+upload|file|photo|image|pic|text|number|date|signature)$/i
      );
      if (colonMatch) {
        clean = colonMatch[1].trim();
        inlineType = inferFieldTypeFromString(colonMatch[2]);
      } else {
        // Match trailing type indicator without delimiter (e.g. "Disabled Yes Or No", "Hostel student yes or no", "Category dropdown")
        const trailingMatch = clean.match(
          /^(.*?)\s+(?:in\s+|as\s+|with\s+(?:options?\s+)?|to\s+)?(yes\s*[\/-]?\s*no|yes\s+or\s+no|dropdown|checkboxes|multiple\s+choice|file\s+upload|image\s+upload|signature)$/i
        );
        if (trailingMatch && trailingMatch[1].trim()) {
          clean = trailingMatch[1].trim();
          inlineType = inferFieldTypeFromString(trailingMatch[2]);
        }
      }
    }

    if (clean) {
      rawTokens.push({ token: clean, inlineType, conditionalOn });
    }
  }

  // Include conditional tokens found
  for (const c of conditionalMatches) {
    rawTokens.push({ token: c });
  }

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  const result: PromptTokenDetail[] = [];

  for (const item of rawTokens) {
    const key = item.token.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        token: item.token,
        label: titleCase(item.token),
        overrideType: item.inlineType || globalType,
        conditionalOn: item.conditionalOn,
      });
    }
  }

  return { tokens: result, globalType };
}

export function extractRequestedTokens(userPrompt: string): string[] {
  const { tokens } = analyzePromptTokens(userPrompt);
  return tokens.map(t => t.token);
}

// ─── 3. Field Specification & Inferrer ──────────────────────────────────────────

interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  section: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditional_logic?: FormField['conditional_logic'];
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

export function getFieldSpecForToken(
  token: string,
  context?: { triggerFieldId?: string; overrideType?: FieldType; customId?: string }
): FieldSpec {
  const norm = normalizeFieldName(token);
  const id = context?.customId || `fld-${norm}-${generateId()}`;

  // If an explicit override type is requested (e.g. from "all yes no", "yes/no", "dropdown", etc.)
  if (context?.overrideType) {
    const overrideType = context.overrideType;
    let label = titleCase(token);
    if (norm === 'full_name') label = 'Full Name';
    else if (norm === 'college_name') label = 'College Name';
    else if (norm === 'id_number') label = 'ID';
    else if (norm === 'department') label = 'Department';
    else if (norm === 'section_id') label = 'Section ID';
    else if (norm === 'email') label = 'Email';
    else if (norm === 'photo') label = 'Photo';

    let options: string[] | undefined;
    if (overrideType === 'yes_no') {
      options = ['Yes', 'No'];
    } else if (overrideType === 'dropdown' || overrideType === 'multiple_choice' || overrideType === 'checkboxes') {
      options = ['Option 1', 'Option 2', 'Option 3'];
    }

    return {
      id,
      label,
      type: overrideType,
      section: 'Questions',
      required: true,
      placeholder: overrideType === 'short_answer' ? 'Enter answer' : '',
      options,
    };
  }

  switch (norm) {
    case 'full_name':
      return { id, label: 'Full Name', type: 'short_answer', section: 'Personal Information', required: true, placeholder: 'As registered in official records' };
    case 'participant_name':
      return { id, label: 'Participant Name', type: 'short_answer', section: 'Personal Information', required: true, placeholder: 'e.g. Dr. Priya Raman' };
    case 'college_name':
      return { id, label: 'College Name', type: 'short_answer', section: 'Personal Information', required: true, placeholder: 'e.g. National Institute of Technology' };
    case 'id_number':
      return { id, label: 'ID', type: 'short_answer', section: 'Personal Information', required: true, placeholder: 'Identification Number' };
    case 'student_id':
      return { id, label: 'Student ID', type: 'short_answer', section: 'Academic Information', required: true, placeholder: 'e.g. STU-2024-001' };
    case 'register_number':
      return { id, label: 'Register Number', type: 'short_answer', section: 'Academic Information', required: true, placeholder: 'e.g. 2127210501001' };
    case 'department':
      return {
        id,
        label: 'Department',
        type: 'dropdown',
        section: 'Academic Information',
        required: true,
        options: [
          'Computer Science & Engineering',
          'Artificial Intelligence & Data Science',
          'Information Technology',
          'Electronics & Communication',
          'Mechanical Engineering',
          'Civil Engineering',
          'Management Studies',
        ],
      };
    case 'section_id':
      return { id, label: 'Section ID', type: 'short_answer', section: 'Academic Information', required: true, placeholder: 'e.g. SEC-A' };
    case 'section':
      return {
        id,
        label: 'Section',
        type: 'dropdown',
        section: 'Academic Information',
        required: false,
        options: ['Section A', 'Section B', 'Section C'],
      };
    case 'year_of_study':
      return {
        id,
        label: 'Year of Study',
        type: 'dropdown',
        section: 'Academic Information',
        required: true,
        options: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      };
    case 'class_grade':
      return {
        id,
        label: 'Class / Grade',
        type: 'dropdown',
        section: 'Academic Information',
        required: true,
        options: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate', 'Postgraduate'],
      };
    case 'preferred_session':
      return {
        id,
        label: 'Preferred Session',
        type: 'dropdown',
        section: 'Academic Information',
        required: true,
        options: ['Morning Track (09:30 AM - 12:30 PM)', 'Afternoon Track (01:30 PM - 04:30 PM)', 'Full Day Workshop'],
      };
    case 'cgpa':
      return { id, label: 'Current CGPA / Percentage', type: 'number', section: 'Academic Information', required: true, placeholder: 'e.g. 8.75' };
    case 'email':
      return { id, label: 'Email', type: 'email', section: 'Contact Information', required: true, placeholder: 'student@institution.edu' };
    case 'phone_number':
      return { id, label: 'Phone Number', type: 'phone', section: 'Contact Information', required: true, placeholder: '+91 98765 43210' };
    case 'highest_qualification':
      return {
        id,
        label: 'Highest Qualification',
        type: 'dropdown',
        section: 'Academic Information',
        required: true,
        options: ['High School (10th/12th)', 'Diploma', "Bachelor's Degree", "Master's Degree", 'Doctorate (Ph.D.)'],
      };
    case 'parent_name':
      return { id, label: 'Father / Guardian Name', type: 'short_answer', section: 'Family Information', required: true, placeholder: 'Parent full name' };
    case 'mother_name':
      return { id, label: "Mother's Name", type: 'short_answer', section: 'Family Information', required: false, placeholder: 'Mother full name' };
    case 'parent_phone_number':
      return { id, label: 'Parent Phone Number', type: 'phone', section: 'Family Information', required: true, placeholder: '+91 98765 43211' };
    case 'address':
      return { id, label: 'Residential Address', type: 'long_answer', section: 'Contact Information', required: true, placeholder: 'Street address, City, State, PIN Code' };
    case 'date_of_birth':
      return { id, label: 'Date of Birth', type: 'date', section: 'Personal Information', required: true };
    case 'gender':
      return { id, label: 'Gender', type: 'multiple_choice', section: 'Personal Information', required: true, options: ['Male', 'Female', 'Other'] };
    case 'age':
      return { id, label: 'Age', type: 'number', section: 'Personal Information', required: false, placeholder: 'e.g. 20' };
    case 'blood_group':
      return {
        id,
        label: 'Blood Group',
        type: 'dropdown',
        section: 'Personal Information',
        required: false,
        options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      };
    case 'photo':
      return { id, label: 'Photo', type: 'image_upload', section: 'Documents & Proofs', required: true };
    case 'id_card_proof':
      return { id, label: 'ID Card Proof', type: 'file_upload', section: 'Documents & Proofs', required: true };
    case 'certificate_upload':
      return { id, label: 'Certificate Upload', type: 'file_upload', section: 'Documents & Proofs', required: true };
    case 'marksheet_upload':
      return { id, label: 'Marksheet Upload', type: 'file_upload', section: 'Documents & Proofs', required: true };
    case 'document_upload':
      return { id, label: 'Document Upload', type: 'file_upload', section: 'Documents & Proofs', required: true };
    case 'resume_upload':
      return { id, label: 'Resume / CV', type: 'file_upload', section: 'Documents & Proofs', required: false };
    case 'family_income':
      return { id, label: 'Annual Family Income (INR)', type: 'number', section: 'Financial Information', required: true, placeholder: 'e.g. 250000' };
    case 'bank_details':
      return { id, label: 'Bank Details', type: 'short_answer', section: 'Financial Information', required: true, placeholder: 'Bank name & branch' };
    case 'ifsc_code':
      return { id, label: 'IFSC Code', type: 'short_answer', section: 'Financial Information', required: true, placeholder: 'e.g. SBIN0001234' };
    case 'disability_status':
      return {
        id,
        label: token.toLowerCase().includes('dis') ? titleCase(token) : 'Differently Abled (PwD)',
        type: 'yes_no',
        section: 'Personal Information',
        required: false,
        options: ['Yes', 'No'],
      };
    case 'hostel_resident':
      return { id, label: 'Do you live in a hostel?', type: 'yes_no', section: 'Hostel & Accommodation', required: true, options: ['Yes', 'No'] };
    case 'hostel_name':
      return {
        id,
        label: 'Hostel Name',
        type: 'short_answer',
        section: 'Hostel & Accommodation',
        required: true,
        placeholder: 'e.g. Kaveri Hostel',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          show_when_value: 'Yes',
        } : undefined,
      };
    case 'room_number':
      return {
        id,
        label: 'Room Number',
        type: 'short_answer',
        section: 'Hostel & Accommodation',
        required: true,
        placeholder: 'e.g. Room 304',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          show_when_value: 'Yes',
        } : undefined,
      };
    case 'room_preference':
      return {
        id,
        label: 'Room Preference',
        type: 'dropdown',
        section: 'Hostel & Accommodation',
        required: true,
        options: ['Single Occupancy (AC)', 'Double Sharing (AC)', 'Four Sharing (Non-AC)'],
      };
    case 'declaration':
      return {
        id,
        label: 'I hereby declare that all information provided is true and correct to the best of my knowledge.',
        type: 'checkboxes',
        section: 'Declaration',
        required: true,
        options: ['I Agree and Confirm'],
      };
    case 'signature':
      return { id, label: 'Signature', type: 'signature', section: 'Declaration', required: true };

    case 'previous_experience':
      return {
        id,
        label: 'Do you have previous work experience?',
        type: 'yes_no',
        section: 'Professional Background',
        required: true,
        options: ['Yes', 'No'],
      };
    case 'company_name':
      return {
        id,
        label: 'Company Name',
        type: 'short_answer',
        section: 'Professional Background',
        required: false,
        placeholder: 'e.g. Acme Technologies',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          dependsOn: context.triggerFieldId,
          show_when_value: 'Yes',
          value: 'Yes',
          condition: 'equals',
          operator: 'equals',
          action: 'show',
        } : undefined,
      };
    case 'job_role':
      return {
        id,
        label: 'Job Role / Designation',
        type: 'short_answer',
        section: 'Professional Background',
        required: false,
        placeholder: 'e.g. Associate Engineer',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          dependsOn: context.triggerFieldId,
          show_when_value: 'Yes',
          value: 'Yes',
          condition: 'equals',
          operator: 'equals',
          action: 'show',
        } : undefined,
      };
    case 'years_of_experience':
      return {
        id,
        label: 'Years of Experience',
        type: 'number',
        section: 'Professional Background',
        required: false,
        placeholder: 'e.g. 2',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          dependsOn: context.triggerFieldId,
          show_when_value: 'Yes',
          value: 'Yes',
          condition: 'equals',
          operator: 'equals',
          action: 'show',
        } : undefined,
      };
    case 'previous_salary':
      return {
        id,
        label: 'Previous Salary',
        type: 'short_answer',
        section: 'Professional Background',
        required: false,
        placeholder: 'e.g. 6 LPA',
        conditional_logic: context?.triggerFieldId ? {
          enabled: true,
          depends_on_field_id: context.triggerFieldId,
          dependsOn: context.triggerFieldId,
          show_when_value: 'Yes',
          value: 'Yes',
          condition: 'equals',
          operator: 'equals',
          action: 'show',
        } : undefined,
      };

    default: {
      // General arbitrary token: NEVER DROP IT. Infer safe type and label
      const lower = token.toLowerCase();
      let type: FieldType = 'short_answer';
      let options: string[] | undefined;
      let section = 'Additional Information';

      if (lower.includes('photo') || lower.includes('image') || lower.includes('pic')) {
        type = 'image_upload';
        section = 'Documents & Proofs';
      } else if (lower.includes('upload') || lower.includes('file') || lower.includes('doc') || lower.includes('proof')) {
        type = 'file_upload';
        section = 'Documents & Proofs';
      } else if (lower.includes('email') || lower.includes('mail')) {
        type = 'email';
        section = 'Contact Information';
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
        type = 'phone';
        section = 'Contact Information';
      } else if (lower.includes('date') || lower.includes('dob')) {
        type = 'date';
        section = 'Personal Information';
      } else if (lower.includes('number') || lower.includes('amount') || lower.includes('count') || lower.includes('income')) {
        type = 'number';
      } else if (lower.includes('address') || lower.includes('description') || lower.includes('reason') || lower.includes('statement')) {
        type = 'long_answer';
      } else if (lower.includes('size')) {
        type = 'dropdown';
        options = ['S', 'M', 'L', 'XL', 'XXL'];
      }

      return {
        id,
        label: titleCase(token.trim()),
        type,
        section,
        required: true,
        options,
      };
    }
  }
}

function convertSpecToFormField(spec: FieldSpec): FormField {
  const options: FieldOption[] | undefined = spec.options?.map(opt => ({
    id: `opt-${generateId()}`,
    label: opt,
    value: opt,
  }));

  return {
    id: spec.id,
    type: spec.type,
    label: spec.label,
    placeholder: spec.placeholder || '',
    required: spec.required !== false,
    options: options || (spec.type === 'yes_no' ? [
      { id: `opt-${generateId()}`, label: 'Yes', value: 'Yes' },
      { id: `opt-${generateId()}`, label: 'No', value: 'No' },
    ] : (spec.type === 'dropdown' || spec.type === 'multiple_choice' ? [
      { id: `opt-${generateId()}`, label: 'Option 1', value: 'Option 1' },
      { id: `opt-${generateId()}`, label: 'Option 2', value: 'Option 2' },
    ] : undefined)),
    conditional_logic: spec.conditional_logic || { enabled: false },
    logic: spec.conditional_logic || { enabled: false },
  };
}

function createSectionField(title: string, description?: string): FormField {
  return {
    id: `sec-${generateId()}`,
    type: 'section',
    label: title,
    section_title: title,
    section_description: description,
    required: false,
  };
}

// ─── 4. Form Metadata & Title Optimizer ─────────────────────────────────────────

export function extractOptimizedFormMetadata(
  userPrompt: string,
  tokenDetails: PromptTokenDetail[],
  globalType?: FieldType
): {
  title: string;
  description: string;
  category: string;
} {
  const p = userPrompt.trim().toLowerCase();

  // 1. Biodata (priority requested: e.g. "Biodata Details")
  if (p.includes('biodata')) {
    return {
      title: 'Biodata Details',
      description: 'Comprehensive biodata collection including personal, educational, and family details.',
      category: 'General',
    };
  }

  // 2. Workshop / Training
  if (p.includes('workshop') || p.includes('bootcamp') || p.includes('webinar') || p.includes('seminar')) {
    return {
      title: 'Workshop Registration Form',
      description: 'Register your participation and select your preferred sessions.',
      category: 'Events',
    };
  }

  // 3. Hostel / Accommodation
  if (p.includes('hostel') || p.includes('dormitory') || p.includes('housing')) {
    return {
      title: 'Hostel Accommodation Application',
      description: 'Apply for campus residential facilities and room allocation.',
      category: 'Hostel & Facilities',
    };
  }

  // 4. Scholarship / Financial Aid
  if (p.includes('scholarship') || p.includes('fellowship') || p.includes('grant') || p.includes('financial aid')) {
    return {
      title: 'Institutional Scholarship Application',
      description: 'Submit your academic and financial credentials for scholarship evaluation.',
      category: 'Financial Aid',
    };
  }

  // 5. Admission / Enrollment
  if (p.includes('admission') || p.includes('enrol')) {
    return {
      title: 'Institutional Admission Form',
      description: 'Official student enrollment and document verification.',
      category: 'Admissions',
    };
  }

  // 6. Internship / Placement
  if (p.includes('internship') || p.includes('placement')) {
    return {
      title: 'Internship Registration Form',
      description: 'Register internship details including company, role, and duration.',
      category: 'Academic',
    };
  }

  // 7. Feedback / Evaluation / Survey
  if (p.includes('feedback') || p.includes('survey') || p.includes('evaluation')) {
    return {
      title: p.includes('faculty') || p.includes('course') || p.includes('teacher')
        ? 'Course & Faculty Feedback Form'
        : 'Student Feedback Form',
      description: 'Collect constructive feedback and suggestions for institutional improvement.',
      category: 'Feedback',
    };
  }

  // 8. Event / Conference
  if (p.includes('event') || p.includes('conference') || p.includes('hackathon')) {
    return {
      title: 'Event Registration Form',
      description: 'Register for upcoming events, sessions, and participant tracking.',
      category: 'Events',
    };
  }

  // 9. Job / Employment / Recruitment
  if (p.includes('job') || p.includes('employment') || p.includes('hiring') || p.includes('recruitment')) {
    return {
      title: 'Job Application Form',
      description: 'Submit your candidate credentials, qualifications, and employment history.',
      category: 'Administration',
    };
  }

  // 10. Staff / Faculty
  if (p.includes('staff') || p.includes('faculty') || p.includes('employee')) {
    return {
      title: 'Staff Information Form',
      description: 'Official institutional staff onboarding and employment record.',
      category: 'Administration',
    };
  }

  // 11. Student Information
  if (p.includes('student') || p.includes('registration')) {
    return {
      title: 'Student Information Form',
      description: 'Official student profile collection and documentation verification.',
      category: 'Academic',
    };
  }

  // 12. Explicit bolded or quoted title extraction:
  // e.g. **Course Feedback Form**, "Alumni Directory", Title: Visitor Pass
  const explicitMatch = userPrompt.match(/(?:\*\*|["']|Title:\s*)([A-Za-z0-9\s/&-]+?\b(?:Form|Application|Survey|Questionnaire|Registration|Details|Checklist|Directory|Pass|Review))\b(?:\*\*|["']|\n|$)/i);
  if (explicitMatch && explicitMatch[1].trim().length > 3 && explicitMatch[1].trim().length < 50) {
    const raw = explicitMatch[1].trim().replace(/[\*"'`]+/g, '');
    return {
      title: titleCase(raw),
      description: 'Please provide the requested details accurately.',
      category: 'General',
    };
  }

  // 13. Action phrase extraction:
  // e.g. "Create a Patient Intake Form for collecting ..."
  const actionMatch = userPrompt.match(/(?:create|build|generate|make)\s+(?:a\s+)?(?:complete\s+|new\s+|official\s+|simple\s+)?([A-Za-z0-9\s/&-]+?\b(?:Form|Application|Survey|Questionnaire|Registration|Details|Checklist))\b/i);
  if (actionMatch && actionMatch[1].trim().length > 3 && actionMatch[1].trim().length < 50) {
    const raw = actionMatch[1].trim().replace(/^form\s+(?:for|to|with)\s+/i, '').replace(/[\*"'`]+/g, '');
    return {
      title: titleCase(raw),
      description: 'Please provide the requested details accurately.',
      category: 'General',
    };
  }

  // 14. Fallback for custom questions/tokens
  if (tokenDetails.length > 0) {
    const names = tokenDetails.slice(0, 3).map(t => t.label).join(', ');
    return {
      title: `${names} Questionnaire`,
      description: globalType === 'yes_no'
        ? 'Please answer Yes or No for each of the following questions.'
        : 'Please provide the requested details accurately.',
      category: 'General',
    };
  }

  return {
    title: 'Institutional Information Form',
    description: 'Please provide the requested details accurately.',
    category: 'General',
  };
}

// ─── 5. Main Generator Engine with Auto-Repair ────────────────────────────────

export async function generateFormFromPrompt(userPrompt: string): Promise<GeneratedFormSchema> {
  const p = userPrompt.trim().toLowerCase();

  // 1. Analyze prompt intent and extract tokens with any explicit/global types
  const { tokens: tokenDetails, globalType } = analyzePromptTokens(userPrompt);
  const tokens = tokenDetails.map(t => t.token);

  // 2. Identify Optimized Title, Description & Category
  const meta = extractOptimizedFormMetadata(userPrompt, tokenDetails, globalType);
  const title = meta.title;
  const description = meta.description;
  const category = meta.category;

  // 3. Check for conditional requirements
  const isConditionalHostel = p.includes('only if') && p.includes('hostel');
  const isConditionalExp =
    tokenDetails.some(t => t.conditionalOn === 'previous_experience') ||
    p.includes('if experienced') ||
    (p.includes('experience') && (p.includes('company') || p.includes('role') || p.includes('salary')));

  // If conditional hostel is requested, ensure hostel_resident trigger exists
  let hostelTriggerId: string | undefined;
  if (isConditionalHostel) {
    const triggerSpec = getFieldSpecForToken('hostel student');
    hostelTriggerId = triggerSpec.id;
  }

  // If conditional experience is requested, ensure previous_experience trigger exists
  let expTriggerId: string | undefined;
  if (isConditionalExp) {
    const triggerSpec = getFieldSpecForToken('previous experience');
    expTriggerId = triggerSpec.id;
  }

  const fieldSpecs: FieldSpec[] = [];
  const addedKeys = new Set<string>();

  // If conditional hostel, add the trigger first
  if (isConditionalHostel && hostelTriggerId) {
    const triggerSpec = getFieldSpecForToken('hostel student');
    fieldSpecs.push(triggerSpec);
    addedKeys.add('hostel_resident');
  }

  // If conditional experience, add the trigger first if not in requested tokens
  if (isConditionalExp && expTriggerId && !tokenDetails.some(t => normalizeFieldName(t.token) === 'previous_experience')) {
    const triggerSpec = getFieldSpecForToken('previous experience');
    fieldSpecs.push(triggerSpec);
    addedKeys.add('previous_experience');
  }

  for (const detail of tokenDetails) {
    const norm = normalizeFieldName(detail.token);
    if (addedKeys.has(norm)) continue;
    addedKeys.add(norm);

    let activeTriggerId = hostelTriggerId;
    if (
      detail.conditionalOn === 'previous_experience' ||
      norm === 'company_name' ||
      norm === 'job_role' ||
      norm === 'years_of_experience' ||
      norm === 'previous_salary'
    ) {
      if (isConditionalExp && expTriggerId) {
        activeTriggerId = expTriggerId;
      }
    }

    const spec = getFieldSpecForToken(detail.token, {
      triggerFieldId: activeTriggerId,
      overrideType: detail.overrideType,
      customId: norm === 'previous_experience' ? expTriggerId : (norm === 'hostel_resident' ? hostelTriggerId : undefined),
    });
    fieldSpecs.push(spec);
  }

  // If biodata was requested, ensure the full suite of personal, educational, and family fields are provided
  if (p.includes('biodata')) {
    const biodataTokens = [
      'full_name',
      'dob',
      'gender',
      'blood_group',
      'phone_number',
      'email',
      'address',
      'photo',
      'highest_qualification',
      'college_name',
      'department',
      'cgpa',
      'parent_name',
      'mother_name',
      'parent_phone_number',
      'family_income',
    ];
    for (const token of biodataTokens) {
      const norm = normalizeFieldName(token);
      if (!addedKeys.has(norm)) {
        addedKeys.add(norm);
        fieldSpecs.push(getFieldSpecForToken(token));
      }
    }
  }

  // If no tokens were extractable (e.g. pure generic prompt "Create a college admission form")
  // Provide intelligent default institutional fields:
  if (fieldSpecs.length === 0) {
    const defaultTokens = ['name', 'email', 'phone', 'department', 'student photo'];
    for (const token of defaultTokens) {
      fieldSpecs.push(getFieldSpecForToken(token));
    }
  }

  // 5. Build questions in the EXACT sequence requested by user without re-sorting
  const questions: FormField[] = fieldSpecs.map(spec => convertSpecToFormField(spec));

  // Auto-Repair: ensure no requested token is missed, appended in order
  for (const token of tokens) {
    const norm = normalizeFieldName(token);
    const exists = questions.some(f => normalizeFieldName(f.label) === norm || f.id.includes(norm));
    if (!exists) {
      const spec = getFieldSpecForToken(token);
      questions.push(convertSpecToFormField(spec));
    }
  }

  // 6. Section Division Logic:
  // As explicitly required: remove hardcoded thematic sections (Personal Information, Questions, etc.)
  // When there are multiple questions (>= 4), divide the questions count by 2 and create 2 balanced sections:
  // Section 1 = first half, Section 2 = second half.
  const finalFields: FormField[] = [];
  const sectionCounts: { name: string; count: number }[] = [];

  const totalQuestions = questions.length;
  if (totalQuestions >= 4) {
    const mid = Math.ceil(totalQuestions / 2);
    const part1 = questions.slice(0, mid);
    const part2 = questions.slice(mid);

    finalFields.push(createSectionField('Section 1', 'Basic Information'));
    finalFields.push(...part1);
    sectionCounts.push({ name: 'Section 1', count: part1.length });

    finalFields.push(createSectionField('Section 2', 'Additional Details'));
    finalFields.push(...part2);
    sectionCounts.push({ name: 'Section 2', count: part2.length });
  } else {
    // If fewer than 4 questions, keep as a single clean group without artificial section clutter
    finalFields.push(...questions);
    sectionCounts.push({ name: 'General', count: questions.length });
  }

  const finalGeneratedCount = finalFields.filter(f => f.type !== 'section').length;

  return {
    title,
    description,
    category,
    fields: finalFields,
    summary: {
      requestedFieldCount: tokens.length > 0 ? tokens.length : totalQuestions,
      generatedFieldCount: finalGeneratedCount,
      missingFieldCount: 0,
      sections: sectionCounts,
    },
  };
}

// ─── 5. Follow-Up Refinement Engine ───────────────────────────────────────────

export async function refineFormSchema(
  current: GeneratedFormSchema,
  refinementPrompt: string
): Promise<GeneratedFormSchema> {
  const p = refinementPrompt.trim().toLowerCase();
  let updatedFields = [...current.fields];

  // 1. "Remove [field]"
  if (p.includes('remove') || p.includes('delete')) {
    if (p.includes('phone') && !p.includes('parent phone')) {
      updatedFields = updatedFields.filter(f => {
        const isPhone = f.type === 'phone' || f.label.toLowerCase().includes('phone');
        const isParentPhone = f.label.toLowerCase().includes('parent');
        return !(isPhone && !isParentPhone);
      });
    }
    if (p.includes('parent phone')) {
      updatedFields = updatedFields.filter(f => !f.label.toLowerCase().includes('parent'));
    }
    if (p.includes('address')) {
      updatedFields = updatedFields.filter(f => !f.label.toLowerCase().includes('address'));
    }
    if (p.includes('photo') || p.includes('pic')) {
      updatedFields = updatedFields.filter(f => !f.label.toLowerCase().includes('photo') && !f.label.toLowerCase().includes('pic'));
    }
  }

  // 2. "Make department a dropdown" / type modification
  if (p.includes('department') && (p.includes('dropdown') || p.includes('drop down'))) {
    updatedFields = updatedFields.map(f => {
      if (normalizeFieldName(f.label) === 'department' || f.label.toLowerCase().includes('department')) {
        return {
          ...f,
          type: 'dropdown',
          options: [
            { id: `opt-${generateId()}`, label: 'Computer Science & Engineering', value: 'Computer Science & Engineering' },
            { id: `opt-${generateId()}`, label: 'Artificial Intelligence & Data Science', value: 'Artificial Intelligence & Data Science' },
            { id: `opt-${generateId()}`, label: 'Information Technology', value: 'Information Technology' },
            { id: `opt-${generateId()}`, label: 'Electronics & Communication', value: 'Electronics & Communication' },
            { id: `opt-${generateId()}`, label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
            { id: `opt-${generateId()}`, label: 'Management Studies', value: 'Management Studies' },
          ],
        };
      }
      return f;
    });
  }

  // 2b. "Make all yes no" / "convert into yes or no format"
  if (
    p.includes('all yes no') || p.includes('all yes/no') || p.includes('all yes or no') ||
    p.includes('yes or no format') || p.includes('yes/no format') ||
    p.includes('convert into yes or no') || p.includes('make them yes no') ||
    p.includes('make all yes no')
  ) {
    updatedFields = updatedFields.map(f => {
      if (f.type === 'section') return f;
      return {
        ...f,
        type: 'yes_no',
        options: [
          { id: `opt-${generateId()}`, label: 'Yes', value: 'Yes' },
          { id: `opt-${generateId()}`, label: 'No', value: 'No' },
        ],
      };
    });
  }

  // 3. Add fields through refinement (e.g. "Add parent name, parent phone and address" or "Add college name and photo")
  // Extract newly requested tokens
  const addKeywords = ['add', 'include', 'insert', 'also collect', 'also ask'];
  const hasAddIntent = addKeywords.some(w => p.includes(w));

  if (hasAddIntent) {
    // Strip "add", "also ask", etc. to get the list of fields to add
    let addText = p;
    for (const kw of addKeywords) {
      if (addText.includes(kw)) {
        addText = addText.substring(addText.indexOf(kw) + kw.length);
        break;
      }
    }

    const { tokens } = analyzePromptTokens(addText);

    for (const detail of tokens) {
      const norm = normalizeFieldName(detail.token);
      // Don't add duplicates if already present
      const alreadyExists = updatedFields.some(f => f.type !== 'section' && normalizeFieldName(f.label) === norm);
      if (alreadyExists) continue;

      const spec = getFieldSpecForToken(detail.token, { overrideType: detail.overrideType });
      const newField = convertSpecToFormField(spec);

      // Find if section exists
      const targetSectionIndex = updatedFields.findIndex(
        f => f.type === 'section' && (f.section_title || f.label) === spec.section
      );

      if (targetSectionIndex !== -1) {
        // Insert after existing section items
        let insertIndex = targetSectionIndex + 1;
        while (insertIndex < updatedFields.length && updatedFields[insertIndex].type !== 'section') {
          insertIndex++;
        }
        updatedFields.splice(insertIndex, 0, newField);
      } else {
        // Append field directly without creating arbitrary thematic sections
        updatedFields.push(newField);
      }
    }
  }

  // 3b. Section adjustments via refinement: e.g. "divide by 2 and create 2 sections", "remove sections"
  if (p.includes('divide') || p.includes('2 section') || p.includes('two section') || p.includes('split into 2')) {
    const rawQuestions = updatedFields.filter(f => f.type !== 'section');
    if (rawQuestions.length >= 2) {
      const mid = Math.ceil(rawQuestions.length / 2);
      updatedFields = [
        createSectionField('Section 1', 'Basic Information'),
        ...rawQuestions.slice(0, mid),
        createSectionField('Section 2', 'Additional Details'),
        ...rawQuestions.slice(mid),
      ];
    }
  } else if (p.includes('remove section') || p.includes('no section') || p.includes('delete section') || p.includes('without section')) {
    updatedFields = updatedFields.filter(f => f.type !== 'section');
  }

  // 4. Conditional logic refinement (e.g. "Ask hostel name and room number only if hostel student is yes")
  if (p.includes('only if') || (p.includes('if') && p.includes('hostel'))) {
    let triggerField = updatedFields.find(f => normalizeFieldName(f.label) === 'hostel_resident');
    if (!triggerField) {
      triggerField = convertSpecToFormField(getFieldSpecForToken('hostel student'));
      updatedFields.push(triggerField);
    }

    // Add hostel name and room number if not present
    let hostelNameField = updatedFields.find(f => normalizeFieldName(f.label) === 'hostel_name');
    if (!hostelNameField) {
      hostelNameField = convertSpecToFormField(getFieldSpecForToken('hostel name', { triggerFieldId: triggerField.id }));
      updatedFields.push(hostelNameField);
    } else {
      hostelNameField.conditional_logic = {
        enabled: true,
        depends_on_field_id: triggerField.id,
        show_when_value: 'Yes',
      };
    }

    let roomNumberField = updatedFields.find(f => normalizeFieldName(f.label) === 'room_number');
    if (!roomNumberField) {
      roomNumberField = convertSpecToFormField(getFieldSpecForToken('room number', { triggerFieldId: triggerField.id }));
      updatedFields.push(roomNumberField);
    } else {
      roomNumberField.conditional_logic = {
        enabled: true,
        depends_on_field_id: triggerField.id,
        show_when_value: 'Yes',
      };
    }
  }

  // Re-calculate summary
  const inputFields = updatedFields.filter(f => f.type !== 'section');
  const sectionFields = updatedFields.filter(f => f.type === 'section');

  return {
    ...current,
    fields: updatedFields,
    summary: {
      requestedFieldCount: inputFields.length,
      generatedFieldCount: inputFields.length,
      missingFieldCount: 0,
      sections: sectionFields.map(s => ({
        name: s.section_title || s.label,
        count: updatedFields.filter((f, idx) => {
          if (f.type === 'section') return false;
          // count fields following this section until next section
          const myIdx = updatedFields.indexOf(s);
          return idx > myIdx;
        }).length,
      })),
    },
  };
}
