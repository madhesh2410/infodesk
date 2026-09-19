import { createClient } from '@supabase/supabase-js';

// Default to project's public credentials if environment variables are not injected (e.g. in Vercel or preview)
const DEFAULT_SUPABASE_URL = 'https://gbezdoycnslcebgnpdxz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_uT87E_AGyI9GKumIeH6mNQ_s2CO1GER';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
  );
}


export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce',
      },
    })
  : null;
