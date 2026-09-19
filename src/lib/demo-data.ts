import type {
  Form,
  FormResponse,
  ResponseStatus,
  EmailTemplate,
  EmailLog,
  TeamMember,
  ActivityLog,
  Organization,
} from '@/types';

// ─── Organization ─────────────────────────────────────────────────────────────

export const DEMO_ORGANIZATION: Organization = {
  id: 'org-demo-001',
  name: 'Sri Sairam Demo Institution',
  logo_url: undefined,
  plan: 'pro',
  settings: {
    primary_color: '#3730a3',
    timezone: 'Asia/Kolkata',
    allow_public_forms: true,
  },
  created_at: '2026-01-15T10:00:00Z',
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const DEMO_FORMS: Form[] = [
  {
    id: 'form-001',
    organization_id: 'org-demo-001',
    title: 'Student Information Collection',
    description: 'Please fill in your complete student details for academic records.',
    slug: 'student-information-2026',
    status: 'published',
    fields: [
      // Section 1: Personal
      { id: 'f1-s1', form_id: 'form-001', type: 'section', label: '', section_title: 'Personal Information', section_description: 'Please provide your personal details.', required: false, order: 0 },
      { id: 'f1-01', form_id: 'form-001', type: 'short_answer', label: 'Full Name', placeholder: 'Enter your full name', required: true, order: 1 },
      { id: 'f1-02', form_id: 'form-001', type: 'short_answer', label: 'Register Number', placeholder: 'e.g. 7376221CS001', required: true, order: 2 },
      { id: 'f1-03', form_id: 'form-001', type: 'email', label: 'Email Address', placeholder: 'student@college.edu', required: true, order: 3 },
      { id: 'f1-04', form_id: 'form-001', type: 'phone', label: 'Phone Number', placeholder: '+91 9876543210', required: true, order: 4 },
      { id: 'f1-05', form_id: 'form-001', type: 'date', label: 'Date of Birth', required: true, order: 5 },
      { id: 'f1-06', form_id: 'form-001', type: 'dropdown', label: 'Gender', required: true, order: 6, options: [{ id: 'o1', label: 'Male', value: 'male' }, { id: 'o2', label: 'Female', value: 'female' }, { id: 'o3', label: 'Other', value: 'other' }] },
      // Section 2: Academic
      { id: 'f1-s2', form_id: 'form-001', type: 'section', label: '', section_title: 'Academic Information', section_description: 'Your current academic details.', required: false, order: 7 },
      { id: 'f1-07', form_id: 'form-001', type: 'dropdown', label: 'Department', required: true, order: 8, options: [{ id: 'od1', label: 'Computer Science', value: 'CS' }, { id: 'od2', label: 'Mechanical Engineering', value: 'ME' }, { id: 'od3', label: 'Electronics & Communication', value: 'ECE' }, { id: 'od4', label: 'Civil Engineering', value: 'CE' }, { id: 'od5', label: 'Information Technology', value: 'IT' }] },
      { id: 'f1-08', form_id: 'form-001', type: 'dropdown', label: 'Year of Study', required: true, order: 9, options: [{ id: 'oy1', label: '1st Year', value: '1' }, { id: 'oy2', label: '2nd Year', value: '2' }, { id: 'oy3', label: '3rd Year', value: '3' }, { id: 'oy4', label: '4th Year', value: '4' }] },
      { id: 'f1-09', form_id: 'form-001', type: 'short_answer', label: 'Section', placeholder: 'e.g. A', required: true, order: 10 },
      { id: 'f1-10', form_id: 'form-001', type: 'number', label: 'CGPA', placeholder: 'e.g. 8.5', required: false, order: 11, validation: { min: 0, max: 10 } },
      // Section 3: Address
      { id: 'f1-s3', form_id: 'form-001', type: 'section', label: '', section_title: 'Address', section_description: 'Your current residential address.', required: false, order: 12 },
      { id: 'f1-11', form_id: 'form-001', type: 'long_answer', label: 'Address', placeholder: 'Door No, Street, Area', required: true, order: 13 },
      { id: 'f1-12', form_id: 'form-001', type: 'short_answer', label: 'City', required: true, order: 14 },
      { id: 'f1-13', form_id: 'form-001', type: 'short_answer', label: 'State', required: true, order: 15 },
      { id: 'f1-14', form_id: 'form-001', type: 'short_answer', label: 'Pincode', required: true, order: 16, validation: { pattern: '^[0-9]{6}$' } },
      // Section 4: Documents
      { id: 'f1-s4', form_id: 'form-001', type: 'section', label: '', section_title: 'Documents', section_description: 'Upload the required documents.', required: false, order: 17 },
      { id: 'f1-15', form_id: 'form-001', type: 'image_upload', label: 'Student Photo', description: 'Upload a recent passport-size photo (JPG/PNG, max 2MB)', required: true, order: 18, validation: { allowedTypes: ['image/jpeg', 'image/png'], maxSizeMB: 2 } },
      { id: 'f1-16', form_id: 'form-001', type: 'file_upload', label: 'College ID Copy', description: 'Upload front and back of your college ID', required: true, order: 19, validation: { allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMB: 5 } },
      { id: 'f1-17', form_id: 'form-001', type: 'file_upload', label: 'Supporting Certificate', description: 'Any additional certificate if applicable', required: false, order: 20 },
      // Section 5: Declaration
      { id: 'f1-s5', form_id: 'form-001', type: 'section', label: '', section_title: 'Declaration', required: false, order: 21 },
      { id: 'f1-18', form_id: 'form-001', type: 'checkboxes', label: 'I hereby declare that all the information provided above is true and accurate to the best of my knowledge.', required: true, order: 22, options: [{ id: 'dec1', label: 'I agree to the above declaration', value: 'agreed' }] },
    ],
    settings: {
      allow_multiple_submissions: false,
      allow_edit_after_submission: false,
      confirmation_message: 'Thank you! Your information has been submitted successfully.',
      require_email: true,
      max_file_size_mb: 10,
      allowed_file_types: ['image/jpeg', 'image/png', 'application/pdf'],
      show_progress_bar: true,
    },
    created_by: 'user-demo-001',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-10T14:30:00Z',
    response_count: 482,
  },
  {
    id: 'form-002',
    organization_id: 'org-demo-001',
    title: 'Workshop Registration',
    description: 'Register for the upcoming technical workshop. Limited seats available.',
    slug: 'workshop-registration-2026',
    status: 'published',
    fields: [
      { id: 'f2-s1', form_id: 'form-002', type: 'section', label: '', section_title: 'Participant Details', required: false, order: 0 },
      { id: 'f2-01', form_id: 'form-002', type: 'short_answer', label: 'Full Name', required: true, order: 1 },
      { id: 'f2-02', form_id: 'form-002', type: 'email', label: 'Email', required: true, order: 2 },
      { id: 'f2-03', form_id: 'form-002', type: 'phone', label: 'Phone Number', required: true, order: 3 },
      { id: 'f2-04', form_id: 'form-002', type: 'dropdown', label: 'Department', required: true, order: 4, options: [{ id: 'od1', label: 'Computer Science', value: 'CS' }, { id: 'od2', label: 'Mechanical Engineering', value: 'ME' }, { id: 'od3', label: 'Electronics & Communication', value: 'ECE' }, { id: 'od4', label: 'Civil Engineering', value: 'CE' }, { id: 'od5', label: 'Information Technology', value: 'IT' }] },
      { id: 'f2-05', form_id: 'form-002', type: 'dropdown', label: 'Year of Study', required: true, order: 5, options: [{ id: 'y1', label: '1st Year', value: '1' }, { id: 'y2', label: '2nd Year', value: '2' }, { id: 'y3', label: '3rd Year', value: '3' }, { id: 'y4', label: '4th Year', value: '4' }] },
      { id: 'f2-s2', form_id: 'form-002', type: 'section', label: '', section_title: 'Workshop Preference', required: false, order: 6 },
      { id: 'f2-06', form_id: 'form-002', type: 'multiple_choice', label: 'Which workshop track are you interested in?', required: true, order: 7, options: [{ id: 'tr1', label: 'Web Development', value: 'web' }, { id: 'tr2', label: 'Data Science & AI', value: 'ai' }, { id: 'tr3', label: 'Cloud Computing', value: 'cloud' }, { id: 'tr4', label: 'Cybersecurity', value: 'security' }] },
      { id: 'f2-07', form_id: 'form-002', type: 'long_answer', label: 'Why do you want to attend this workshop?', required: false, order: 8 },
      { id: 'f2-08', form_id: 'form-002', type: 'yes_no', label: 'Have you attended any of our previous workshops?', required: false, order: 9 },
    ],
    settings: {
      allow_multiple_submissions: false,
      allow_edit_after_submission: false,
      confirmation_message: 'You have successfully registered! We will send you the details via email.',
      require_email: true,
      max_file_size_mb: 5,
      allowed_file_types: ['image/jpeg', 'image/png', 'application/pdf'],
      show_progress_bar: true,
      deadline: '2026-10-15T23:59:59Z',
    },
    created_by: 'user-demo-001',
    created_at: '2026-08-15T09:00:00Z',
    updated_at: '2026-09-01T11:00:00Z',
    response_count: 127,
  },
  {
    id: 'form-003',
    organization_id: 'org-demo-001',
    title: 'Scholarship Application',
    description: 'Apply for the annual merit-cum-means scholarship for the academic year 2026-27.',
    slug: 'scholarship-application-2026',
    status: 'closed',
    fields: [
      { id: 'f3-s1', form_id: 'form-003', type: 'section', label: '', section_title: 'Personal Details', required: false, order: 0 },
      { id: 'f3-01', form_id: 'form-003', type: 'short_answer', label: 'Full Name', required: true, order: 1 },
      { id: 'f3-02', form_id: 'form-003', type: 'short_answer', label: 'Register Number', required: true, order: 2 },
      { id: 'f3-03', form_id: 'form-003', type: 'email', label: 'Email', required: true, order: 3 },
      { id: 'f3-04', form_id: 'form-003', type: 'dropdown', label: 'Department', required: true, order: 4, options: [{ id: 'od1', label: 'Computer Science', value: 'CS' }, { id: 'od2', label: 'Mechanical', value: 'ME' }, { id: 'od3', label: 'ECE', value: 'ECE' }] },
      { id: 'f3-05', form_id: 'form-003', type: 'number', label: 'Annual Family Income (₹)', required: true, order: 5 },
      { id: 'f3-06', form_id: 'form-003', type: 'number', label: 'CGPA', required: true, order: 6, validation: { min: 0, max: 10 } },
      { id: 'f3-07', form_id: 'form-003', type: 'file_upload', label: 'Income Certificate', required: true, order: 7 },
      { id: 'f3-08', form_id: 'form-003', type: 'file_upload', label: 'Previous Semester Marksheet', required: true, order: 8 },
    ],
    settings: {
      allow_multiple_submissions: false,
      allow_edit_after_submission: false,
      confirmation_message: 'Your scholarship application has been submitted. The results will be announced within 30 days.',
      require_email: true,
      max_file_size_mb: 10,
      allowed_file_types: ['image/jpeg', 'image/png', 'application/pdf'],
      show_progress_bar: true,
    },
    created_by: 'user-demo-001',
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-07-31T23:59:00Z',
    response_count: 312,
  },
  {
    id: 'form-004',
    organization_id: 'org-demo-001',
    title: 'Internship Registration',
    description: 'Register your internship details for the summer 2026 batch.',
    slug: 'internship-registration-2026',
    status: 'draft',
    fields: [
      { id: 'f4-01', form_id: 'form-004', type: 'short_answer', label: 'Full Name', required: true, order: 0 },
      { id: 'f4-02', form_id: 'form-004', type: 'email', label: 'Email', required: true, order: 1 },
      { id: 'f4-03', form_id: 'form-004', type: 'short_answer', label: 'Company Name', required: true, order: 2 },
      { id: 'f4-04', form_id: 'form-004', type: 'short_answer', label: 'Internship Role', required: true, order: 3 },
      { id: 'f4-05', form_id: 'form-004', type: 'date', label: 'Start Date', required: true, order: 4 },
      { id: 'f4-06', form_id: 'form-004', type: 'date', label: 'End Date', required: true, order: 5 },
      { id: 'f4-07', form_id: 'form-004', type: 'yes_no', label: 'Is this a paid internship?', required: true, order: 6 },
      { id: 'f4-08', form_id: 'form-004', type: 'file_upload', label: 'Offer Letter', required: true, order: 7 },
    ],
    settings: {
      allow_multiple_submissions: false,
      allow_edit_after_submission: true,
      confirmation_message: 'Your internship has been registered successfully.',
      require_email: true,
      max_file_size_mb: 5,
      allowed_file_types: ['application/pdf', 'image/jpeg', 'image/png'],
      show_progress_bar: false,
    },
    created_by: 'user-demo-001',
    created_at: '2026-09-10T08:00:00Z',
    updated_at: '2026-09-18T16:00:00Z',
    response_count: 0,
  },
];

// ─── Responses ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ['CS', 'ME', 'ECE', 'CE', 'IT'];
const YEARS = ['1', '2', '3', '4'];
const STATUSES: ResponseStatus[] = ['complete', 'complete', 'complete', 'pending_review', 'approved', 'incomplete'];

const FIRST_NAMES = ['Arjun', 'Priya', 'Kiran', 'Sneha', 'Rahul', 'Deepika', 'Vikram', 'Anjali', 'Suresh', 'Kavya', 'Arun', 'Meera', 'Rajesh', 'Lakshmi', 'Sathish', 'Pooja', 'Ganesh', 'Nithya', 'Kumar', 'Divya', 'Manoj', 'Geetha', 'Ravi', 'Sowmya', 'Prasad'];
const LAST_NAMES = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Menon', 'Pillai', 'Iyer', 'Rao', 'Krishnan', 'Subramaniam', 'Venkatesh', 'Rajendran', 'Murugan'];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateResponseId(index: number): string {
  return `INF-2026-${String(index + 100).padStart(5, '0')}`;
}

