import { useState } from 'react';
import { ParentChildIllustration } from '@/components/illustrations/ParentChildIllustration';

const TOTAL = 8;

const AGE_OPTIONS = [
  { label: 'Under 2', value: 'under-2', icon: '👶' },
  { label: '2–4', value: '2-4', icon: '🧸' },
  { label: '4–6', value: '4-6', icon: '🎨' },
  { label: '6–9', value: '6-9', icon: '🎒' },
  { label: '9–12', value: '9-12', icon: '🏃' },
];

const EMOTION_OPTIONS = [
  { icon: '🎤', text: "The way they say 'I love you'", color: '#FF6B6B' },
  { icon: '😂', text: 'Their hilarious mispronunciations', color: '#FFD93D' },
  { icon: '📖', text: 'Story time in their little voice', color: '#6BC5F8' },
  { icon: '🎵', text: 'The songs they sing to themselves', color: '#C4A1FF' },
];

const FEATURES = [
  { src: '/IMG_3452.jpg', title: 'Record in seconds', desc: 'One tap to capture their voice. We handle the rest.' },
  { src: '/IMG_3454.jpg', title: 'Your voice time capsule', desc: 'Organized by age, preserved forever.' },
  { src: '/IMG_3455.jpg', title: 'Share or keep forever', desc: 'Play it back years from now. Share with grandparents anytime.' },
];

function PhoneMockup({ src, alt, width = 120 }: { src: string; alt: string; width?: number }) {
  return (
    <div
      className="rounded-[20px] border-2 border-echo-light-gray shadow-soft overflow-hidden bg-white flex-shrink-0"
      style={{ width }}
    >
      <img src={src} alt={alt} className="w-full h-auto object-contain" loading="lazy" />
    </div>
  );
}

