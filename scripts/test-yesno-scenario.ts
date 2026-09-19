import { generateFormFromPrompt, refineFormSchema } from '../src/lib/ai-form-generator';

async function testYesNoScenarios() {
  console.log('====================================================');
  console.log('TESTING PROMPT INTENT & YES/NO CONVERSION');
  console.log('====================================================\n');

  // Case 1: "hulk,iron,people all yes no"
  console.log('--- Case 1: "hulk,iron,people all yes no" ---');
  const res1 = await generateFormFromPrompt('hulk,iron,people all yes no');
  const fields1 = res1.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields1.map(f => `${f.label} (${f.type})`).join(', '));
  console.log('Summary:', res1.summary);

  if (fields1.length !== 3) {
    throw new Error(`Case 1 failed: Expected 3 fields, got ${fields1.length}`);
  }
  const allYesNo1 = fields1.every(f => f.type === 'yes_no');
  if (!allYesNo1) {
    throw new Error(`Case 1 failed: Not all fields are yes_no! Types are: ${fields1.map(f => f.type).join(', ')}`);
  }
  const labels1 = fields1.map(f => f.label.toLowerCase());
  if (!labels1.includes('hulk') || !labels1.includes('iron') || !labels1.includes('people')) {
    throw new Error(`Case 1 failed: Missing expected labels (hulk, iron, people)`);
  }
  console.log('✓ Case 1 Passed: Hulk, Iron, People all created in yes_no format!\n');

  // Case 2: "hulk, iron, people convert into yes or no format"
  console.log('--- Case 2: "hulk, iron, people convert into yes or no format" ---');
  const res2 = await generateFormFromPrompt('hulk, iron, people convert into yes or no format');
  const fields2 = res2.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields2.map(f => `${f.label} (${f.type})`).join(', '));
  if (fields2.length !== 3 || !fields2.every(f => f.type === 'yes_no')) {
    throw new Error(`Case 2 failed: Expected 3 yes_no fields, got ${fields2.map(f => `${f.label}:${f.type}`).join(', ')}`);
  }
  console.log('✓ Case 2 Passed: Successfully converted into yes or no format!\n');

  // Case 3: Mixed inline types "hulk (yes/no), iron (yes/no), people (dropdown)"
  console.log('--- Case 3: Mixed inline types "hulk (yes/no), iron (yes/no), people (dropdown)" ---');
  const res3 = await generateFormFromPrompt('hulk (yes/no), iron (yes/no), people (dropdown)');
  const fields3 = res3.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields3.map(f => `${f.label} (${f.type})`).join(', '));
  const hulkField = fields3.find(f => f.label.toLowerCase().includes('hulk'));
  const ironField = fields3.find(f => f.label.toLowerCase().includes('iron'));
  const peopleField = fields3.find(f => f.label.toLowerCase().includes('people'));
  if (hulkField?.type !== 'yes_no' || ironField?.type !== 'yes_no' || peopleField?.type !== 'dropdown') {
    throw new Error('Case 3 failed: Inline type resolution mismatch');
  }
  console.log('✓ Case 3 Passed: Mixed inline types resolved properly.\n');

  // Case 4: Refinement "make all yes no"
  console.log('--- Case 4: Refinement "make all yes no" ---');
  const baseSchema = await generateFormFromPrompt('hulk, iron, people');
  console.log('Initial fields:', baseSchema.fields.filter(f => f.type !== 'section').map(f => `${f.label} (${f.type})`).join(', '));
  const refined = await refineFormSchema(baseSchema, 'convert into yes or no format');
  const refinedFields = refined.fields.filter(f => f.type !== 'section');
  console.log('Refined fields:', refinedFields.map(f => `${f.label} (${f.type})`).join(', '));
  if (!refinedFields.every(f => f.type === 'yes_no')) {
    throw new Error('Case 4 failed: Refinement did not convert all fields to yes_no');
  }
  console.log('✓ Case 4 Passed: Refinement successfully converted all fields into yes_no format.\n');

  // Case 5: "Disabled Yes Or No"
  console.log('--- Case 5: "Disabled Yes Or No" ---');
  const res5 = await generateFormFromPrompt('Disabled Yes Or No');
  const fields5 = res5.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields5.map(f => `${f.label} (${f.type}, options: ${f.options?.map(o => o.label).join('/')})`).join(', '));
  if (fields5.length !== 1) {
    throw new Error(`Case 5 failed: Expected 1 field, got ${fields5.length}`);
  }
  const f5 = fields5[0];
  if (f5.label.toLowerCase() !== 'disabled') {
    throw new Error(`Case 5 failed: Expected label 'Disabled', got '${f5.label}'`);
  }
  if (f5.type !== 'yes_no') {
    throw new Error(`Case 5 failed: Expected type 'yes_no', got '${f5.type}'`);
  }
  if (!f5.options || f5.options.length !== 2 || f5.options[0].label !== 'Yes' || f5.options[1].label !== 'No') {
    throw new Error(`Case 5 failed: Expected options ['Yes', 'No'], got: ${JSON.stringify(f5.options)}`);
  }
  console.log('✓ Case 5 Passed: "Disabled Yes Or No" created question "Disabled" with 2 options (Yes / No)!\n');

  // Case 6: "name, college, disabled yes or no, id"
  console.log('--- Case 6: "name, college, disabled yes or no, id" ---');
  const res6 = await generateFormFromPrompt('name, college, disabled yes or no, id');
  const fields6 = res6.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields6.map(f => `${f.label} (${f.type})`).join(', '));
  if (fields6.length !== 4) {
    throw new Error(`Case 6 failed: Expected 4 fields, got ${fields6.length}`);
  }
  const disField6 = fields6.find(f => f.label.toLowerCase() === 'disabled');
  if (!disField6 || disField6.type !== 'yes_no' || !disField6.options || disField6.options.length !== 2) {
    throw new Error(`Case 6 failed: Disabled field missing or not yes_no with 2 options: ${JSON.stringify(disField6)}`);
  }
  console.log('✓ Case 6 Passed: Multi-field prompt with "disabled yes or no" extracted accurately!\n');

  // Case 7: "Hostel resident yes or no"
  console.log('--- Case 7: "Hostel resident yes or no" ---');
  const res7 = await generateFormFromPrompt('Hostel resident yes or no');
  const fields7 = res7.fields.filter(f => f.type !== 'section');
  console.log('Generated fields:', fields7.map(f => `${f.label} (${f.type})`).join(', '));
  const f7 = fields7[0];
  if (f7.type !== 'yes_no' || !f7.options || f7.options.length !== 2) {
    throw new Error(`Case 7 failed: Expected yes_no with 2 options, got ${JSON.stringify(f7)}`);
  }
  console.log('✓ Case 7 Passed: Trailing yes or no format resolved cleanly!\n');

  console.log('====================================================');
  console.log('🎉 ALL YES/NO SCENARIOS PASSED WITH FLYING COLORS! 🎉');
  console.log('====================================================\n');
}

testYesNoScenarios().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
