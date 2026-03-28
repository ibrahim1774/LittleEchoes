import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentChildIllustration } from '@/components/illustrations/ParentChildIllustration';
import { MicrophoneHero } from '@/components/illustrations/MicrophoneHero';
import { CelebrationStars } from '@/components/illustrations/CelebrationStars';
import { RainbowArc } from '@/components/illustrations/RainbowArc';

const TOTAL = 12;

type StorySlide = {
  type: 'story';
  headline: string;
  sub: string;
  sub2?: string;
  illustration?: 'parent-child' | 'mic' | 'stars' | 'rainbow' | 'card' | 'timeline';
};

type QuestionSlide = {
  type: 'question';
  label: string;
  headline: string;
  options: { icon: string; text: string; color: string }[];
};

type PromiseSlide = {
  type: 'promise';
  headline: string;
  getSubtitle: (answers: Record<number, number>) => string;
};

type CTASlide = {
  type: 'cta';
  headline: string;
  sub: string;
  buttonText: string;
};

type GallerySlide = {
  type: 'gallery';
  headline: string;
  sub?: string;
  steps: { src: string; label: string }[];
};

type BenefitsSlide = {
  type: 'benefits';
  headline: string;
  sub: string;
  benefits: { icon: string; title: string; desc: string; color: string }[];
};

type Slide = StorySlide | QuestionSlide | PromiseSlide | CTASlide | GallerySlide | BenefitsSlide;

const CHALLENGE_SUBTITLES: Record<number, string> = {
  0: "We'll keep it quick — just 3 questions, about 5 minutes a day.",
  1: "No screens required. Just your voice and theirs.",
  2: "We'll give you the perfect questions every single day.",
  3: "Record any time — even the next morning over breakfast.",
};

const SLIDES: Slide[] = [
  {
    type: 'story',
    headline: 'Before the voice\nchanges...',
    sub: "There's something you should capture.",
    illustration: 'parent-child',
  },
  {
    type: 'story',
    headline: "They're only this\nlittle once.",
    sub: 'Every year, a little of the magic slips away.',
    sub2: 'The mispronounced words. The wild stories. The way they see everything as new.',
    illustration: 'rainbow',
  },
  {
    type: 'story',
    headline: 'What would you give\nto hear their voice...',
    sub: '...exactly as it sounds today...',
    sub2: '...five years from now?',
    illustration: 'stars',
  },
  {
    type: 'question',
    label: 'About your family',
    headline: 'Tell us about your little one.',
    options: [
      { icon: '👶', text: 'My little one is under 5', color: '#FF8FAB' },
      { icon: '🎒', text: 'They just started school', color: '#6BC5F8' },
      { icon: '🏃', text: 'My child is 7–12 years old', color: '#A8E06C' },
      { icon: '👨‍👩‍👧‍👦', text: 'I have multiple children', color: '#C4A1FF' },
    ],
  },
  {
    type: 'question',
    label: 'What matters most',
    headline: 'What moment do you most\nfear forgetting?',
    options: [
      { icon: '🗣️', text: 'The way they mispronounce words', color: '#FF6B6B' },
      { icon: '😂', text: 'Their laugh and silly stories', color: '#FFD93D' },
      { icon: '🤔', text: 'How they see the world right now', color: '#6BC5F8' },
      { icon: '💬', text: 'Their unfiltered, honest opinions', color: '#C4A1FF' },
    ],
  },
  {
    type: 'question',
    label: 'Your reality',
    headline: 'What gets in the way\nof connecting?',
    options: [
      { icon: '⏰', text: 'Not enough hours in the day', color: '#FF6B6B' },
      { icon: '📱', text: 'Too many distractions', color: '#6BC5F8' },
      { icon: '🤷', text: "I don't know what to ask", color: '#FFD93D' },
      { icon: '😴', text: "I'm exhausted by bedtime", color: '#C4A1FF' },
    ],
  },
  {
    type: 'question',
    label: 'Your dream',
    headline: '15 years from now,\nwhat do you hope for?',
    options: [
      { icon: '🎵', text: 'I can play back their little voice', color: '#FF6B6B' },
      { icon: '📖', text: 'They know I was always listening', color: '#6BC5F8' },
      { icon: '🌱', text: "I can see how much they've grown", color: '#A8E06C' },
      { icon: '❤️', text: 'They felt truly seen and loved', color: '#FF8FAB' },
    ],
  },
  {
    type: 'promise',
    headline: 'LittleEchoes was made\nfor exactly this.',
    getSubtitle: (answers) => {
      const challengeAnswer = answers[5];
      return CHALLENGE_SUBTITLES[challengeAnswer] ?? "We'll be right there with you, every single day.";
    },
  },
  {
    type: 'gallery',
    headline: "Here's how it works.",
    steps: [
      { src: '/IMG_3452.jpg', label: 'Pick from daily questions' },
      { src: '/IMG_3456.jpg', label: 'Press record, let them talk' },
      { src: '/IMG_3454.jpg', label: 'Relive it all in Memories' },
    ],
  },
  {
    type: 'gallery',
    headline: 'Every voice. Every word.\nSaved forever.',
    sub: "Imagine hearing their 4-year-old voice when they're 14.\nThat's what you're building.",
    steps: [
      { src: '/IMG_3453.jpg', label: 'Record their answers' },
      { src: '/IMG_3455.jpg', label: 'Browse by date' },
      { src: '/IMG_3457.png', label: 'Watch their voice grow' },
    ],
  },
  {
    type: 'benefits',
    headline: 'Built for real parents,\nreal life.',
    sub: "You can't pause childhood.\nBut you can press record.",
    benefits: [
      { icon: '⏱️', title: '5 minutes a day', desc: 'No prep, no pressure — just press record', color: '#FF6B6B' },
      { icon: '🎙️', title: 'Their voice, preserved', desc: 'Before it changes forever', color: '#6BC5F8' },
      { icon: '🌱', title: 'Voice growth timeline', desc: 'Hear how they change week by week, month by month', color: '#A8E06C' },
      { icon: '🔒', title: '100% private', desc: "Your family's memories, nobody else's", color: '#C4A1FF' },
    ],
  },
  {
    type: 'cta',
    headline: "You're already doing\nsomething extraordinary.",
    sub: "Just by being here, you're choosing to remember. That's what great parents do.",
    buttonText: "I'm Ready ✨",
  },
];