function generateDate(daysAgo: number): string {
  const d = new Date('2026-09-19T10:00:00Z');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function generateSampleResponses(formId: string, count: number): FormResponse[] {
  const responses: FormResponse[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = getRandom(FIRST_NAMES);
    const lastName = getRandom(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const dept = getRandom(DEPARTMENTS);
    const year = getRandom(YEARS);
    const status: ResponseStatus = getRandom(STATUSES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@college.edu`;
    const regNo = `7376${String(Math.floor(2000 + Math.random() * 999)).padStart(4, '0')}${dept}${String(i + 1).padStart(3, '0')}`;

    responses.push({
      id: `resp-${formId}-${i}`,
      form_id: formId,
      form_title: DEMO_FORMS.find(f => f.id === formId)?.title ?? 'Form',
      response_id: generateResponseId(i + (formId === 'form-001' ? 0 : 100)),
      status,
      submitted_at: generateDate(Math.floor(Math.random() * 60)),
      participant_name: name,
      participant_email: email,
      participant_phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
      department: dept,
      year,
      answers: [
        { id: `ans-${i}-01`, response_id: `resp-${formId}-${i}`, field_id: 'f1-01', field_label: 'Full Name', value: name },
        { id: `ans-${i}-02`, response_id: `resp-${formId}-${i}`, field_id: 'f1-02', field_label: 'Register Number', value: regNo },
        { id: `ans-${i}-03`, response_id: `resp-${formId}-${i}`, field_id: 'f1-03', field_label: 'Email Address', value: email },
        { id: `ans-${i}-04`, response_id: `resp-${formId}-${i}`, field_id: 'f1-04', field_label: 'Phone Number', value: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}` },
        { id: `ans-${i}-05`, response_id: `resp-${formId}-${i}`, field_id: 'f1-07', field_label: 'Department', value: dept },
        { id: `ans-${i}-06`, response_id: `resp-${formId}-${i}`, field_id: 'f1-08', field_label: 'Year of Study', value: year },
        { id: `ans-${i}-07`, response_id: `resp-${formId}-${i}`, field_id: 'f1-09', field_label: 'Section', value: getRandom(['A', 'B', 'C']) },
        { id: `ans-${i}-08`, response_id: `resp-${formId}-${i}`, field_id: 'f1-10', field_label: 'CGPA', value: (6.5 + Math.random() * 3.5).toFixed(2) },
        { id: `ans-${i}-09`, response_id: `resp-${formId}-${i}`, field_id: 'f1-11', field_label: 'Address', value: `${Math.floor(10 + Math.random() * 990)}, Main Street, Chennai` },
        { id: `ans-${i}-10`, response_id: `resp-${formId}-${i}`, field_id: 'f1-12', field_label: 'City', value: getRandom(['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy']) },
        { id: `ans-${i}-11`, response_id: `resp-${formId}-${i}`, field_id: 'f1-13', field_label: 'State', value: 'Tamil Nadu' },
        { id: `ans-${i}-12`, response_id: `resp-${formId}-${i}`, field_id: 'f1-14', field_label: 'Pincode', value: String(600000 + Math.floor(Math.random() * 100)) },
      ],
      files: status !== 'incomplete' ? [
        { id: `file-${i}-01`, response_id: `resp-${formId}-${i}`, field_id: 'f1-15', field_label: 'Student Photo', name: 'photo.jpg', size: 245760, type: 'image/jpeg', url: '', status: 'verified', uploaded_at: generateDate(Math.floor(Math.random() * 60)) },
        { id: `file-${i}-02`, response_id: `resp-${formId}-${i}`, field_id: 'f1-16', field_label: 'College ID Copy', name: 'college_id.pdf', size: 512000, type: 'application/pdf', url: '', status: Math.random() > 0.3 ? 'verified' : 'pending', uploaded_at: generateDate(Math.floor(Math.random() * 60)) },
      ] : [],
      notes: [],
    });
  }
  return responses;
}

