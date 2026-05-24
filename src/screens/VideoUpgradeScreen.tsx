import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const FEATURES: { icon: string; text: string }[] = [
  { icon: '📹', text: 'Daily video clips that can help you remember the little things' },
  { icon: '🎬', text: 'A Voice + Video Growth Timeline you may treasure for years' },
  { icon: '💡', text: 'Smart prompts that may make recording feel effortless' },
  { icon: '🔒', text: 'Same private cloud — your moments stay yours' },
];

export function VideoUpgradeScreen() {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpgrade() {
    if (!state.user?.email) {
      setError('Please sign in again to manage your subscription.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.user.email }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Could not open the billing portal. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24 px-5 pt-8 flex flex-col">
      <div className="text-center space-y-3 mb-6">
        <div className="text-5xl mb-1">📹</div>
        <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white">
          Video moments are part of Pro
        </h1>
        <p className="font-inter text-sm text-echo-gray leading-relaxed max-w-xs mx-auto">
          You're on the Basic plan, which keeps audio. Upgrading to Pro can help you capture the faces behind the voices.
        </p>
      </div>

      <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft p-4 space-y-3">
        <p className="font-inter text-xs text-echo-gray uppercase tracking-wide">
          With Pro you also get
        </p>
        <ul className="space-y-2.5">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-echo-coral/10 flex items-center justify-center text-lg flex-shrink-0">
                {f.icon}
              </div>
              <p className="font-inter text-sm text-echo-charcoal dark:text-white leading-snug pt-1.5">
                {f.text}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-echo-coral/10 border-2 border-echo-coral/30 rounded-2xl p-4 mt-4 text-center">
        <p className="font-nunito font-bold text-sm text-echo-coral">
          Pro — $10/month
        </p>
        <p className="font-inter text-xs text-echo-gray mt-1">
          Or $60/year. Same private cloud. Cancel anytime.
        </p>
      </div>

      {error && (
        <p className="font-inter text-xs text-red-500 text-center mt-4">{error}</p>
      )}

      <div className="mt-auto pt-6 space-y-2">
        <button
          onClick={() => void handleUpgrade()}
          disabled={loading}
          className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading ? 'Opening billing portal...' : 'Upgrade to Pro'}
        </button>
        <p className="font-inter text-xs text-echo-gray text-center">
          You'll manage your plan through Stripe.
        </p>
      </div>
    </div>
  );
}
