import { PREBUILT_TEMPLATES } from '../src/data/formTemplates';

console.log('====================================================');
console.log('INFO DESK — PREBUILT TEMPLATES VERIFICATION');
console.log('====================================================\n');

const EXPECTED_COUNTS: Record<string, number> = {
  'tpl-001': 22,
  'tpl-002': 9,
  'tpl-003': 8,
  'tpl-004': 8,
  'tpl-005': 12,
  'tpl-006': 10,
  'tpl-007': 6,
  'tpl-008': 18,
};

if (PREBUILT_TEMPLATES.length !== 8) {
  throw new Error(`Expected 8 templates, found ${PREBUILT_TEMPLATES.length}`);
}

for (const tpl of PREBUILT_TEMPLATES) {
  const inputFields = tpl.fields.filter(f => f.type !== 'section');
  const sectionHeaders = tpl.fields.filter(f => f.type === 'section');
  const expected = EXPECTED_COUNTS[tpl.id];

  console.log(`[${tpl.id}] ${tpl.title} (${tpl.category}):`);
  console.log(`   Expected: ${expected} fields | Found: ${inputFields.length} input fields + ${sectionHeaders.length} sections`);

  if (inputFields.length === 0) {
    throw new Error(`Template ${tpl.id} (${tpl.title}) is EMPTY!`);
  }

  if (inputFields.length !== expected) {
    throw new Error(`Template ${tpl.id} field count mismatch: expected ${expected}, got ${inputFields.length}`);
  }

  // Check every field has valid label and type
  for (const f of tpl.fields) {
    if (!f.type) throw new Error(`Field ${f.id} in ${tpl.id} missing type`);
    if (f.type !== 'section' && !f.label) throw new Error(`Field ${f.id} in ${tpl.id} missing label`);
    if ((f.type === 'dropdown' || f.type === 'multiple_choice') && (!f.options || f.options.length === 0)) {
      throw new Error(`Dropdown/Choice field ${f.label} in ${tpl.id} has no options`);
    }
  }

  console.log(`   ✓ Passed: All ${inputFields.length} fields fully populated.\n`);
}

console.log('====================================================');
console.log('🎉 ALL 8 TEMPLATES FULLY PRELOADED & VERIFIED! 🎉');
console.log('====================================================\n');
