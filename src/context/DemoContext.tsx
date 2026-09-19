import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Form, FormResponse, EmailTemplate, EmailLog, TeamMember, InternalNote } from '@/types';
import { useAuth } from './AuthContext';
import { generateId, generateResponseId, generateSlug } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkSubmissionForDuplicate } from '@/lib/duplicate-detector';

interface WorkspaceStore {
  forms: Form[];
  responses: Record<string, FormResponse[]>;
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLog[];
  team: TeamMember[];
  // Form actions
  createForm: (form: Omit<Form, 'id' | 'created_at' | 'updated_at' | 'response_count'>) => Form;
  updateForm: (id: string, updates: Partial<Form>) => void;
  deleteForm: (id: string) => void;
  duplicateForm: (id: string, newTitle?: string) => Form;
  // Response actions
  addResponse: (response: Omit<FormResponse, 'id' | 'response_id' | 'submitted_at'>) => FormResponse;
  updateResponseStatus: (formId: string, responseId: string, status: FormResponse['status']) => void;
  updateResponseDuplicateStatus: (formId: string, responseId: string, duplicateStatus: FormResponse['duplicate_status']) => void;
  addNote: (formId: string, responseId: string, note: Omit<InternalNote, 'id' | 'created_at'>) => void;
  // Email actions
  sendEmail: (log: Omit<EmailLog, 'id' | 'sent_at'>) => void;
  createEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'created_at'>) => EmailTemplate;
  // Team actions
  inviteMember: (member: Omit<TeamMember, 'id' | 'joined_at'>) => void;
  updateMemberRole: (memberId: string, role: TeamMember['role']) => void;
  removeMember: (memberId: string) => void;
}

const DemoContext = createContext<WorkspaceStore | null>(null);

const STORAGE_PREFIX = 'infodesk_user_workspace_';
const PUBLIC_FORMS_INDEX_KEY = 'infodesk_public_forms_registry';

