-- ==============================================================================
-- InfoDesk: Production Multi-Tenant Schema with Row Level Security (RLS)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'staff')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- 4. Forms
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  version INT NOT NULL DEFAULT 1,
  schema JSONB NOT NULL DEFAULT '{"fields": [], "settings": {}}'::jsonb,
  response_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Form Versions (Immutable history for submitted forms)
CREATE TABLE IF NOT EXISTS public.form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  version INT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_id, version)
);

-- 6. Form Responses
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  form_version INT NOT NULL DEFAULT 1,
  response_id TEXT UNIQUE NOT NULL,
  respondent_email TEXT,
  respondent_name TEXT,
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'pending_review', 'approved', 'incomplete', 'rejected')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Response Files
CREATE TABLE IF NOT EXISTS public.response_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.form_responses(id) ON DELETE CASCADE NOT NULL,
  field_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users read and write only their own profile
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Profiles are editable by owner" ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Profiles are insertable by owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Forms: users can CRUD their own forms
CREATE POLICY "Users can view own forms" ON public.forms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public forms viewable by slug" ON public.forms
  FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create own forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forms" ON public.forms
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forms" ON public.forms
  FOR DELETE USING (auth.uid() = user_id);

-- Form Responses:
-- Anyone can insert a response to a published form
CREATE POLICY "Public can submit responses to published forms" ON public.form_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.status = 'published'
    )
  );

-- Form owners can view responses to their forms
CREATE POLICY "Form owners can view their form responses" ON public.form_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Form owners can update/delete responses to their forms
CREATE POLICY "Form owners can update their form responses" ON public.form_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Email Templates & Logs: scoped to user
CREATE POLICY "Users can manage own email templates" ON public.email_templates
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own email logs" ON public.email_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_response_id ON public.form_responses(response_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
