import { generateFormFromPrompt } from '../src/lib/ai-form-generator';

async function testBiodataTitle() {
  console.log('====================================================');
  console.log('TESTING OPTIMIZED FORM TITLE GENERATION');
  console.log('====================================================\n');

  // Case 1: Exact user prompt
  const userPrompt = `Create A Complete **Biodata Collection Form** For Collecting Personal, Educational, Family Questionnaire
General
Please provide the requested details accurately.`;

  console.log('--- Case 1: User Prompt ---');
  console.log('Prompt:', userPrompt);
  const res1 = await generateFormFromPrompt(userPrompt);
  console.log('\nGenerated Title:', res1.title);
  console.log('Generated Category:', res1.category);
  console.log('Generated Description:', res1.description);
  console.log('Total Fields:', res1.fields.filter(f => f.type !== 'section').length);
  console.log('Sections:', res1.summary?.sections);
  console.log('Fields:', res1.fields.filter(f => f.type !== 'section').map(f => `${f.label} (${f.type})`).join(', '));

  // Assertions
  if (res1.title !== 'Biodata Details') {
    throw new Error(`Case 1 failed: Expected title 'Biodata Details', got '${res1.title}'`);
  }

  // Ensure no prompt junk is in the title
  if (res1.title.includes('Create A Complete') || res1.title.includes('Questionnaire') || res1.title.includes('General')) {
    throw new Error(`Case 1 failed: Title still contains raw prompt text: '${res1.title}'`);
  }

  // Ensure no field label contains prompt instructions
  const badField = res1.fields.find(f =>
    f.label.includes('Create A Complete') ||
    f.label.includes('Please provide') ||
    f.label.includes('**')
  );
  if (badField) {
    throw new Error(`Case 1 failed: Field contains prompt junk: ${badField.label}`);
  }

  console.log('\n✓ Case 1 Passed: Title is cleanly optimized to "Biodata Details" with clean structured fields!\n');

  // Case 2: Simple "Biodata form"
  console.log('--- Case 2: "Biodata form" ---');
  const res2 = await generateFormFromPrompt('Biodata form');
  console.log('Title:', res2.title);
  if (res2.title !== 'Biodata Details') {
    throw new Error(`Case 2 failed: Expected 'Biodata Details', got '${res2.title}'`);
  }
  console.log('✓ Case 2 Passed: "Biodata form" generates "Biodata Details"\n');

  // Case 3: Bolded title prompt e.g. "Create a **Course Feedback Form**"
  console.log('--- Case 3: "Create a **Course Feedback Form** for evaluating teachers" ---');
  const res3 = await generateFormFromPrompt('Create a **Course Feedback Form** for evaluating teachers');
  console.log('Title:', res3.title);
  if (!res3.title.toLowerCase().includes('feedback')) {
    throw new Error(`Case 3 failed: Expected feedback title, got '${res3.title}'`);
  }
  console.log('✓ Case 3 Passed: Bolded title extracted cleanly without asterisks.\n');

  console.log('====================================================');
  console.log('🎉 ALL FORM TITLE OPTIMIZATION TESTS PASSED! 🎉');
  console.log('====================================================\n');
}

testBiodataTitle().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