export const DEMO_RESPONSES = {
  'form-001': generateSampleResponses('form-001', 30),
  'form-002': generateSampleResponses('form-002', 20),
  'form-003': generateSampleResponses('form-003', 25),
  'form-004': [] as FormResponse[],
};

// ─── Email Templates ──────────────────────────────────────────────────────────

export const DEMO_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'et-001',
    organization_id: 'org-demo-001',
    name: 'Application Received',
    subject: 'Application Received – {{form_name}}',
    body: `Dear {{name}},

Your submission for {{form_name}} has been received successfully.

Your Response ID is: **{{response_id}}**

Please keep this ID for future reference. If you have any questions, feel free to contact us.

Thank you,
Sri Sairam Demo Institution`,
    variables: ['name', 'form_name', 'response_id'],
    category: 'confirmation',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'et-002',
    organization_id: 'org-demo-001',
    name: 'Document Reminder',
    subject: 'Action Required – Upload Missing Documents',
    body: `Dear {{name}},

We noticed that some documents are still pending for your submission (Response ID: {{response_id}}).

Please log in and upload the required documents before **{{deadline}}** to complete your application.

Thank you,
Sri Sairam Demo Institution`,
    variables: ['name', 'response_id', 'deadline'],
    category: 'reminder',
    created_at: '2026-02-05T10:00:00Z',
  },
  {
    id: 'et-003',
    organization_id: 'org-demo-001',
    name: 'Application Approved',
    subject: 'Congratulations! Your Application Has Been Approved',
    body: `Dear {{name}},

We are pleased to inform you that your application for {{form_name}} has been **approved**.

Response ID: {{response_id}}

Further instructions will be communicated to you shortly.

Best regards,
Sri Sairam Demo Institution`,
    variables: ['name', 'form_name', 'response_id'],
    category: 'status',
    created_at: '2026-03-01T10:00:00Z',
  },
];

