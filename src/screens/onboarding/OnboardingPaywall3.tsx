import { useState } from 'react';

type PlanKey = 'basic_monthly' | 'pro_monthly' | 'pro_yearly';

type PlanFeature = { icon: string; text: string; muted?: boolean };

type Plan = {
  key: PlanKey;
  name: string;
  tier: 'basic' | 'pro';
  price: string;
  priceUnit: string;
  sublabel: React.ReactNode;
  trial: boolean;
  bestValue?: boolean;
  features: PlanFeature[];
};

const PLANS: Plan[] = [
  {
    key: 'basic_monthly',
    name: 'Basic',
    tier: 'basic',
    price: '$5',
    priceUnit: '/mo',
    sublabel: 'Audio recordings only',
    trial: false,
    features: [
      { icon: '🎙️', text: 'Record their little voice in just a couple of taps' },
      { icon: '📖', text: 'Daily questions that may bring out the sweetest answers' },
      { icon: '🌱', text: "A growing audio library that can help you notice how they're changing" },
      { icon: '🔒', text: 'Private cloud storage that stays just yours' },
      { icon: '🔒', text: 'Video moments — included with Pro', muted: true },
    ],
  },
  {
    key: 'pro_monthly',
    name: 'Pro Monthly',
    tier: 'pro',
    price: '$10',
    priceUnit: '/mo',
    sublabel: (
      <>Audio and <span className="text-echo-coral font-extrabold">video</span> recording only</>
    ),
    trial: true,
    features: [
      { icon: '🎙️', text: 'Everything in Basic' },
      { icon: '📹', text: 'Daily video clips that can help you remember the little things' },
      { icon: '🎬', text: 'A Voice + Video Growth Timeline you may treasure for years' },
      { icon: '💡', text: 'Smart prompts that may make recording feel effortless' },
      { icon: '🔒', text: 'Same private cloud, expanded library' },
    ],
  },
  {
    key: 'pro_yearly',
    name: 'Pro Yearly',
    tier: 'pro',
    price: '$60',
    priceUnit: '/yr',
    sublabel: '$5/mo — billed $60/year',
    trial: true,
    bestValue: true,
    features: [
      { icon: '🎙️', text: 'Everything in Basic' },
      { icon: '📹', text: 'Daily video clips that can help you remember the little things' },
      { icon: '🎬', text: 'A Voice + Video Growth Timeline you may treasure for years' },
      { icon: '💡', text: 'Smart prompts that may make recording feel effortless' },
      { icon: '🔒', text: 'Same private cloud, expanded library' },
    ],
  },
];

export function OnboardingPaywall3() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro_monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session-3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
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

  const selected = PLANS.find((p) => p.key === selectedPlan)!;
  const ctaLabel = loading
    ? 'Redirecting to checkout...'
    : selected.tier === 'pro'
      ? 'Start Your Free Trial'
      : 'Start Basic — $5/mo';
  const footerNote = selected.tier === 'pro'
    ? 'Cancel anytime.'
    : 'Billed monthly. Cancel anytime.';

  return (
    <div className="relative min-h-screen bg-echo-cream dark:bg-echo-dark-bg overflow-hidden select-none">
      <div className="min-h-screen flex flex-col items-center px-6 pt-12 pb-10">
        <div className="flex flex-col w-full gap-4 pt-2 flex-1">
          <div className="text-center space-y-2">
            <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white">
              Choose your plan
            </h1>
            <p className="font-inter text-sm text-echo-gray leading-relaxed">
              Start with audio, or unlock video moments with Pro.
            </p>
          </div>

          {/* Plan cards */}
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.key;
              return (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`w-full rounded-2xl px-4 py-3 border-2 text-left transition-all relative ${
                    isSelected
                      ? 'border-echo-coral bg-echo-coral/5'
                      : 'border-echo-light-gray bg-white dark:bg-echo-dark-card'
                  }`}
                >
                  {plan.trial && (
                    <div className="absolute -top-2.5 left-4 bg-echo-coral text-white font-nunito font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-coral whitespace-nowrap">
                      🎉 Free Trial
                    </div>
                  )}
                  {plan.bestValue && (
                    <div className="absolute -top-2.5 right-4 bg-echo-sunny text-echo-charcoal font-nunito font-bold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Best Value — Save 50%
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                        {plan.name}
                      </p>
                      <p className="font-inter text-xs text-echo-gray mt-0.5">{plan.sublabel}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-nunito font-extrabold text-lg ${
                        plan.tier === 'pro' && plan.bestValue
                          ? 'text-echo-coral'
                          : 'text-echo-charcoal dark:text-white'
                      }`}>
                        {plan.price}<span className="text-xs font-bold text-echo-gray">{plan.priceUnit}</span>
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-echo-coral bg-echo-coral' : 'border-echo-light-gray'
                      }`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                            <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feature bullets — only render for the selected card */}
                  {isSelected && (
                    <ul className="mt-3 pt-3 border-t border-echo-coral/15 space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`text-base leading-none flex-shrink-0 mt-0.5 ${f.muted ? 'opacity-50' : ''}`}>
                            {f.icon}
                          </span>
                          <span className={`font-inter text-xs leading-snug ${
                            f.muted
                              ? 'text-echo-gray italic'
                              : 'text-echo-charcoal dark:text-white'
                          }`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="font-inter text-xs text-red-500 text-center">{error}</p>
          )}

          <div className="mt-auto space-y-3 pt-2">
            <button
              onClick={() => void handleSubscribe()}
              disabled={loading}
              className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60"
            >
              {ctaLabel}
            </button>

            <p className="font-inter text-xs text-echo-gray text-center">
              {footerNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
