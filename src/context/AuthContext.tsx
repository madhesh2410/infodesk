import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchUserProfile, createUserProfile, updateUserProfile } from '@/lib/profile-service';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: { full_name?: string; timezone?: string }) => Promise<void>;
  syncSession: (sessionUser?: any) => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase user with database profile
  const syncSupabaseUser = useCallback(async (sessionUser: any): Promise<AuthUser> => {
    const authUserId = sessionUser.id;
    const email = sessionUser.email ?? '';
    const metadata = sessionUser.user_metadata ?? {};
    const displayName = metadata.full_name || metadata.name || email.split('@')[0] || 'User';
    const avatarUrl = metadata.avatar_url || metadata.picture;
    const provider = sessionUser.app_metadata?.provider || 'email';

    // 1. Fetch profile from database
    let profile = await fetchUserProfile(authUserId);

    // 2. If not found, create new profile with safe default role ('user')
    if (!profile) {
      profile = await createUserProfile({
        auth_user_id: authUserId,
        full_name: displayName,
        email,
        avatar_url: avatarUrl,
        role: 'user', // Safe default role: never automatically super_admin
        timezone: 'Asia/Kolkata',
      });
    }

    const authUser: AuthUser = {
      id: authUserId,
      email,
      full_name: profile.full_name || displayName,
      avatar_url: profile.avatar_url || avatarUrl,
      role: (profile.role as UserRole) || 'user',
      timezone: profile.timezone || 'Asia/Kolkata',
      provider,
      organization_id: `org-${authUserId.slice(0, 8)}`,
      organization_name: `${profile.full_name || displayName}'s Workspace`,
    };

    return authUser;
  }, []);

  // Explicit session synchronization to eliminate race conditions
  const syncSession = useCallback(async (sessionUser?: any): Promise<AuthUser | null> => {
    try {
      let targetUser = sessionUser;
      if (!targetUser && isSupabaseConfigured() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        targetUser = session?.user;
      }
      if (!targetUser) {
        setUser(null);
        setLoading(false);
        return null;
      }
      const authUser = await syncSupabaseUser(targetUser);
      setUser(authUser);
      setLoading(false);
      return authUser;
    } catch (err) {
      console.error('[AuthContext] syncSession error:', err);
      setLoading(false);
      return null;
    }
  }, [syncSupabaseUser]);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const authUser = await syncSupabaseUser(session.user);
            if (mounted) {
              setUser(authUser);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('[AuthContext] Error checking Supabase session:', e);
        }
      }

      // If URL is /auth/callback, don't prematurely set loading to false; let AuthCallbackPage complete PKCE exchange
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
        return;
      }

      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          if (session?.user) {
            try {
              const authUser = await syncSupabaseUser(session.user);
              if (mounted) {
                setUser(authUser);
                setLoading(false);
              }
            } catch (err) {
              console.error('[AuthContext] Error syncing user on auth event:', event, err);
              if (mounted) {
                setLoading(false);
              }
            }
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [syncSupabaseUser]);

  // Standard Email/Password Sign-In
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured() || !supabase) {
      return {
        error: 'Authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const authUser = await syncSupabaseUser(data.user);
        setUser(authUser);
        return { error: null };
      }
      return { error: 'No user session returned.' };
    } catch (err: any) {
      return { error: err.message ?? 'Authentication failed' };
    }
  }, [syncSupabaseUser]);


  // Sign out
  const signOut = useCallback(async () => {
    localStorage.removeItem('infodesk_active_session');

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error during Supabase sign out:', e);
      }
    }

    setUser(null);
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured() || !supabase) {
      return {
        error: 'Registration requires a connected Supabase backend. Check your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Automatically create initial profile
        await createUserProfile({
          auth_user_id: data.user.id,
          full_name: fullName,
          email: cleanEmail,
          role: 'user',
          timezone: 'Asia/Kolkata',
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Registration failed. Please try again.' };
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Authentication is not configured.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Password reset request failed.' };
    }
  }, []);

  // Resend Confirmation Email
  const resendConfirmation = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Authentication is not configured.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to resend confirmation email.' };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: { full_name?: string; timezone?: string }) => {
    if (!user) return;

    const updatedProfile = await updateUserProfile(user.id, updates);
    setUser(prev => prev ? {
      ...prev,
      full_name: updatedProfile.full_name,
      timezone: updatedProfile.timezone,
    } : null);
  }, [user]);

  const value: AuthContextValue = {
    user,
    loading,
    isConfigured: isSupabaseConfigured(),
    signIn,
    signOut,
    signUp,
    resetPassword,
    resendConfirmation,
    updateProfile,
    syncSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
