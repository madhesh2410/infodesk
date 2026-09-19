import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, resetPassword, resendConfirmation } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('mode') === 'reset') {
      setMode('login');
      setSuccessMsg('You can now sign in with your new password.');
    }
  }, [searchParams]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  function switchMode(newMode: 'login' | 'signup' | 'forgot') {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMsg('Password reset link sent to your email.');
        }
        return;
      }

      let result: { error: string | null };
      if (mode === 'login') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, fullName);
      }

      if (result.error) {
        setError(result.error);
      } else if (mode === 'signup') {
        setSuccessMsg('Account created successfully! Please check your email to verify or sign in.');
        switchMode('login');
      } else {
        navigate('/app/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    if (!email.trim()) {
      setError('Please enter your email address to resend the confirmation link.');
      return;
    }
    setError('');
    setResending(true);
    try {
      const result = await resendConfirmation(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMsg(`Confirmation email sent to ${email}. Please check your inbox (and spam folder).`);
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left panel — institutional branding */}
      <div className="hidden lg:flex flex-1 bg-[var(--color-primary)] flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">InfoDesk</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Institutional Information.<br />Centralized.<br />AI-Powered.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Replace scattered paper sheets, unstructured files, and manual document collection with one intelligent platform.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Describe your form in plain English — InfoDesk builds it',
              'Automatic field inference, sections, and conditional logic',
              'Direct participant links, file uploads & PDF generation',
              'Real-time responses, profile exports & email center',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-white/90 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs">© 2026 InfoDesk. Production Grade Institutional Platform.</p>
      </div>

      {/* Right panel — authentication form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base">InfoDesk</span>
          </div>

          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {mode === 'login' && 'Sign in to InfoDesk'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {mode === 'login' && 'Enter your credentials to access your workspace.'}
              {mode === 'signup' && 'Create your account to start collecting institutional data.'}
              {mode === 'forgot' && "Enter your email address and we'll send a password reset link."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="input"
                  placeholder="e.g. Madhesh M"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@institution.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label" htmlFor="password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-[var(--color-primary)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder={mode === 'login' ? '••••••••' : 'At least 8 characters'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    onClick={() => setShowConfirmPassword(s => !s)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              error.toLowerCase().includes('email not confirmed') ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-lg leading-relaxed space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-amber-950">Email confirmation required</span>
                      <span className="text-amber-800">Supabase requires email verification before signing in. Check your inbox and spam folder.</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/70 space-y-2">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs transition-colors shadow-2xs"
                    >
                      {resending ? 'Sending link…' : 'Resend Verification Email'}
                    </button>
                    <div className="bg-amber-100/70 p-2 rounded text-[11px] text-amber-900 leading-normal">
                      <p className="font-medium text-amber-950 mb-0.5">Instant Fix in Supabase Dashboard:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                        <li>Go to <strong>Authentication &rarr; Users</strong>, click <strong>···</strong> next to your email &rarr; <strong>Confirm user</strong>.</li>
                        <li>Or go to <strong>Authentication &rarr; Providers &rarr; Email</strong> and turn OFF <strong>Confirm email</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-lg leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'forgot' ? (
            <p className="text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-medium hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-[var(--color-text-secondary)]">
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-[var(--color-primary)] font-medium hover:underline"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-[var(--color-primary)] font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          )}

          <p className="text-center">
            <Link to="/" className="text-xs text-[var(--color-text-muted)] hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
