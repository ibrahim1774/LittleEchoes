import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Data ───────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '💬',
    title: 'Thoughtful daily questions',
    body: 'Each day, the app selects 3 questions from a curated bank of 50+, tailored to your child\u2019s age group (1\u20132, 3\u20134, 5\u20136, 7\u20139, or 10\u201312). Questions cover five categories: favorites, challenges, emotions, learning, and gratitude.',
  },
  {
    icon: '🎙️',
    title: 'Free-form recording',
    body: 'Not every moment needs a question. Parents can open LittleEchoes anytime and record a free-form voice memory \u2014 a funny thing their child just said, a first word, a bedtime story, anything worth saving.',
  },
  {
    icon: '☁️',
    title: 'Cloud-saved & organized',
    body: 'All recordings are saved to the cloud and organized by date. Parents can access their full library of voice memories from any device, anytime. Nothing is lost if a phone is replaced or reset.',
  },
  {
    icon: '🌱',
    title: '\u2018Hear the Growth\u2019 playback',
    body: 'Select any question and play back every answer a child has given to it, in chronological order. Hear the same question answered at age 2, then 4, then 6. The recordings play sequentially so changes over time are easy to hear.',
  },
  {
    icon: '📥',
    title: 'Download your recordings',
    body: 'Every recording can be downloaded as an audio file. Parents own their memories and can save them, share them with family, or keep a personal backup anytime.',
  },
];

const SAMPLE_QUESTIONS = [
  { text: 'What made you laugh really hard today?', category: 'Favorites & Fun' },
  { text: 'Was there a moment you felt really brave?', category: 'Challenges & Growth' },
  { text: 'Who made you smile today?', category: 'Emotions & Relationships' },
  { text: 'If you could teach me one thing from today, what would it be?', category: 'Learning & Wonder' },
  { text: 'If today were a color, what color would it be? Why?', category: 'Gratitude & Reflection' },
];

const STEPS = [
  { num: '1', title: 'Open & ask', desc: 'Each day, LittleEchoes presents 3 age-appropriate questions designed to spark real conversation with your child. Or skip the questions and record a free-form voice memory anytime.' },
  { num: '2', title: 'Tap & record', desc: 'Ask the question out loud and record your child\u2019s answer. Works anywhere \u2014 the car, dinner table, bedtime. One tap to start, one tap to stop.' },
  { num: '3', title: 'Save & replay', desc: 'Every recording is saved to the cloud and organized by date. Come back anytime, from any device, to hear how they\u2019ve changed.' },
];

const PRIVACY_ITEMS = [
  { icon: '🔒', text: 'All recordings are saved to a private cloud account. Only the account holder can access them.' },
  { icon: '🚫', text: 'LittleEchoes does not sell data, serve ads, or use recordings for any purpose beyond providing the service.' },
  { icon: '📥', text: 'Recordings can be downloaded at any time. Parents maintain full ownership of their family\u2019s voice memories.' },
];

const MONTHLY_FEATURES = [
  'Unlimited child profiles',
  '3 daily questions + free-form recording',
  'Full question library (50+ questions, ages 1\u201312)',
  'Cloud storage & access from any device',
  '\u2018Hear the Growth\u2019 playback',
  'Download recordings anytime',
  'Custom questions',
];

const FAQ_ITEMS = [
  {
    q: 'What ages is LittleEchoes designed for?',
    a: 'The question bank covers five age groups: 1\u20132, 3\u20134, 5\u20136, 7\u20139, and 10\u201312. The app adjusts which questions are shown based on the child\u2019s age. Younger children get simpler, more concrete questions. Older children get questions that invite more reflection. Parents of toddlers can also use the free-form recording feature to capture first words, sounds, and early speech.',
  },
  {
    q: 'What if my child gives short answers or doesn\u2019t want to talk?',
    a: 'That\u2019s completely normal, especially in the beginning. Short answers are still worth recording \u2014 even a two-word answer from a toddler is a memory worth having. Many children open up more once the questions become a familiar routine. The questions are designed to be low-pressure and open-ended.',
  },
  {
    q: 'Do I have to use the daily questions?',
    a: 'No. LittleEchoes includes a free-form recording option for anytime voice memories \u2014 a funny thing a child just said, a first word, a bedtime conversation, anything. The daily questions are there to help spark conversation, but they\u2019re completely optional.',
  },
  {
    q: 'Where are my recordings stored?',
    a: 'All recordings are saved to the cloud and organized by date. Parents can access their full library from any device by logging into their account. Recordings remain available as long as the account is active.',
  },
  {
    q: 'Can I download my recordings?',
    a: 'Yes. Every recording can be downloaded as an audio file at any time. Parents have full ownership of their family\u2019s voice memories.',
  },
  {
    q: 'Can both parents use the app?',
    a: 'Family sharing for multiple parent accounts is on the roadmap but not yet available. Currently, one parent account manages the recordings. Shared family access is planned for a future update.',
  },
  {
    q: 'Is my family\u2019s data used for anything?',
    a: 'No. Recordings, transcriptions, and profile information belong to the account holder. LittleEchoes does not use family data for advertising, AI model training, or any purpose other than providing the app\u2019s features. There are no ads in the app.',
  },
];

