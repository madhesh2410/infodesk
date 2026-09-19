import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchUserProfile, createUserProfile } from '@/lib/profile-service';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncSession } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function processCallback() {
      // 1. Check for errors in query parameters or hash fragment
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

      const urlError = searchParams.get('error') || hashParams.get('error');
      const urlErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');
      const urlErrorCode = searchParams.get('error_code') || hashParams.get('error_code');

      if (urlError || urlErrorDesc) {
        console.error('[OAuth Callback] Authentication error received:', {
          error: urlError,
          description: urlErrorDesc,
          code: urlErrorCode,
        });

        let friendlyError = 'Google sign-in failed. Please try again.';
        const lowerDesc = (urlErrorDesc || '').toLowerCase();
        const lowerErr = (urlError || '').toLowerCase();

        if (lowerErr === 'access_denied' || lowerDesc.includes('access_denied') || lowerDesc.includes('cancelled')) {
          friendlyError = 'Google sign-in was cancelled. Please try again.';
        } else if (lowerDesc.includes('provider is not enabled') || lowerErr.includes('unsupported_provider')) {
          friendlyError = 'Google sign-in is disabled in Supabase. Please enable the Google provider in your Supabase project dashboard.';
        } else if (urlErrorDesc) {
          friendlyError = `Google sign-in failed: ${urlErrorDesc}`;
        }

        if (active) setErrorMsg(friendlyError);
        return;
      }

      if (!isSupabaseConfigured() || !supabase) {
        const configError = 'Authentication backend is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.';
        console.error('[OAuth Callback]', configError);
        if (active) setErrorMsg(configError);
        return;
      }

      try {
        // 2. Handle PKCE authorization code exchange if present
        const code = searchParams.get('code');
        if (code) {
          // Check if session was already detected/exchanged automatically
          const { data: { session: preSession } } = await supabase.auth.getSession();
          if (!preSession?.user) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('[OAuth Callback] Code exchange error (checking session fallback):', exchangeError);
              const { data: { session: fallbackSession } } = await supabase.auth.getSession();
              if (!fallbackSession?.user) {
                if (active) setErrorMsg(`Google sign-in failed: ${exchangeError.message}`);
                return;
              }
            }
          }
        }

        // 3. Retrieve authenticated session
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          // Wait briefly for token hydration
          await new Promise(r => setTimeout(r, 600));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
        }

        if (!session?.user) {
          console.error('[OAuth Callback] No active session found after callback processing.');
          if (active) setErrorMsg('Google sign-in failed. Unable to establish session. Please try again.');
          return;
        }

        const user = session.user;
        const metadata = user.user_metadata ?? {};
        const googleName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User';
        const googleAvatar = metadata.avatar_url || metadata.picture;

        // 4. Verify or create user profile (does not overwrite existing customized profile)
        try {
          const profile = await fetchUserProfile(user.id);
          if (!profile) {
            await createUserProfile({
              auth_user_id: user.id,
              full_name: googleName,
              email: user.email!,
              avatar_url: googleAvatar,
              role: 'user', // Safe default role
              timezone: 'Asia/Kolkata',
            });
          }
        } catch (profileErr) {
          console.error('[OAuth Callback] Profile synchronization error:', profileErr);
        }

        // 5. Synchronously update AuthContext before navigation to prevent race condition redirecting to /login
        await syncSession(user);

        // 6. Redirect user cleanly to /app
        if (active) {
          navigate('/app', { replace: true });
        }
      } catch (err: any) {
        console.error('[OAuth Callback] Unexpected error during callback processing:', err);
        if (active) {
          setErrorMsg(err?.message ?? 'Google sign-in failed. Please try again.');
        }
      }
    }

    processCallback();

    return () => {
      active = false;
    };
  }, [navigate, searchParams, syncSession]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[var(--color-border)] rounded-2xl p-8 text-center shadow-sm space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-primary)] rounded-xl text-white">
          <Building2 className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {errorMsg ? 'Authentication Failed' : 'Completing Sign-In'}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            {errorMsg
              ? 'There was a problem authenticating with your Google account.'
              : 'Verifying your account and setting up your workspace…'}
          </p>
        </div>

        {errorMsg ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-lg text-left leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>

            <div className="flex gap-3">
              <Link to="/login" className="btn btn-primary w-full justify-center">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-[var(--color-text-muted)]">
            <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            <span className="text-xs font-medium">Securing session…</span>
          </div>
        )}
      </div>
    </div>
  );
}