// ─── Email Logs ───────────────────────────────────────────────────────────────

export const DEMO_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'el-001',
    organization_id: 'org-demo-001',
    template_id: 'et-001',
    template_name: 'Application Received',
    form_id: 'form-001',
    form_title: 'Student Information Collection',
    recipients: ['batch-482@students.edu'],
    recipient_count: 482,
    subject: 'Application Received – Student Information Collection',
    body: '',
    status: 'sent',
    sent_at: '2026-09-10T14:00:00Z',
  },
  {
    id: 'el-002',
    organization_id: 'org-demo-001',
    template_id: 'et-002',
    template_name: 'Document Reminder',
    form_id: 'form-001',
    form_title: 'Student Information Collection',
    recipients: ['pending@students.edu'],
    recipient_count: 47,
    subject: 'Action Required – Upload Missing Documents',
    body: '',
    status: 'sent',
    sent_at: '2026-09-15T10:30:00Z',
  },
];

// ─── Team ─────────────────────────────────────────────────────────────────────

export const DEMO_TEAM: TeamMember[] = [
  {
    id: 'tm-001',
    user_id: 'user-demo-001',
    organization_id: 'org-demo-001',
    full_name: 'Dr. R. Krishnamurthy',
    email: 'krishnamurthy@sairam.edu.in',
    role: 'super_admin',
    joined_at: '2026-01-15T10:00:00Z',
    last_active: '2026-09-19T08:00:00Z',
    status: 'active',
  },
  {
    id: 'tm-002',
    user_id: 'user-demo-002',
    organization_id: 'org-demo-001',
    full_name: 'Ms. Priya Nair',
    email: 'priya.nair@sairam.edu.in',
    role: 'admin',
    joined_at: '2026-02-01T10:00:00Z',
    last_active: '2026-09-18T17:00:00Z',
    status: 'active',
  },
  {
    id: 'tm-003',
    user_id: 'user-demo-003',
    organization_id: 'org-demo-001',
    full_name: 'Mr. Sathish Kumar',
    email: 'sathish.k@sairam.edu.in',
    role: 'staff',
    joined_at: '2026-03-15T10:00:00Z',
    last_active: '2026-09-17T12:00:00Z',
    status: 'active',
  },
  {
    id: 'tm-004',
    user_id: 'user-demo-004',
    organization_id: 'org-demo-001',
    full_name: 'Ms. Kavya Lakshmi',
    email: 'kavya.l@sairam.edu.in',
    role: 'staff',
    joined_at: '2026-04-01T10:00:00Z',
    last_active: '2026-09-16T09:00:00Z',
    status: 'active',
  },
  {
    id: 'tm-005',
    user_id: 'user-demo-005',
    organization_id: 'org-demo-001',
    full_name: 'Mr. Ganesh Raj',
    email: 'ganesh.raj@sairam.edu.in',
    role: 'staff',
    joined_at: '2026-05-01T10:00:00Z',
    status: 'invited',
  },
];

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const DEMO_ACTIVITY: ActivityLog[] = [
  { id: 'al-001', organization_id: 'org-demo-001', user_id: 'user-demo-001', user_name: 'Dr. R. Krishnamurthy', action: '12 new responses received', entity_type: 'response', entity_id: 'form-001', entity_name: 'Student Information Collection', created_at: generateDate(0) },
  { id: 'al-002', organization_id: 'org-demo-001', user_id: 'user-demo-001', user_name: 'Dr. R. Krishnamurthy', action: 'Scholarship Application updated', entity_type: 'form', entity_id: 'form-003', entity_name: 'Scholarship Application', created_at: generateDate(1) },
  { id: 'al-003', organization_id: 'org-demo-001', user_id: 'user-demo-002', user_name: 'Ms. Priya Nair', action: 'Workshop Registration published', entity_type: 'form', entity_id: 'form-002', entity_name: 'Workshop Registration', created_at: generateDate(2) },
  { id: 'al-004', organization_id: 'org-demo-001', user_id: 'user-demo-003', user_name: 'Mr. Sathish Kumar', action: '3 documents uploaded', entity_type: 'file', entity_id: 'form-001', entity_name: 'Student Information Collection', created_at: generateDate(3) },
  { id: 'al-005', organization_id: 'org-demo-001', user_id: 'user-demo-002', user_name: 'Ms. Priya Nair', action: 'Reminder email sent to 47 students', entity_type: 'email', entity_id: 'el-002', entity_name: 'Document Reminder', created_at: generateDate(4) },
];
