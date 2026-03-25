import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useApp } from '@/context/AppContext';
import { loadFromCloud } from '@/services/cloudSync';

export function SigninScreen() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const user = { id: data.user.id, email: data.user.email ?? '' };
      dispatch({ type: 'SET_USER', payload: user });
      // Load cloud data onto this device
      await loadFromCloud(user);
    }

    navigate('/home', { replace: true });
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address above first.'); return; }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/signin`,
    });
    setResetSent(true);
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col px-6 pt-12 pb-10">
      <button onClick={() => navigate(-1)} className="self-start mb-6 p-2 -ml-2 text-echo-gray">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">Welcome back</h1>
        <p className="font-inter text-echo-gray text-sm mt-1">Sign in to access your echoes</p>
      </div>

      <form onSubmit={(e) => void handleSignin(e)} className="space-y-4">
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
            placeholder="Your password"
            className="w-full bg-white dark:bg-echo-dark-card rounded-2xl px-4 py-3.5 font-inter text-sm text-echo-charcoal dark:text-white outline-none border-2 border-transparent focus:border-echo-coral transition-colors"
          />
        </div>

        {error && <p className="font-inter text-xs text-red-500 text-center">{error}</p>}
        {resetSent && <p className="font-inter text-xs text-echo-sky text-center">Password reset email sent! Check your inbox.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={() => void handleForgotPassword()}
        className="font-inter text-xs text-echo-sky mt-4 self-center"
      >
        Forgot password?
      </button>

      <p className="font-inter text-xs text-echo-gray text-center mt-6">
        New here?{' '}
        <button onClick={() => navigate('/pricing')} className="text-echo-coral font-semibold">Get started</button>
      </p>
    </div>
  );
}