export function OnboardingFlow5() {
  const [screen, setScreen] = useState(0);
  const [visible, setVisible] = useState(true);
  const [childName, setChildName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = screen / (TOTAL - 1);

  function advance() {
    setVisible(false);
    setTimeout(() => {
      setScreen((s) => s + 1);
      setVisible(true);
    }, 210);
  }

  function handleEmotionSelect(index: number) {
    if (selectedEmotion !== null) return;
    setSelectedEmotion(index);
    setTimeout(() => advance(), 400);
  }

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session-5', {
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
    <div className="relative min-h-screen bg-echo-cream dark:bg-echo-dark-bg overflow-hidden select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-echo-light-gray z-20">
        <div
          className="h-full bg-echo-coral transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Animated content */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(16px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
        className="min-h-screen flex flex-col items-center px-6 pt-12 pb-10"
      >

        {/* ── SCREEN 1: Emotional Hook ── */}
        {screen === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-5">
            <ParentChildIllustration />
            <div className="text-center space-y-3 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[28px] leading-tight text-echo-charcoal dark:text-white">
                Their little voice won't sound like this forever.
              </h1>
              <p className="font-nunito text-base text-echo-gray leading-relaxed">
                LittleEchoes preserves your child's voice — every funny word, every sweet giggle — so you can hear it again in 10, 20, even 50 years.
              </p>
            </div>
            <button
              onClick={advance}
              className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform mt-4"
            >
              Start Saving Memories →
            </button>
          </div>
        )}

        {/* ── SCREEN 2: Personalization ── */}
        {screen === 1 && (
          <div className="flex flex-col w-full gap-5 pt-4 flex-1">
            <div className="text-center space-y-2">
              <h1 className="font-nunito font-extrabold text-[26px] leading-tight text-echo-charcoal dark:text-white">
                Tell us about your little one 💛
              </h1>
              <p className="font-inter text-sm text-echo-gray">
                This helps us pick the best questions for their age.
              </p>
            </div>
            <div className="space-y-2">
              <label className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">Their first name</label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Emma"
                className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray focus:border-echo-coral outline-none font-nunito text-base text-echo-charcoal dark:text-white placeholder:text-echo-gray/50 transition-colors"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">How old are they?</label>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAgeGroup(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 font-nunito font-semibold text-sm transition-all active:scale-95 ${
                      ageGroup === opt.value
                        ? 'border-echo-coral bg-echo-coral/10 text-echo-coral'
                        : 'border-echo-light-gray bg-white dark:bg-echo-dark-card text-echo-charcoal dark:text-white'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-4">
              <button
                onClick={advance}
                disabled={!childName.trim() || !ageGroup}
                className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: Emotional Question ── */}
        {screen === 2 && (
          <div className="flex flex-col w-full gap-6 pt-4 flex-1">
            <div className="text-center space-y-2">
              <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white">
                What moment do you wish you could keep forever?
              </h1>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {EMOTION_OPTIONS.map((opt, i) => {
                const isSelected = selectedEmotion === i;
                const isDimmed = selectedEmotion !== null && selectedEmotion !== i;
                return (
                  <button
                    key={i}
                    onClick={() => handleEmotionSelect(i)}
                    style={{
                      borderColor: isSelected ? opt.color : 'transparent',
                      opacity: isDimmed ? 0.4 : 1,
                      transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                      transition: 'all 0.18s ease',
                    }}
                    className="flex items-center gap-4 bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft border-2 text-left w-full active:scale-[0.97]"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: opt.color + '22' }}>
                      {opt.icon}
                    </div>
                    <p className="font-nunito font-semibold text-[15px] text-echo-charcoal dark:text-white leading-snug flex-1">{opt.text}</p>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: opt.color }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCREENS 4–6: Feature Pages ── */}
        {screen >= 3 && screen <= 5 && (() => {
          const feat = FEATURES[screen - 3];
          if (!feat) return null;
          const stepNum = screen - 2;
          return (
            <div className="flex flex-col items-center w-full gap-5 pt-2 flex-1">
              <p className="font-nunito font-bold text-xs text-echo-coral uppercase tracking-wider">
                Step {stepNum} of 3
              </p>
              <PhoneMockup src={feat.src} alt={feat.title} width={220} />
              <div className="text-center space-y-2 max-w-xs">
                <h1 className="font-nunito font-extrabold text-[22px] leading-tight text-echo-charcoal dark:text-white">{feat.title}</h1>
                <p className="font-inter text-sm text-echo-gray leading-relaxed">{feat.desc}</p>
              </div>
              <div className="mt-auto pt-3 w-full">
                <button onClick={advance} className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform">
                  Tap to Continue
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── SCREEN 7: Growth Showcase ── */}
        {screen === 6 && (
          <div className="flex flex-col items-center w-full gap-4 pt-2 flex-1">
            <div className="text-center space-y-2 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                Hear them grow up.{'\n'}One voice at a time.
              </h1>
              <p className="font-inter text-sm text-echo-gray leading-relaxed">
                Play back their voice from 6 months ago. Then today. The difference will give you chills.
              </p>
            </div>
            <div className="rounded-[24px] border-2 border-echo-light-gray shadow-soft overflow-hidden bg-white" style={{ width: 180 }}>
              <img src="/IMG_3457.png" alt="Voice Growth Timeline" className="w-full h-auto object-contain" loading="lazy" />
            </div>
            <div className="w-full space-y-2.5">
              {[
                'Hear their 3-year-old voice next to their 5-year-old voice',
                'Pick any time range — weekly, monthly, or yearly snapshots',
                'The app picks the best moments for you automatically',
                'A time machine for the voice you never want to forget',
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-echo-coral/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="font-inter text-xs text-echo-charcoal dark:text-white leading-snug">{b}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-3 w-full">
              <button onClick={advance} className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform">
                See My Plan →
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 8: Paywall ($10/mo + 3-day trial, $60/yr + 7-day trial) ── */}
        {screen === 7 && (
          <div className="flex flex-col w-full gap-4 pt-2 flex-1">
            <div className="text-center space-y-2">
              <h1 className="font-nunito font-extrabold text-[24px] leading-tight text-echo-charcoal dark:text-white">
                Start preserving {childName || 'their'}'s voice today
              </h1>
              <p className="font-inter text-sm text-echo-gray leading-relaxed">
                Every day, their voice changes a little. Don't miss it.
              </p>
            </div>

            {/* Trial banner — both plans have trials */}
            <div className="rounded-2xl bg-echo-coral/10 px-4 py-3 text-center">
              <p className="font-nunito font-bold text-sm text-echo-coral">
                🎉 Try free for {selectedPlan === 'yearly' ? '7' : '3'} days — cancel anytime
              </p>
            </div>

            {/* Benefits checklist */}
            <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft p-4">
              <p className="font-nunito font-bold text-xs text-echo-gray uppercase tracking-wide mb-3">What you get</p>
              <div className="space-y-2.5">
                {[
                  { icon: '🎯', text: '3 daily questions tailored to their age', color: '#FF6B6B' },
                  { icon: '🎙️', text: 'Preserve their voice before it changes', color: '#6BC5F8' },
                  { icon: '📅', text: 'Memories organized by date & calendar', color: '#C4A1FF' },
                  { icon: '📤', text: 'Download & share with family anytime', color: '#FFD93D' },
                  { icon: '🔒', text: '100% private — your data stays yours', color: '#A8E06C' },
                ].map((b, i) => (
                  <div key={b.text} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
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
                    <p className="font-inter text-xs text-echo-gray mt-0.5">$5/mo — billed $60/year · 7-day free trial</p>
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
                    <p className="font-inter text-xs text-echo-gray mt-0.5">Billed monthly · 3-day free trial</p>
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

            <div className="mt-auto space-y-3 pt-2">
              <button
                onClick={() => void handleSubscribe()}
                disabled={loading}
                className="w-full py-4 rounded-full bg-echo-coral text-white font-nunito font-extrabold text-base shadow-coral active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? 'Redirecting to checkout...' : selectedPlan === 'yearly' ? 'Start My 7-Day Free Trial' : 'Start My 3-Day Free Trial'}
              </button>

              <p className="font-inter text-xs text-echo-gray text-center">
                {selectedPlan === 'yearly' ? "You won't be charged for 7 days. Cancel anytime." : "You won't be charged for 3 days. Cancel anytime."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
