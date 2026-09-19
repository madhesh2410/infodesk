import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchUserProfile, createUserProfile } from '@/lib/profile-service';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function processCallback() {
      // 1. Check for errors returned in query params
      const urlError = searchParams.get('error_description') || searchParams.get('error');
      if (urlError) {
        if (active) setErrorMsg(`Google sign-in failed: ${urlError}`);
        return;
      }

      if (!isSupabaseConfigured() || !supabase) {
        if (active) setErrorMsg('Google sign-in is not configured yet. Please contact the administrator.');
        return;
      }

      try {
        // If PKCE code exists in query params, exchange it
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (active) setErrorMsg(`Google sign-in failed: ${exchangeError.message}`);
            return;
          }
        }

        // Retrieve the authenticated session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          // If no session found yet, wait briefly for onAuthStateChange to pick up hash tokens
          await new Promise(r => setTimeout(r, 800));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession?.user) {
            if (active) setErrorMsg('Google sign-in failed. Please try again.');
            return;
          }
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.user) {
          if (active) setErrorMsg('Google sign-in failed. Please try again.');
          return;
        }

        const user = currentSession.user;
        const metadata = user.user_metadata ?? {};
        const googleName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User';
        const googleAvatar = metadata.avatar_url || metadata.picture;

        // Verify or create profile in database
        try {
          let profile = await fetchUserProfile(user.id);
          if (!profile) {
            profile = await createUserProfile({
              auth_user_id: user.id,
              full_name: googleName,
              email: user.email!,
              avatar_url: googleAvatar,
              role: 'user', // Safe default role
              timezone: 'Asia/Kolkata',
            });
          }
        } catch (profileErr) {
          console.error('Profile creation error:', profileErr);
          if (active) {
            setErrorMsg('Your account was authenticated, but your profile could not be created. Please try again.');
            return;
          }
        }

        // Navigate safely to dashboard
        if (active) {
          navigate('/app/dashboard', { replace: true });
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err?.message ?? 'Google sign-in failed. Please try again.');
        }
      }
    }

    processCallback();

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

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
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            {errorMsg
              ? 'There was a problem authenticating with your Google account.'
              : 'Verifying your account and setting up your workspace…'}
          </p>
        </div>

        {errorMsg ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-lg text-left">
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
