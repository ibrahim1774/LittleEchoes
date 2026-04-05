import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentChildIllustration } from '@/components/illustrations/ParentChildIllustration';

const TOTAL = 7;

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


export function OnboardingFlow3() {
  const [screen, setScreen] = useState(0);
  const [visible, setVisible] = useState(true);
  const [childName, setChildName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const navigate = useNavigate();

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

            {/* Name input */}
            <div className="space-y-2">
              <label className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                Their first name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Emma"
                className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray focus:border-echo-coral outline-none font-nunito text-base text-echo-charcoal dark:text-white placeholder:text-echo-gray/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Age selector */}
            <div className="space-y-2">
              <label className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                How old are they?
              </label>
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
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: opt.color + '22' }}
                    >
                      {opt.icon}
                    </div>
                    <p className="font-nunito font-semibold text-[15px] text-echo-charcoal dark:text-white leading-snug flex-1">
                      {opt.text}
                    </p>
                    {isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: opt.color }}
                      >
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

        {/* ── SCREEN 4: Product Preview (Carousel) ── */}
        {/* ── SCREENS 4–6: Feature Pages ── */}
        {screen >= 3 && screen <= 5 && (() => {
          const feat = FEATURES[screen - 3];
          if (!feat) return null;
          const stepNum = screen - 2; // 1, 2, 3
          return (
            <div className="flex flex-col items-center w-full gap-5 pt-2 flex-1">
              <p className="font-nunito font-bold text-xs text-echo-coral uppercase tracking-wider">
                Step {stepNum} of 3
              </p>
              <PhoneMockup src={feat.src} alt={feat.title} width={220} />
              <div className="text-center space-y-2 max-w-xs">
                <h1 className="font-nunito font-extrabold text-[22px] leading-tight text-echo-charcoal dark:text-white">
                  {feat.title}
                </h1>
                <p className="font-inter text-sm text-echo-gray leading-relaxed">
                  {feat.desc}
                </p>
              </div>
              <div className="mt-auto pt-3 w-full">
                <button
                  onClick={advance}
                  className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform"
                >
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
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform"
              >
                Get Started →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