// ── Scroll reveal hook ─────────────────────────────────────

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('scroll-hidden');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('scroll-hidden');
          el.classList.add('scroll-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// ── Component ──────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());
  const heroCTARef = useRef<HTMLButtonElement>(null);

  // Sticky nav blur on scroll
  useEffect(() => {
    const container = document.querySelector('.min-h-screen.bg-echo-cream');
    if (!container) return;

    function onScroll() {
      setScrolled(container!.scrollTop > 10);
    }
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Sticky mobile CTA bar — show when hero CTA is out of view
  useEffect(() => {
    const el = heroCTARef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // Section refs
  const heroRef = useScrollReveal();
  const emotionalRef = useScrollReveal();
  const howRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const questionsRef = useScrollReveal();
  const storyRef = useScrollReveal();
  const privacyRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const finalRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-echo-cream font-nunito overflow-y-auto relative">

      {/* ── S1: Nav ─────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 flex items-center justify-between px-5 h-14 transition-all ${
          scrolled ? 'backdrop-blur-md shadow-sm bg-echo-cream/80' : 'bg-echo-cream'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <rect width="56" height="56" rx="16" fill="#FF6B6B" />
            <path d="M12 18a4 4 0 014-4h24a4 4 0 014 4v14a4 4 0 01-4 4H32l-4 6-4-6H16a4 4 0 01-4-4V18z" fill="white" />
            <path d="M28 24c0-2.2-3.5-3.5-3.5 0 0 2 3.5 4.5 3.5 4.5s3.5-2.5 3.5-4.5c0-3.5-3.5-2.2-3.5 0z" fill="#FF6B6B" />
          </svg>
          <span className="font-extrabold text-lg text-echo-charcoal tracking-tight">LittleEchoes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/signin')}
            className="font-nunito text-sm font-semibold text-echo-charcoal border-2 border-echo-charcoal/20 px-4 py-1.5 rounded-full active:scale-95 transition-transform"
            aria-label="Sign in to your account"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="font-nunito text-sm font-extrabold text-white bg-echo-coral px-4 py-1.5 rounded-full active:scale-95 transition-transform"
            aria-label="Get started with LittleEchoes"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── S2: Hero ────────────────────────────────────── */}
      <section ref={heroRef} className="px-5 pt-10 pb-10 text-center">
        {/* Mic SVG with sound waves */}
        <div className="flex justify-center mb-4">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-float" aria-hidden="true">
            <rect x="26" y="12" width="20" height="32" rx="10" fill="#FF6B6B" />
            <path d="M20 36c0 8.84 7.16 16 16 16s16-7.16 16-16" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" fill="none" />
            <line x1="36" y1="52" x2="36" y2="60" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="60" x2="44" y2="60" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
            {/* Sound waves */}
            <path d="M54 28c2.5 3 2.5 8 0 11" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M60 24c4 5 4 14 0 19" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" />
          </svg>
        </div>

        <h1 className="font-extrabold text-3xl text-echo-charcoal leading-tight mb-3">
          Their voice is changing.<br />
          <span className="text-echo-coral">Are you capturing it?</span>
        </h1>
        <p className="font-inter text-echo-gray text-sm leading-relaxed mb-8 max-w-[340px] mx-auto">
          LittleEchoes gives you 3 meaningful questions to ask your child each day — and saves their spoken answers as audio memories in the cloud, organized by date, so you can replay them anytime as they grow.
        </p>
        <button
          ref={heroCTARef}
          onClick={() => navigate('/pricing')}
          className="w-full max-w-xs mx-auto block py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral animate-cta-pulse active:scale-95 transition-transform mb-3"
          aria-label="Start capturing echoes"
        >
          Start Capturing Echoes
        </button>
        <p className="font-inter text-xs text-echo-gray">
          Plans start at $10/month · Cancel anytime
        </p>
      </section>

      {/* ── S3: Emotional Hook ──────────────────────────── */}
      <section ref={emotionalRef} className="bg-[#FFF5E6] px-5 py-12 text-center">
        <p className="font-nunito font-bold text-xl text-echo-charcoal leading-snug max-w-[360px] mx-auto mb-4">
          You have thousands of photos. But when did you last save how they sound?
        </p>
        <p className="font-nunito text-sm text-echo-gray leading-relaxed max-w-[340px] mx-auto">
          Children's voices change constantly. The way your child talks, laughs, and explains their world right now is something you'll never hear again once it's gone — unless you save it.
        </p>
      </section>

      {/* ── S4: How It Works ────────────────────────────── */}
      <section ref={howRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-2">How It Works</h2>
        <p className="font-inter text-sm text-echo-gray text-center mb-8">
          A simple daily ritual that takes less than 5 minutes.
        </p>
        <div className="space-y-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center">
              {/* Connector line (above, except first) */}
              {i > 0 && <div className="w-0.5 h-6 border-l-2 border-dashed border-echo-light-gray" />}
              {/* Circle */}
              <div className="w-12 h-12 rounded-full bg-echo-coral text-white font-extrabold text-base flex items-center justify-center flex-shrink-0">
                {s.num}
              </div>
              <p className="font-bold text-sm text-echo-charcoal mt-3 mb-1">{s.title}</p>
              <p className="font-nunito text-sm text-echo-gray leading-relaxed max-w-[300px] mb-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── S5: Features ────────────────────────────────── */}
      <section ref={featuresRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">What LittleEchoes Does</h2>
        <div className="space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-4 shadow-soft flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-echo-cream flex items-center justify-center text-xl flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-echo-charcoal">{f.title}</p>
                <p className="font-inter text-sm text-echo-gray mt-0.5 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S6: Sample Questions ─────────────────────────── */}
      <section ref={questionsRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-2">
          The kind of questions you'll ask
        </h2>
        <p className="font-inter text-sm text-echo-gray text-center mb-6 max-w-[340px] mx-auto">
          Every question is designed to go beyond "How was your day?" — and help your child actually tell you about it.
        </p>
        <div className="space-y-3">
          {SAMPLE_QUESTIONS.map((sq) => (
            <div key={sq.text} className="bg-white rounded-xl p-4 shadow-soft flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-echo-coral flex-shrink-0 mt-1.5" />
              <div>
                <p className="font-semibold text-sm text-echo-charcoal leading-snug">{sq.text}</p>
                <p className="font-inter text-xs text-echo-gray mt-1">{sq.category}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="font-inter text-xs text-echo-gray text-center mt-4">
          50+ starter questions included across all age groups, with new packs planned.
        </p>
      </section>

      {/* ── S7: Founder Story ────────────────────────────── */}
      <section ref={storyRef} className="bg-[#FFF5E6] px-5 py-12">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">Why LittleEchoes Exists</h2>
        <div className="max-w-[380px] mx-auto space-y-4 text-sm text-echo-charcoal leading-[1.7]">
          <p>
            Most parents have thousands of photos and videos of their children. But almost none have recordings of the everyday conversations — the silly answers at dinner, the thoughtful observations at bedtime, the way a two-year-old says their favorite word.
          </p>
          <p>
            LittleEchoes started with a simple realization: those small, ordinary moments are the ones parents miss most as their children grow. Not the birthdays or holidays — but the random Tuesday when a child said something that made everyone laugh or think.
          </p>
          <p>
            The idea is straightforward. Give parents a reason to ask better questions, make it easy to record the answers, and save everything to the cloud so it's organized and easy to find later. No complicated setup, no social sharing, no algorithms. Just a quiet, private space to collect the sounds of childhood before they change.
          </p>
          <p>That's what LittleEchoes is for.</p>
        </div>
        {/* Decorative heart */}
        <div className="flex justify-center mt-6">
          <svg width="20" height="18" viewBox="0 0 20 18" fill="#FF6B6B" aria-hidden="true">
            <path d="M10 18s-1-.5-2.4-1.6C3.4 13.2 0 9.7 0 6.2 0 2.8 2.7 0 6 0c1.8 0 3.2.8 4 2 .8-1.2 2.2-2 4-2 3.3 0 6 2.8 6 6.2 0 3.5-3.4 7-7.6 10.2C11 17.5 10 18 10 18z" />
          </svg>
        </div>
      </section>

      {/* ── S8: Privacy ──────────────────────────────────── */}
      <section ref={privacyRef} className="px-5 py-12">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">Private by default</h2>
        <div className="space-y-4 max-w-[380px] mx-auto">
          {PRIVACY_ITEMS.map((item) => (
            <div key={item.icon} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-echo-charcoal leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── S9: Pricing ──────────────────────────────────── */}
      <section ref={pricingRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-2">Simple pricing</h2>
        <p className="font-inter text-sm text-echo-gray text-center mb-6">
          Choose the plan that works for your family.
        </p>
        <div className="space-y-4">
          {/* Monthly */}
          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <p className="font-bold text-sm text-echo-charcoal mb-2">Monthly</p>
            <p className="mb-3">
              <span className="font-extrabold text-2xl text-echo-charcoal">$10</span>
              <span className="font-inter text-sm text-echo-gray">/month</span>
            </p>
            <ul className="space-y-2 mb-4">
              {MONTHLY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-echo-charcoal">
                  <span className="text-echo-coral font-bold flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3.5 rounded-full border-2 border-echo-coral text-echo-coral font-extrabold text-sm active:scale-95 transition-transform"
              aria-label="Get started with monthly plan"
            >
              Get Started
            </button>
          </div>

          {/* Yearly */}
          <div className="bg-white rounded-2xl shadow-soft border-t-4 border-echo-coral relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-echo-coral text-white font-inter font-medium text-xs px-2.5 py-1 rounded-full">
                Best Value
              </span>
            </div>
            <div className="p-4 pt-5">
              <p className="font-bold text-sm text-echo-charcoal mb-2">Yearly</p>
              <p className="mb-1">
                <span className="font-extrabold text-2xl text-echo-coral">$79</span>
                <span className="font-inter text-sm text-echo-gray">/year</span>
              </p>
              <p className="font-inter text-xs text-echo-gray mb-3">
                That's $6.58/month — save 34%
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-sm text-echo-charcoal">
                  <span className="text-echo-coral font-bold flex-shrink-0">✓</span>
                  Everything in Monthly
                </li>
                <li className="flex items-start gap-2 text-sm text-echo-charcoal">
                  <span className="text-echo-coral font-bold flex-shrink-0">✓</span>
                  Locked-in pricing
                </li>
              </ul>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform"
                aria-label="Get started with yearly plan — best value"
              >
                Get Started — Best Value
              </button>
              <p className="font-inter text-xs text-echo-gray text-center mt-3">Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── S10: FAQ ─────────────────────────────────────── */}
      <section ref={faqRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">Common questions</h2>
        <div className="divide-y divide-echo-light-gray">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between py-4 text-left"
                aria-expanded={openFaq.has(i)}
              >
                <span className="font-bold text-sm text-echo-charcoal pr-4">{item.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-echo-gray flex-shrink-0 transition-transform duration-200 ${openFaq.has(i) ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: openFaq.has(i) ? '300px' : '0px',
                  opacity: openFaq.has(i) ? 1 : 0,
                }}
              >
                <p className="text-sm text-echo-gray leading-relaxed pb-4">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S11: Final CTA ───────────────────────────────── */}
      <section ref={finalRef} className="px-5 pt-16 pb-12 text-center">
        <p className="font-extrabold text-xl text-echo-charcoal mb-2">
          Their voice right now is worth saving.
        </p>
        <p className="font-inter text-sm text-echo-gray mb-6">
          Start recording today. It only takes a few minutes.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="w-full py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform mb-4"
          aria-label="Get started with LittleEchoes"
        >
          Get Started
        </button>
        <p className="font-inter text-xs text-echo-gray mb-8">
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} className="text-echo-coral font-semibold">
            Sign in
          </button>
        </p>
        {/* Parent & child illustration */}
        <div className="flex justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            {/* Parent */}
            <circle cx="30" cy="24" r="10" fill="#FF6B6B" />
            <rect x="22" y="36" width="16" height="24" rx="8" fill="#FF6B6B" />
            {/* Child */}
            <circle cx="54" cy="32" r="7" fill="#FF6B6B" opacity="0.7" />
            <rect x="48" y="41" width="12" height="18" rx="6" fill="#FF6B6B" opacity="0.7" />
            {/* Holding hands */}
            <path d="M38 50c4 0 6 0 10 0" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ── S12: Footer ──────────────────────────────────── */}
      <footer className="border-t border-echo-light-gray px-5 py-8 text-center">
        <p className="font-bold text-sm text-echo-charcoal mb-1">LittleEchoes</p>
        <p className="font-inter text-xs text-echo-gray mb-3">Made with care for families.</p>
        <p className="font-inter text-xs text-echo-gray mb-3">
          Privacy Policy · Terms · Contact
        </p>
        <p className="font-inter text-xs text-echo-gray">© 2026 LittleEchoes</p>
      </footer>

      {/* ── S13: Sticky Mobile CTA Bar ───────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}
      >
        <div className="bg-white px-5 py-3 pb-safe max-w-[480px] mx-auto">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3.5 rounded-full bg-echo-coral text-white font-extrabold text-base active:scale-95 transition-transform"
            aria-label="Start capturing echoes"
          >
            Start Capturing Echoes
          </button>
        </div>
      </div>

    </div>
  );
}