// Inline SVG: stylized question card
function QuestionCardIllustration() {
  return (
    <svg viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[260px]">
      <rect x="10" y="10" width="240" height="140" rx="20" fill="white" />
      <rect x="10" y="10" width="240" height="140" rx="20" stroke="#FFD93D" strokeWidth="2.5" />
      <circle cx="38" cy="45" r="10" fill="#FF6B6B" fillOpacity="0.2" />
      <rect x="55" y="38" width="120" height="8" rx="4" fill="#FF6B6B" fillOpacity="0.4" />
      <rect x="30" y="68" width="200" height="6" rx="3" fill="#2D2D2D" fillOpacity="0.15" />
      <rect x="30" y="82" width="160" height="6" rx="3" fill="#2D2D2D" fillOpacity="0.1" />
      <rect x="30" y="96" width="180" height="6" rx="3" fill="#2D2D2D" fillOpacity="0.1" />
      <circle cx="38" cy="128" r="8" fill="#A8E06C" fillOpacity="0.35" />
      <circle cx="58" cy="128" r="8" fill="#F0F0F0" />
      <circle cx="78" cy="128" r="8" fill="#F0F0F0" />
      <rect x="120" y="120" width="110" height="16" rx="8" fill="#FF6B6B" fillOpacity="0.15" />
    </svg>
  );
}

// Inline SVG: timeline showing growth dots
function TimelineIllustration() {
  return (
    <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px]">
      <line x1="30" y1="55" x2="250" y2="55" stroke="#F0F0F0" strokeWidth="3" strokeLinecap="round" />
      {/* Dot 1 - age 4 */}
      <circle cx="50" cy="55" r="14" fill="#FF6B6B" />
      <text x="50" y="60" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">4</text>
      <text x="50" y="85" textAnchor="middle" fontSize="9" fill="#8E8E93">Age 4</text>
      {/* Dot 2 - age 6 */}
      <circle cx="120" cy="55" r="14" fill="#6BC5F8" />
      <text x="120" y="60" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">6</text>
      <text x="120" y="85" textAnchor="middle" fontSize="9" fill="#8E8E93">Age 6</text>
      {/* Dot 3 - age 9 */}
      <circle cx="190" cy="55" r="14" fill="#C4A1FF" />
      <text x="190" y="60" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">9</text>
      <text x="190" y="85" textAnchor="middle" fontSize="9" fill="#8E8E93">Age 9</text>
      {/* Dot 4 - future */}
      <circle cx="248" cy="55" r="14" fill="#F0F0F0" stroke="#FFD93D" strokeWidth="2.5" strokeDasharray="3 2" />
      <text x="248" y="60" textAnchor="middle" fontSize="14" fill="#FFD93D">?</text>
      {/* Sound wave emoji above center */}
      <text x="140" y="30" textAnchor="middle" fontSize="18">🎵</text>
    </svg>
  );
}

