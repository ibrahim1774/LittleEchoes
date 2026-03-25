import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BENEFITS = [
  {
    icon: '🎙️',
    title: "Preserve their voice forever",
    body: "Their laugh, their words, their wonder — captured exactly as they are right now.",
  },
  {
    icon: '📈',
    title: "Watch them grow year after year",
    body: "Hear how their answers change from age 4 to 10. Nothing else gives you that.",
  },
  {
    icon: '⏱️',
    title: "3 questions. 5 minutes. A lifetime of memories.",
    body: "We do the hard part — you just hit record. Simple enough to do every single day.",
  },
  {
    icon: '🔒',
    title: "Private, safe, and always yours",
    body: "Your recordings live on your device and your private cloud. Never shared, never sold.",
  },
];

export function PricingScreen() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col px-6 pt-6 pb-6 overflow-y-auto">
      {/* Back to sign in */}
      <button
        onClick={() => navigate('/signin')}
        className="self-end font-inter text-sm text-echo-gray mb-3"
      >
        Already a member? Sign in
      </button>

      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-1.5">🎙️</div>
        <h1 className="font-nunito font-extrabold text-xl text-echo-charcoal dark:text-white leading-tight">
          Start capturing their echoes today
        </h1>
        <p className="font-inter text-echo-gray text-xs mt-1 leading-relaxed">
          Join thousands of parents preserving the voices they never want to forget.
        </p>
      </div>

      {/* Benefits */}
      <div className="space-y-2 mb-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-echo-dark-card shadow-soft flex items-center justify-center text-base flex-shrink-0">
              {b.icon}
            </div>
            <div>
              <p className="font-nunito font-bold text-xs text-echo-charcoal dark:text-white">{b.title}</p>
              <p className="font-inter text-[11px] text-echo-gray leading-snug">{b.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-2 text-center">Choose your plan</p>
      <div className="space-y-2 mb-4">
        {/* Yearly */}
        <button
          onClick={() => setSelectedPlan('yearly')}
          className={`w-full rounded-2xl px-4 py-3 border-2 text-left transition-all relative ${
            selectedPlan === 'yearly'
              ? 'border-echo-coral bg-echo-coral/5'
              : 'border-echo-light-gray bg-white dark:bg-echo-dark-card'
          }`}
        >
          <div className="absolute -top-2.5 right-4 bg-echo-sunny text-echo-charcoal font-nunito font-bold text-xs px-3 py-0.5 rounded-full">
            Best Value — Save 50%
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">Yearly</p>
              <p className="font-inter text-xs text-echo-gray mt-0.5">$59.99 / year — just $5/month</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-nunito font-extrabold text-lg text-echo-coral">$59.99</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPlan === 'yearly' ? 'border-echo-coral bg-echo-coral' : 'border-echo-light-gray'
              }`}>
                {selectedPlan === 'yearly' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Monthly */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={`w-full rounded-2xl px-4 py-3 border-2 text-left transition-all ${
            selectedPlan === 'monthly'
              ? 'border-echo-coral bg-echo-coral/5'
              : 'border-echo-light-gray bg-white dark:bg-echo-dark-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">Monthly</p>
              <p className="font-inter text-xs text-echo-gray mt-0.5">Cancel anytime</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-nunito font-extrabold text-lg text-echo-charcoal dark:text-white">$9.99</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPlan === 'monthly' ? 'border-echo-coral bg-echo-coral' : 'border-echo-light-gray'
              }`}>
                {selectedPlan === 'monthly' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      {error && (
        <p className="font-inter text-xs text-red-500 text-center mb-2">{error}</p>
      )}

      <button
        onClick={() => void handleSubscribe()}
        disabled={loading}
        className="w-full py-3.5 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60"
      >
        {loading ? 'Redirecting to checkout...' : `Start with ${selectedPlan === 'yearly' ? 'Yearly — $59.99' : 'Monthly — $9.99/mo'}`}
      </button>

      <p className="font-inter text-xs text-echo-gray text-center mt-2">
        Secure payment via Stripe. Cancel anytime. No hidden fees.
      </p>
    </div>
  );
}