function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}${userId}` : 'infodesk_anon_workspace';
}

function registerPublicForm(form: Form) {
  try {
    const raw = localStorage.getItem(PUBLIC_FORMS_INDEX_KEY);
    const registry: Record<string, Form> = raw ? JSON.parse(raw) : {};
    registry[form.id] = form;
    if (form.slug) registry[form.slug] = form;
    localStorage.setItem(PUBLIC_FORMS_INDEX_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Could not register public form:', e);
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<Record<string, FormResponse[]>>({});
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Load user's isolated workspace on user change
  useEffect(() => {
    if (!userId) {
      // For unauthenticated visitors viewing a public form, load public forms registry
      try {
        const raw = localStorage.getItem(PUBLIC_FORMS_INDEX_KEY);
        if (raw) {
          const registry: Record<string, Form> = JSON.parse(raw);
          const publicForms = Object.values(registry).filter((f, idx, arr) => arr.findIndex(x => x.id === f.id) === idx);
          setForms(publicForms);
        } else {
          setForms([]);
        }
      } catch {
        setForms([]);
      }
      setResponses({});
      setEmailTemplates([]);
      setEmailLogs([]);
      setTeam([]);
      return;
    }

    // Load authenticated user's isolated workspace
    try {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) {
        const data = JSON.parse(saved);
        setForms(data.forms ?? []);
        setResponses(data.responses ?? {});
        setEmailTemplates(data.emailTemplates ?? []);
        setEmailLogs(data.emailLogs ?? []);
        setTeam(data.team ?? []);
      } else {
        // Fresh new user workspace: COMPLETELY EMPTY
        setForms([]);
        setResponses({});
        setEmailTemplates([]);
        setEmailLogs([]);
        setTeam([]);
      }
    } catch (e) {
      console.warn('Error loading user workspace:', e);
      setForms([]);
      setResponses({});
    }
  }, [userId]);

  // Save changes to user's isolated workspace
  const persistWorkspace = useCallback((newForms: Form[], newResponses: Record<string, FormResponse[]>, newTemplates: EmailTemplate[], newLogs: EmailLog[], newTeam: TeamMember[]) => {
    if (!userId) return;
    try {
      localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify({
          forms: newForms,
          responses: newResponses,
          emailTemplates: newTemplates,
          emailLogs: newLogs,
          team: newTeam,
          updated_at: new Date().toISOString(),
        })
      );
      // Register all published forms in public registry so participants can access them
      newForms.forEach(f => registerPublicForm(f));
    } catch (e) {
      console.warn('Could not persist workspace locally:', e);
    }
  }, [userId]);

  const createForm = useCallback((formData: Omit<Form, 'id' | 'created_at' | 'updated_at' | 'response_count'>) => {
    const now = new Date().toISOString();
    const newForm: Form = {
      ...formData,
      id: `form-${generateId()}`,
      created_at: now,
      updated_at: now,
      response_count: 0,
    };

    setForms(prev => {
      const next = [newForm, ...prev];
      registerPublicForm(newForm);
      persistWorkspace(next, responses, emailTemplates, emailLogs, team);
      return next;
    });

    setResponses(prev => {
      const next = { ...prev, [newForm.id]: [] };
      persistWorkspace([newForm, ...forms], next, emailTemplates, emailLogs, team);
      return next;
    });

    return newForm;
  }, [forms, responses, emailTemplates, emailLogs, team, persistWorkspace]);

  const updateForm = useCallback((id: string, updates: Partial<Form>) => {
    setForms(prev => {
      const next = prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, ...updates, updated_at: new Date().toISOString() };
          registerPublicForm(updated);
          return updated;
        }
        return f;
      });
      persistWorkspace(next, responses, emailTemplates, emailLogs, team);
      return next;
    });
  }, [responses, emailTemplates, emailLogs, team, persistWorkspace]);

  const deleteForm = useCallback((id: string) => {
    setForms(prev => {
      const next = prev.filter(f => f.id !== id);
      persistWorkspace(next, responses, emailTemplates, emailLogs, team);
      return next;
    });
    setResponses(prev => {
      const next = { ...prev };
      delete next[id];
      persistWorkspace(forms.filter(f => f.id !== id), next, emailTemplates, emailLogs, team);
      return next;
    });
  }, [forms, responses, emailTemplates, emailLogs, team, persistWorkspace]);

  const duplicateForm = useCallback((id: string, newTitle?: string): Form => {
    const source = forms.find(f => f.id === id);
    if (!source) throw new Error('Form not found');

    const now = new Date().toISOString();
    const finalTitle = newTitle?.trim() || `${source.title} (Copy)`;
    const newForm: Form = {
      ...source,
      id: `form-${generateId()}`,
      title: finalTitle,
      slug: `${generateSlug(finalTitle)}-${generateId().slice(0, 4)}`,
      status: 'draft',
      created_at: now,
      updated_at: now,
      response_count: 0,
    };

    setForms(prev => {
      const next = [newForm, ...prev];
      persistWorkspace(next, responses, emailTemplates, emailLogs, team);
      return next;
    });
    setResponses(prev => {
      const next = { ...prev, [newForm.id]: [] };
      persistWorkspace([newForm, ...forms], next, emailTemplates, emailLogs, team);
      return next;
    });

    return newForm;
  }, [forms, responses, emailTemplates, emailLogs, team, persistWorkspace]);

  // Response actions (Handles both authenticated dashboard & public submissions)
  const addResponse = useCallback((respData: Omit<FormResponse, 'id' | 'response_id' | 'submitted_at'>) => {
    const now = new Date().toISOString();
    
    // Find target form definition
    const targetForm = forms.find(f => f.id === respData.form_id);

    // Merge existing responses across memory and local storage
    const existingContextResponses = responses[respData.form_id] ?? [];
    let cachedPub: FormResponse[] = [];
    try {
      const pubRespKey = `infodesk_form_responses_${respData.form_id}`;
      cachedPub = JSON.parse(localStorage.getItem(pubRespKey) || '[]');
    } catch {}

    const combinedExisting = [...existingContextResponses];
    for (const cp of cachedPub) {
      if (!combinedExisting.some(r => r.id === cp.id || r.response_id === cp.response_id)) {
        combinedExisting.push(cp);
      }
    }

    // Run duplicate detection check
    const dupCheck = checkSubmissionForDuplicate(targetForm, respData.answers || [], combinedExisting);

    const newResp: FormResponse = {
      ...respData,
      id: `resp-${generateId()}`,
      response_id: generateResponseId(),
      submitted_at: now,
      status: respData.status ?? 'complete',
      is_duplicate: dupCheck.isDuplicate,
      duplicate_status: dupCheck.isDuplicate ? 'flagged' : undefined,
      duplicate_of_response_id: dupCheck.originalResponseId,
      duplicate_match_field: dupCheck.matchField,
      duplicate_matched_value: dupCheck.matchedValue,
      duplicate_original_name: dupCheck.originalName,
      duplicate_original_submitted_at: dupCheck.originalSubmittedAt,
    };

    setResponses(prev => {
      const existing = prev[respData.form_id] ?? [];
      const next = {
        ...prev,
        [respData.form_id]: [newResp, ...existing],
      };
      persistWorkspace(forms, next, emailTemplates, emailLogs, team);
      return next;
    });

    setForms(prev => {
      const next = prev.map(f =>
        f.id === respData.form_id
          ? { ...f, response_count: (f.response_count || 0) + 1, updated_at: now }
          : f
      );
      persistWorkspace(next, responses, emailTemplates, emailLogs, team);
      return next;
    });

    // Also persist response under public form registry
    try {
      const pubRespKey = `infodesk_form_responses_${respData.form_id}`;
      const existingPub = JSON.parse(localStorage.getItem(pubRespKey) || '[]');
      localStorage.setItem(pubRespKey, JSON.stringify([newResp, ...existingPub]));
    } catch (e) {
      console.warn('Could not cache public response:', e);
    }

    return newResp;
  }, [forms, responses, emailTemplates, emailLogs, team, persistWorkspace]);

  const updateResponseStatus = useCallback((formId: string, respId: string, status: FormResponse['status']) => {
    setResponses(prev => {
      const next = {
        ...prev,
        [formId]: (prev[formId] ?? []).map(r =>
          r.id === respId ? { ...r, status } : r
        ),
      };
      persistWorkspace(forms, next, emailTemplates, emailLogs, team);
      return next;
    });
  }, [forms, emailTemplates, emailLogs, team, persistWorkspace]);

  const updateResponseDuplicateStatus = useCallback((formId: string, respId: string, duplicateStatus: FormResponse['duplicate_status']) => {
    setResponses(prev => {
      const next = {
        ...prev,
        [formId]: (prev[formId] ?? []).map(r =>
          r.id === respId
            ? {
                ...r,
                duplicate_status: duplicateStatus,
                is_duplicate: duplicateStatus !== 'resolved_legitimate',
              }
            : r
        ),
      };
      persistWorkspace(forms, next, emailTemplates, emailLogs, team);
      return next;
    });

    // Also update public storage if present
    try {
      const pubRespKey = `infodesk_form_responses_${formId}`;
      const existingPub: FormResponse[] = JSON.parse(localStorage.getItem(pubRespKey) || '[]');
      const updatedPub = existingPub.map(r =>
        r.id === respId
          ? {
              ...r,
              duplicate_status: duplicateStatus,
              is_duplicate: duplicateStatus !== 'resolved_legitimate',
            }
          : r
      );
      localStorage.setItem(pubRespKey, JSON.stringify(updatedPub));
    } catch (e) {
      console.warn('Could not update response in public storage:', e);
    }
  }, [forms, emailTemplates, emailLogs, team, persistWorkspace]);

  const addNote = useCallback((formId: string, respId: string, noteData: Omit<InternalNote, 'id' | 'created_at'>) => {
    const note: InternalNote = {
      ...noteData,
      id: `note-${generateId()}`,
      created_at: new Date().toISOString(),
    };
    setResponses(prev => {
      const next = {
        ...prev,
        [formId]: (prev[formId] ?? []).map(r =>
          r.id === respId ? { ...r, notes: [...(r.notes ?? []), note] } : r
        ),
      };
      persistWorkspace(forms, next, emailTemplates, emailLogs, team);
      return next;
    });
  }, [forms, emailTemplates, emailLogs, team, persistWorkspace]);

  const sendEmail = useCallback((log: Omit<EmailLog, 'id' | 'sent_at'>) => {
    const newLog: EmailLog = {
      ...log,
      id: `el-${generateId()}`,
      sent_at: new Date().toISOString(),
    };
    setEmailLogs(prev => {
      const next = [newLog, ...prev];
      persistWorkspace(forms, responses, emailTemplates, next, team);
      return next;
    });
  }, [forms, responses, emailTemplates, team, persistWorkspace]);

  const createEmailTemplate = useCallback((data: Omit<EmailTemplate, 'id' | 'created_at'>) => {
    const tmpl: EmailTemplate = {
      ...data,
      id: `et-${generateId()}`,
      created_at: new Date().toISOString(),
    };
    setEmailTemplates(prev => {
      const next = [tmpl, ...prev];
      persistWorkspace(forms, responses, next, emailLogs, team);
      return next;
    });
    return tmpl;
  }, [forms, responses, emailLogs, team, persistWorkspace]);

  const inviteMember = useCallback((data: Omit<TeamMember, 'id' | 'joined_at'>) => {
    const member: TeamMember = {
      ...data,
      id: `tm-${generateId()}`,
      joined_at: new Date().toISOString(),
    };
    setTeam(prev => {
      const next = [...prev, member];
      persistWorkspace(forms, responses, emailTemplates, emailLogs, next);
      return next;
    });
  }, [forms, responses, emailTemplates, emailLogs, persistWorkspace]);

  const updateMemberRole = useCallback((memberId: string, role: TeamMember['role']) => {
    setTeam(prev => {
      const next = prev.map(m => m.id === memberId ? { ...m, role } : m);
      persistWorkspace(forms, responses, emailTemplates, emailLogs, next);
      return next;
    });
  }, [forms, responses, emailTemplates, emailLogs, persistWorkspace]);

  const removeMember = useCallback((memberId: string) => {
    setTeam(prev => {
      const next = prev.filter(m => m.id !== memberId);
      persistWorkspace(forms, responses, emailTemplates, emailLogs, next);
      return next;
    });
  }, [forms, responses, emailTemplates, emailLogs, persistWorkspace]);

  return (
    <DemoContext.Provider value={{
      forms, responses, emailTemplates, emailLogs, team,
      createForm, updateForm, deleteForm, duplicateForm,
      addResponse, updateResponseStatus, updateResponseDuplicateStatus, addNote,
      sendEmail, createEmailTemplate,
      inviteMember, updateMemberRole, removeMember,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
