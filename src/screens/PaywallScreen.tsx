import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export function PaywallScreen() {
  const { state } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const childName = state.activeChild?.name || state.children[0]?.name || '';

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
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col items-center px-6 pt-10 pb-10">
      <div className="flex flex-col w-full max-w-md gap-4 flex-1">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-4xl block">🎙️</span>
          <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white">
            One last step before{childName ? ` ${childName}'s` : ' your'} memories begin
          </h1>
          <p className="font-inter text-sm text-echo-gray leading-relaxed">
            Choose a plan to start preserving their voice forever.
          </p>
        </div>

        {/* Trial banner */}
        {selectedPlan === 'yearly' && (
          <div className="rounded-2xl bg-echo-coral/10 px-4 py-3 text-center">
            <p className="font-nunito font-bold text-sm text-echo-coral">
              🎉 Try free for 3 days — cancel anytime
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft p-4">
          <p className="font-nunito font-bold text-xs text-echo-gray uppercase tracking-wide mb-3">What you get</p>
          <div className="space-y-2.5">
            {[
              { icon: '🎯', text: '3 daily questions tailored to their age', color: '#FF6B6B' },
              { icon: '🎙️', text: 'Preserve their voice before it changes', color: '#6BC5F8' },
              { icon: '🌱', text: 'Voice Growth Timeline — hear them evolve', color: '#A8E06C' },
              { icon: '📹', text: 'Daily video clips to capture the moment', color: '#C4A1FF' },
              { icon: '🔒', text: '100% private — your data stays yours', color: '#FFD93D' },
            ].map((b, i) => (
              <div key={b.text} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: b.color + '20' }}>
                  {b.icon}
                </div>
                <p className="font-nunito font-semibold text-xs text-echo-charcoal dark:text-white leading-snug">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="space-y-2">
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
                <p className="font-inter text-xs text-echo-gray mt-0.5">$5/mo — billed $60/year · 3-day free trial</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-nunito font-extrabold text-lg text-echo-coral">$60</span>
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
                <p className="font-inter text-xs text-echo-gray mt-0.5">Billed monthly</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-nunito font-extrabold text-lg text-echo-charcoal dark:text-white">$10</span>
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
          <p className="font-inter text-xs text-red-500 text-center">{error}</p>
        )}

        {/* CTA */}
        <div className="mt-auto space-y-3 pt-2">
          <button
            onClick={() => void handleSubscribe()}
            disabled={loading}
            className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? 'Redirecting to checkout...' : selectedPlan === 'yearly' ? 'Start My 3-Day Free Trial' : 'Subscribe — $10/mo'}
          </button>

          <p className="font-inter text-xs text-echo-gray text-center">
            {selectedPlan === 'yearly' ? "You won't be charged for 3 days. Cancel anytime." : 'Cancel anytime.'}
          </p>
        </div>
      </div>
    </div>
  );
}
