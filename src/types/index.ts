import type { ReactNode } from 'react';

// ─── Core entity types ────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: OrganizationSettings;
  created_at: string;
}

export interface OrganizationSettings {
  primary_color?: string;
  email_from?: string;
  timezone?: string;
  allow_public_forms: boolean;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export type FormStatus = 'draft' | 'published' | 'closed' | 'archived';

export type FieldType =
  | 'short_answer'
  | 'long_answer'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multiple_choice'
  | 'checkboxes'
  | 'yes_no'
  | 'file_upload'
  | 'image_upload'
  | 'section'
  | 'signature';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface ConditionalLogic {
  enabled: boolean;
  // Show this field only when:
  dependsOn?: string; // field id
  depends_on_field_id?: string;
  condition?: 'equals' | 'not_equals' | 'contains';
  operator?: 'equals' | 'not_equals' | 'contains' | 'is_not_empty';
  value?: string;
  show_when_value?: string;
  action?: 'show' | 'hide';
}

export interface FormField {
  id: string;
  form_id?: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order?: number;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    allowedTypes?: string[];
    maxSizeMB?: number;
  };
  logic?: ConditionalLogic;
  conditional_logic?: ConditionalLogic;
  // Section-specific
  section_title?: string;
  section_description?: string;
}

export interface FormSettings {
  deadline?: string;
  allow_multiple_submissions?: boolean;
  allow_multiple?: boolean;
  allow_edit_after_submission?: boolean;
  confirmation_message?: string;
  require_email?: boolean;
  require_login?: boolean;
  send_email_receipt?: boolean;
  collect_documents?: boolean;
  max_file_size_mb?: number;
  allowed_file_types?: string[];
  show_progress_bar?: boolean;
  logo_url?: string;
  // Smart Forms & Settings
  conditional_logic_enabled?: boolean;
  duplicate_detection_enabled?: boolean;
  duplicate_identifiers?: string[];
  profile_autofill_enabled?: boolean;
  ai_summary_enabled?: boolean;
}

export interface Form {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  category?: string;
  version?: number;
  slug: string;
  status: FormStatus;
  fields: FormField[];
  settings: FormSettings;
  created_by: string;
  created_at: string;
  updated_at: string;
  response_count: number;
}

// ─── Responses ────────────────────────────────────────────────────────────────

export type ResponseStatus =
  | 'complete'
  | 'incomplete'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface ResponseAnswer {
  id: string;
  response_id: string;
  field_id: string;
  field_label: string;
  value: string | string[] | boolean | null;
}

export interface UploadedFile {
  id: string;
  response_id: string;
  field_id: string;
  field_label: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
}

export interface InternalNote {
  id: string;
  response_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  form_title: string;
  response_id: string; // INF-2026-XXXXX
  status: ResponseStatus;
  submitted_at: string;
  answers: ResponseAnswer[];
  files: UploadedFile[];
  notes: InternalNote[];
  // Convenience fields for table display
  participant_name?: string;
  participant_email?: string;
  participant_phone?: string;
  respondent_name?: string;
  respondent_email?: string;
  department?: string;
  year?: string;
  // Duplicate detection fields
  is_duplicate?: boolean;
  duplicate_status?: 'flagged' | 'confirmed_duplicate' | 'resolved_legitimate';
  duplicate_of_response_id?: string;
  duplicate_match_field?: string;
  duplicate_matched_value?: string;
  duplicate_original_name?: string;
  duplicate_original_submitted_at?: string;
  completion_status?: 'complete' | 'incomplete';
}

// ─── Email ────────────────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  organization_id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
  created_at: string;
}

export type EmailStatus = 'sent' | 'pending' | 'failed';

export interface EmailLog {
  id: string;
  organization_id: string;
  template_id?: string;
  template_name?: string;
  form_id?: string;
  form_title?: string;
  recipients: string[];
  recipient_count: number;
  subject: string;
  body: string;
  status: EmailStatus;
  sent_at: string;
  error?: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface FormAnalytics {
  form_id: string;
  form_title: string;
  total_responses: number;
  complete_responses: number;
  incomplete_responses: number;
  completion_rate: number;
  document_upload_rate: number;
  responses_over_time: { date: string; count: number }[];
  department_distribution: { department: string; count: number }[];
  status_distribution: { status: string; count: number }[];
}

// ─── Team ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  joined_at: string;
  last_active?: string;
  status: 'active' | 'invited' | 'inactive';
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: 'form' | 'response' | 'file' | 'email' | 'user';
  entity_id: string;
  entity_name: string;
  created_at: string;
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  timezone?: string;
  provider: 'google' | 'email' | 'demo';
  organization_id?: string;
  organization_name?: string;
}

export interface UserProfile {
  id?: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  timezone: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  college_name?: string;
  student_id?: string;
  course?: string;
  department?: string;
  other_info?: string;
  created_at?: string;
  updated_at?: string;
}

