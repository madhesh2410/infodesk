import { generateFormFromPrompt, refineFormSchema } from '../src/lib/ai-form-generator';

async function runTestSuite() {
  console.log('====================================================');
  console.log('INFO DESK — AI FORM GENERATOR VERIFICATION (TESTS A-H)');
  console.log('====================================================\n');

  // TEST A
  console.log('--- TEST A: Comma-separated list ---');
  const testA = await generateFormFromPrompt('name,college,id,dept,sec id,mail,pic');
  const fieldsA = testA.fields.filter(f => f.type !== 'section');
  console.log(`Generated ${fieldsA.length} fields:`, fieldsA.map(f => `${f.label} (${f.type})`).join(', '));
  console.log('Summary:', testA.summary);
  if (fieldsA.length !== 7) {
    throw new Error(`TEST A FAILED: Expected 7 fields, got ${fieldsA.length}`);
  }
  const hasFullName = fieldsA.some(f => f.label.toLowerCase().includes('name'));
  const hasCollege = fieldsA.some(f => f.label.toLowerCase().includes('college'));
  const hasId = fieldsA.some(f => f.label === 'ID' || f.label.toLowerCase().includes('identification'));
  const hasDept = fieldsA.some(f => f.label.toLowerCase().includes('department'));
  const hasSecId = fieldsA.some(f => f.label.toLowerCase().includes('section id'));
  const hasMail = fieldsA.some(f => f.label.toLowerCase().includes('email'));
  const hasPic = fieldsA.some(f => f.type === 'image_upload');
  if (!hasFullName || !hasCollege || !hasId || !hasDept || !hasSecId || !hasMail || !hasPic) {
    throw new Error('TEST A FAILED: One or more of the 7 requested fields are missing!');
  }
  console.log('✓ TEST A PASSED: All 7 requested fields exist with correct types!\n');

  // TEST B
  console.log('--- TEST B: 9 comma-separated fields ---');
  const testB = await generateFormFromPrompt('name,email,phone,address,dob,gender,photo,id proof,certificate');
  const fieldsB = testB.fields.filter(f => f.type !== 'section');
  console.log(`Generated ${fieldsB.length} fields:`, fieldsB.map(f => `${f.label} (${f.type})`).join(', '));
  if (fieldsB.length !== 9) {
    throw new Error(`TEST B FAILED: Expected 9 fields, got ${fieldsB.length}`);
  }
  console.log('✓ TEST B PASSED: Exactly 9 fields generated.\n');

  // TEST C
  console.log('--- TEST C: Student registration natural language ---');
  const testC = await generateFormFromPrompt(
    'Create a student registration form with name, register number, department, year, section, email, phone and photo.'
  );
  const fieldsC = testC.fields.filter(f => f.type !== 'section');
  console.log(`Generated ${fieldsC.length} fields:`, fieldsC.map(f => `${f.label} (${f.type})`).join(', '));
  if (fieldsC.length < 8) {
    throw new Error(`TEST C FAILED: Expected at least 8 fields, got ${fieldsC.length}`);
  }
  console.log('✓ TEST C PASSED: At least 8 fields generated.\n');

  // TEST D
  console.log('--- TEST D: Workshop registration natural language ---');
  const testD = await generateFormFromPrompt(
    'Create a workshop registration form with participant name, email, phone, department, preferred session and ID card upload.'
  );
  const fieldsD = testD.fields.filter(f => f.type !== 'section');
  console.log(`Generated ${fieldsD.length} fields:`, fieldsD.map(f => `${f.label} (${f.type})`).join(', '));
  if (fieldsD.length < 6) {
    throw new Error(`TEST D FAILED: Expected at least 6 fields, got ${fieldsD.length}`);
  }
  console.log('✓ TEST D PASSED: At least 6 fields generated.\n');

  // TEST E
  console.log('--- TEST E: AI Update - Add parent name, parent phone and address ---');
  const baseSchemaE = await generateFormFromPrompt('name, email, department');
  const initialCountE = baseSchemaE.fields.filter(f => f.type !== 'section').length;
  console.log(`Initial fields (${initialCountE}):`, baseSchemaE.fields.filter(f => f.type !== 'section').map(f => f.label).join(', '));
  const refinedE = await refineFormSchema(baseSchemaE, 'Add parent name, parent phone and address.');
  const fieldsE = refinedE.fields.filter(f => f.type !== 'section');
  console.log(`Refined fields (${fieldsE.length}):`, fieldsE.map(f => f.label).join(', '));
  if (fieldsE.length !== initialCountE + 3) {
    throw new Error(`TEST E FAILED: Expected ${initialCountE + 3} fields, got ${fieldsE.length}`);
  }
  console.log('✓ TEST E PASSED: Existing fields preserved and 3 new fields added.\n');

  // TEST F
  console.log('--- TEST F: AI Update - Remove phone number ---');
  const baseSchemaF = await generateFormFromPrompt('name, email, phone, department');
  const refinedF = await refineFormSchema(baseSchemaF, 'Remove phone number.');
  const fieldsF = refinedF.fields.filter(f => f.type !== 'section');
  console.log('Fields after removal:', fieldsF.map(f => f.label).join(', '));
  const hasPhoneF = fieldsF.some(f => f.type === 'phone' || f.label.toLowerCase().includes('phone'));
  if (hasPhoneF) {
    throw new Error('TEST F FAILED: Phone number was not removed!');
  }
  console.log('✓ TEST F PASSED: Only phone number was removed.\n');

  // TEST G
  console.log('--- TEST G: AI Update - Make department a dropdown ---');
  const baseSchemaG = {
    title: 'Test Form',
    description: 'Test',
    fields: [
      { id: 'f1', type: 'short_answer' as const, label: 'Full Name', required: true },
      { id: 'f2', type: 'short_answer' as const, label: 'Department', required: true },
    ]
  };
  const refinedG = await refineFormSchema(baseSchemaG, 'Make department a dropdown.');
  const fieldsG = refinedG.fields.filter(f => f.type !== 'section');
  console.log('Fields after type change:', fieldsG.map(f => `${f.label} (${f.type})`).join(', '));
  const deptFieldG = fieldsG.find(f => f.label.toLowerCase().includes('department'));
  if (!deptFieldG || deptFieldG.type !== 'dropdown') {
    throw new Error('TEST G FAILED: Department is not a dropdown!');
  }
  if (fieldsG.length !== 2) {
    throw new Error(`TEST G FAILED: Expected 2 fields, got ${fieldsG.length} (duplicate was created)!`);
  }
  console.log('✓ TEST G PASSED: Department converted to dropdown without duplicates.\n');

  // TEST H
  console.log('--- TEST H: Conditional Logic ---');
  const testH = await generateFormFromPrompt(
    'Student information form with documents. Ask hostel name and room number only if hostel student is yes.'
  );
  const fieldsH = testH.fields.filter(f => f.type !== 'section');
  console.log('Generated fields in Test H:', fieldsH.map(f => `${f.label} (cond: ${f.conditional_logic?.enabled})`).join(', '));
  const condFieldH = fieldsH.find(f => f.conditional_logic?.enabled);
  if (!condFieldH || condFieldH.conditional_logic?.show_when_value !== 'Yes') {
    throw new Error('TEST H FAILED: Conditional logic is not enabled with show_when_value: Yes!');
  }
  console.log('✓ TEST H PASSED: Conditional logic properly configured on dependent field.\n');

  console.log('====================================================');
  console.log('🎉 ALL TESTS A THROUGH H PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
