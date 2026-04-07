import { useState, useEffect, useRef, useCallback } from 'react';
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

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError('');
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
  }, [dispatch, navigate]);

  // Render Google Sign-In button
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId || !googleBtnRef.current) return;
    // Wait for GIS script to load
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(interval);
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => { void handleGoogleCredential(response.credential); },
        });
        google.accounts.id.renderButton(googleBtnRef.current!, {
          theme: 'outline',
          size: 'large',
          width: 400,
          text: 'continue_with',
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [handleGoogleCredential]);

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

      {/* Google Sign-In — rendered by Google Identity Services */}
      <div ref={googleBtnRef} className="flex justify-center" />

      <p className="font-inter text-xs text-echo-gray text-center mt-6">
        Already have an account?{' '}
        <button onClick={() => navigate('/signin')} className="text-echo-coral font-semibold">Sign in</button>
      </p>
    </div>
  );
}