function PhoneMockup({ src, alt, width = 140 }: { src: string; alt: string; width?: number }) {
  return (
    <div
      className="rounded-[24px] border-2 border-echo-light-gray shadow-soft overflow-hidden bg-white"
      style={{ width }}
    >
      <img src={src} alt={alt} className="w-full h-auto object-contain" loading="lazy" />
    </div>
  );
}

function renderIllustration(type: StorySlide['illustration']) {
  switch (type) {
    case 'parent-child': return <div className="w-full flex justify-center mb-2"><ParentChildIllustration /></div>;
    case 'rainbow': return <div className="w-full flex justify-center mb-2"><RainbowArc /></div>;
    case 'stars': return <div className="w-full flex justify-center mb-2"><CelebrationStars /></div>;
    case 'mic': return <div className="w-full flex justify-center mb-2"><MicrophoneHero /></div>;
    case 'card': return <div className="w-full flex justify-center mb-2"><QuestionCardIllustration /></div>;
    case 'timeline': return <div className="w-full flex justify-center mb-2"><TimelineIllustration /></div>;
    default: return null;
  }
}

export function OnboardingFlow({ pricingPath = '/pricing' }: { pricingPath?: string } = {}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const slide = SLIDES[currentSlide];
  const progress = currentSlide / (TOTAL - 1);
  const isStoryOrPromise = slide.type === 'story' || slide.type === 'promise' || slide.type === 'gallery' || slide.type === 'benefits';
  const showSkip = currentSlide < 7;

  useEffect(() => {
    setTapHintVisible(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (isStoryOrPromise) {
      hintTimerRef.current = setTimeout(() => setTapHintVisible(true), 1600);
    }
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [currentSlide, isStoryOrPromise]);

  function advance() {
    if (isTransitioning || currentSlide >= TOTAL - 1) return;
    setIsTransitioning(true);
    setVisible(false);
    setTimeout(() => {
      setCurrentSlide((c) => c + 1);
      setSelectedOption(null);
      setVisible(true);
      setTimeout(() => setIsTransitioning(false), 350);
    }, 210);
  }

  function handleScreenTap() {
    if (isStoryOrPromise) advance();
  }

  function handleOptionSelect(optionIndex: number) {
    if (selectedOption !== null || isTransitioning) return;
    setSelectedOption(optionIndex);
    setAnswers((prev) => ({ ...prev, [currentSlide]: optionIndex }));
    setTimeout(() => advance(), 400);
  }

  return (
    <div
      className="relative min-h-screen bg-echo-cream dark:bg-echo-dark-bg overflow-hidden select-none"
      onClick={isStoryOrPromise ? handleScreenTap : undefined}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-echo-light-gray z-20">
        <div
          className="h-full bg-echo-coral transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Slide counter */}
      <span className="absolute top-5 left-5 z-20 font-inter text-xs text-echo-gray">
        {currentSlide + 1} / {TOTAL}
      </span>

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(pricingPath); }}
          className="absolute top-4 right-4 z-20 font-nunito text-sm text-echo-gray px-3 py-1 rounded-full hover:bg-echo-light-gray/50 transition-colors"
        >
          Skip
        </button>
      )}

      {/* Animated slide content */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(16px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
        className="min-h-screen flex flex-col items-center px-7 pt-16 pb-28"
      >
        {/* ── STORY SLIDE ── */}
        {slide.type === 'story' && (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-5">
            {slide.illustration && renderIllustration(slide.illustration)}

            <div className="text-center space-y-3 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[28px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h1>
              <p className="font-nunito text-base text-echo-gray leading-relaxed">
                {slide.sub}
              </p>
              {slide.sub2 && (
                <p className="font-nunito text-sm text-echo-gray leading-relaxed italic">
                  {slide.sub2}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── PROMISE SLIDE ── */}
        {slide.type === 'promise' && (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-6">
            <div className="w-32 h-32 rounded-full bg-echo-coral/10 flex items-center justify-center">
              <span className="text-5xl">🌟</span>
            </div>

            <div className="text-center space-y-4 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[26px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h1>
              <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-5 shadow-soft">
                <p className="font-nunito text-base text-echo-charcoal dark:text-white leading-relaxed font-semibold">
                  {slide.getSubtitle(answers)}
                </p>
              </div>
              <p className="font-nunito text-sm text-echo-gray leading-relaxed">
                Every day, a little closer to the memories you'll treasure forever.
              </p>
            </div>
          </div>
        )}

        {/* ── GALLERY SLIDE ── */}
        {slide.type === 'gallery' && (
          <div className="flex flex-col items-center w-full gap-5 pt-2">
            <div className="text-center space-y-2 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[26px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h1>
              {slide.sub && (
                <p className="font-nunito text-sm text-echo-gray leading-relaxed whitespace-pre-line">
                  {slide.sub}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 pb-3 px-2 w-full">
              {slide.steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2" style={{ width: slide.steps.length > 2 ? 130 : 150 }}>
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-echo-coral flex items-center justify-center z-10 shadow-sm">
                      <span className="font-nunito font-bold text-xs text-white">{i + 1}</span>
                    </div>
                    <PhoneMockup src={step.src} alt={step.label} width={slide.steps.length > 2 ? 130 : 150} />
                  </div>
                  <p className="font-nunito font-semibold text-xs text-echo-charcoal dark:text-white text-center max-w-[130px] leading-snug">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BENEFITS SLIDE ── */}
        {slide.type === 'benefits' && (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-5">
            <div className="text-center space-y-2 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[26px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {slide.benefits.map((b, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft flex flex-col gap-2"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: b.color + '20' }}
                  >
                    {b.icon}
                  </div>
                  <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white leading-snug">
                    {b.title}
                  </p>
                  <p className="font-inter text-xs text-echo-gray leading-snug">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            <p className="font-nunito text-sm text-echo-gray leading-relaxed text-center italic whitespace-pre-line max-w-xs">
              {slide.sub}
            </p>
          </div>
        )}

        {/* ── QUESTION SLIDE ── */}
        {slide.type === 'question' && (
          <div className="flex flex-col w-full gap-5 pt-4">
            <div className="space-y-1">
              <p className="font-nunito text-xs font-bold uppercase tracking-widest text-echo-coral">
                {slide.label}
              </p>
              <h2 className="font-nunito font-extrabold text-[22px] leading-snug text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h2>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {slide.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isDimmed = selectedOption !== null && selectedOption !== i;
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); handleOptionSelect(i); }}
                    style={{
                      borderColor: isSelected ? opt.color : 'transparent',
                      transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                      opacity: isDimmed ? 0.4 : 1,
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

        {/* ── CTA SLIDE ── */}
        {slide.type === 'cta' && (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-6">
            <ParentChildIllustration />

            <div className="text-center space-y-4 max-w-xs">
              <h1 className="font-nunito font-extrabold text-[26px] leading-tight text-echo-charcoal dark:text-white whitespace-pre-line">
                {slide.headline}
              </h1>
              <p className="font-nunito text-base text-echo-gray leading-relaxed">
                {slide.sub}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate(pricingPath); }}
              className="w-full bg-echo-coral text-white font-nunito font-bold text-lg py-4 rounded-full shadow-coral active:scale-95 transition-transform mt-2"
            >
              {slide.buttonText}
            </button>

            <p className="font-inter text-xs text-echo-gray text-center">
              All data stays on your device. No account required.
            </p>
          </div>
        )}
      </div>

      {/* Tap-to-continue hint (story + promise slides only) */}
      {isStoryOrPromise && (
        <div
          className="absolute bottom-[8%] left-0 right-0 flex justify-center pointer-events-none z-10"
          style={{ opacity: tapHintVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}
        >
          <div className="flex items-center gap-2 bg-echo-charcoal/75 dark:bg-white/20 px-5 py-2.5 rounded-full">
            <span className="text-base">👆</span>
            <p className="font-nunito font-semibold text-sm text-white">Tap to continue</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function OnboardingFlow2() {
  return <OnboardingFlow pricingPath="/pricing-2" />;
}
