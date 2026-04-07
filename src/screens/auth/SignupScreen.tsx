import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useApp } from '@/context/AppContext';
import { syncToCloud } from '@/services/cloudSync';

declare function fbq(...args: unknown[]): void;

export function SignupScreen() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
      if (!clientId) { setError('Google Sign-In not configured.'); setLoading(false); return; }

      const credential = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => resolve(response.credential),
        });
        google.accounts.id.prompt();
        // Timeout if user closes the popup
        setTimeout(() => reject(new Error('Google Sign-In cancelled')), 60000);
      });

      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });

      if (authError) { setError(authError.message); setLoading(false); return; }

      if (data.user) {
        const user = { id: data.user.id, email: data.user.email ?? '' };
        dispatch({ type: 'SET_USER', payload: user });
        void syncToCloud(user);
        try { fbq('track', 'CompleteRegistration'); } catch { /* pixel not loaded */ }
        if (localStorage.getItem('le_paid') === 'true') {
          dispatch({ type: 'SET_PAID', payload: true });
          void supabase.from('profiles').upsert({ id: user.id, paid: true });
          localStorage.removeItem('le_paid');
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/setup/parent', { replace: true }), 1500);
    } catch {
      setError('Google Sign-In was cancelled or failed.');
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const user = { id: data.user.id, email: data.user.email ?? '' };
      dispatch({ type: 'SET_USER', payload: user });
      void syncToCloud(user);
      // Fire Facebook CompleteRegistration pixel
      try { fbq('track', 'CompleteRegistration'); } catch { /* pixel not loaded */ }
      // Check if user paid before signing up (from onboarding flow)
      if (localStorage.getItem('le_paid') === 'true') {
        dispatch({ type: 'SET_PAID', payload: true });
        void supabase.from('profiles').upsert({ id: user.id, paid: true });
        localStorage.removeItem('le_paid');
      }
    }

    setSuccess(true);
    setTimeout(() => navigate('/setup/parent', { replace: true }), 1500);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-nunito font-extrabold text-xl text-echo-charcoal dark:text-white">Account created!</h2>
        <p className="font-inter text-echo-gray text-sm mt-2">Let's set up your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col px-6 pt-12 pb-10">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">👋</div>
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          Create your account
        </h1>
        <p className="font-inter text-echo-gray text-sm mt-1">
          Your echoes will be saved securely to the cloud.
        </p>
      </div>

      <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
        <div>
          <label className="font-inter text-xs text-echo-gray uppercase tracking-wide block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-white dark:bg-echo-dark-card rounded-2xl px-4 py-3.5 font-inter text-sm text-echo-charcoal dark:text-white outline-none border-2 border-transparent focus:border-echo-coral transition-colors"
          />
        </div>
        <div>
          <label className="font-inter text-xs text-echo-gray uppercase tracking-wide block mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
            className="w-full bg-white dark:bg-echo-dark-card rounded-2xl px-4 py-3.5 font-inter text-sm text-echo-charcoal dark:text-white outline-none border-2 border-transparent focus:border-echo-coral transition-colors"
          />
        </div>
        {error && <p className="font-inter text-xs text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60 mt-2"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-echo-light-gray" />
        <span className="font-inter text-xs text-echo-gray">or</span>
        <div className="flex-1 h-px bg-echo-light-gray" />
      </div>

      {/* Google Sign-In */}
      <button
        onClick={() => void handleGoogleSignIn()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full border-2 border-echo-light-gray bg-white dark:bg-echo-dark-card active:scale-95 transition-transform disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">Continue with Google</span>
      </button>

      <p className="font-inter text-xs text-echo-gray text-center mt-6">
        Already have an account?{' '}
        <button onClick={() => navigate('/signin')} className="text-echo-coral font-semibold">Sign in</button>
      </p>
    </div>
  );
}
