import { generateFormFromPrompt, normalizeFieldName } from '../src/lib/ai-form-generator';
import { checkSubmissionForDuplicate } from '../src/lib/duplicate-detector';
import type { Form, FormResponse } from '../src/types';

async function runTests() {
  console.log('=== RUNNING SMART FEATURES & AUDIT VERIFICATION SUITE ===\n');

  // Test 1: AI Prompt with Conditional Relationship
  console.log('--- Test 1: Complex Prompt with Experience and Conditional Company Name ---');
  const prompt = "Create a student registration form with name, student ID, department, year, email, phone number, previous experience, company name if experienced, resume upload and certificates";
  const formSchema = await generateFormFromPrompt(prompt);

  console.log('Generated Form Title:', formSchema.title);
  console.log('Generated Field Count (excluding sections):', formSchema.fields.filter(f => f.type !== 'section').length);

  const labels = formSchema.fields.filter(f => f.type !== 'section').map(f => f.label);
  console.log('Field Labels:', labels);

  // Check required fields
  const hasName = labels.some(l => l.toLowerCase().includes('name') && !l.toLowerCase().includes('company'));
  const hasId = labels.some(l => l.toLowerCase().includes('id'));
  const hasDept = labels.some(l => l.toLowerCase().includes('department'));
  const hasYear = labels.some(l => l.toLowerCase().includes('year'));
  const hasEmail = labels.some(l => l.toLowerCase().includes('email'));
  const hasPhone = labels.some(l => l.toLowerCase().includes('phone'));
  const hasExp = labels.some(l => l.toLowerCase().includes('experience'));
  const hasCompany = labels.some(l => l.toLowerCase().includes('company'));
  const hasResume = labels.some(l => l.toLowerCase().includes('resume') || l.toLowerCase().includes('cv'));
  const hasCerts = labels.some(l => l.toLowerCase().includes('certificate'));

  if (!hasName || !hasId || !hasDept || !hasYear || !hasEmail || !hasPhone || !hasExp || !hasCompany || !hasResume || !hasCerts) {
    console.error('FAIL: Missing one of the requested fields!');
    console.error({ hasName, hasId, hasDept, hasYear, hasEmail, hasPhone, hasExp, hasCompany, hasResume, hasCerts });
    process.exit(1);
  }
  console.log('✓ All 10 requested fields are present!');

  // Check conditional logic on company name
  const expField = formSchema.fields.find(f => f.label.toLowerCase().includes('experience') && f.type === 'yes_no');
  const companyField = formSchema.fields.find(f => f.label.toLowerCase().includes('company'));

  if (!expField) {
    console.error('FAIL: Previous experience trigger field not found as yes_no type!');
    process.exit(1);
  }
  if (!companyField) {
    console.error('FAIL: Company name field not found!');
    process.exit(1);
  }

  const condLogic = companyField.conditional_logic || companyField.logic;
  if (!condLogic || !condLogic.enabled) {
    console.error('FAIL: Company name does not have conditional logic enabled!', companyField);
    process.exit(1);
  }
  if (condLogic.depends_on_field_id !== expField.id && condLogic.dependsOn !== expField.id) {
    console.error('FAIL: Company name depends on wrong field ID!', condLogic, expField.id);
    process.exit(1);
  }
  console.log('✓ Conditional relationship verified: Company Name shows when Previous Experience is "Yes"!');

  // Test 2: Duplicate Detection Engine
  console.log('\n--- Test 2: Duplicate Detection Engine ---');
  const mockForm: Form = {
    id: 'form-test-1',
    organization_id: 'org-1',
    title: 'Registration Form',
    slug: 'reg-form',
    status: 'published',
    response_count: 1,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {
      duplicate_detection_enabled: true,
      duplicate_identifiers: ['email', 'student_id'],
    },
    fields: [
      { id: 'fld-name', label: 'Full Name', type: 'short_answer', required: true },
      { id: 'fld-email', label: 'Email Address', type: 'email', required: true },
      { id: 'fld-student-id', label: 'Student ID', type: 'short_answer', required: true },
    ],
  };

  const existingResponses: FormResponse[] = [
    {
      id: 'resp-1',
      form_id: 'form-test-1',
      form_title: 'Registration Form',
      response_id: 'INF-2026-00001',
      status: 'complete',
      submitted_at: '2026-09-19T10:00:00.000Z',
      participant_name: 'John Doe',
      participant_email: 'john@example.com',
      files: [],
      notes: [],
      answers: [
        { id: 'a1', response_id: 'resp-1', field_id: 'fld-name', field_label: 'Full Name', value: 'John Doe' },
        { id: 'a2', response_id: 'resp-1', field_id: 'fld-email', field_label: 'Email Address', value: 'john@example.com' },
        { id: 'a3', response_id: 'resp-1', field_id: 'fld-student-id', field_label: 'Student ID', value: 'SEC-101' },
      ],
    },
  ];

  // Case A: Duplicate email submitted
  const duplicateSubmissionAnswers = [
    { field_id: 'fld-name', field_label: 'Full Name', value: 'Johnathan D' },
    { field_id: 'fld-email', field_label: 'Email Address', value: 'JOHN@EXAMPLE.COM' }, // uppercase test
    { field_id: 'fld-student-id', field_label: 'Student ID', value: 'SEC-999' },
  ];

  const dupResultA = checkSubmissionForDuplicate(mockForm, duplicateSubmissionAnswers, existingResponses);
  if (!dupResultA.isDuplicate || dupResultA.originalResponseId !== 'INF-2026-00001') {
    console.error('FAIL: Failed to detect duplicate by email!', dupResultA);
    process.exit(1);
  }
  console.log('✓ Successfully flagged duplicate submission by email!');
  console.log('  Matched field:', dupResultA.matchField);
  console.log('  Original respondent:', dupResultA.originalName);

  // Case B: Unique submission
  const uniqueSubmissionAnswers = [
    { field_id: 'fld-name', field_label: 'Full Name', value: 'Alice Smith' },
    { field_id: 'fld-email', field_label: 'Email Address', value: 'alice@example.com' },
    { field_id: 'fld-student-id', field_label: 'Student ID', value: 'SEC-202' },
  ];

  const dupResultB = checkSubmissionForDuplicate(mockForm, uniqueSubmissionAnswers, existingResponses);
  if (dupResultB.isDuplicate) {
    console.error('FAIL: Falsely flagged unique submission as duplicate!', dupResultB);
    process.exit(1);
  }
  console.log('✓ Verified unique submission is not flagged as duplicate!');

  console.log('\n=== ALL SMART FEATURES TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Unexpected test failure:', err);
  process.exit(1);
});
