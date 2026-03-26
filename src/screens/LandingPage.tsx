import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Scroll reveal hooks ────────────────────────────────────

function useReveal(variant: 'up' | 'left' | 'right' | 'scale' = 'up') {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cls = variant === 'left' ? 'scroll-from-left'
      : variant === 'right' ? 'scroll-from-right'
      : variant === 'scale' ? 'scroll-scale-up'
      : 'scroll-hidden';
    el.classList.add(cls);
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.remove(cls);
        el.classList.add('scroll-visible');
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant]);
  return ref;
}

// ── Phone mockup component ─────────────────────────────────

function PhoneMockup({ src, alt, width = 260, className = '' }: { src: string; alt: string; width?: number; className?: string }) {
  return (
    <div
      className={`rounded-[40px] border-2 border-echo-light-gray shadow-soft overflow-hidden flex-shrink-0 ${className}`}
      style={{ width, aspectRatio: '1290/2386' }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  );
}

// ── FAQ data ───────────────────────────────────────────────

const FAQ = [
  { q: 'What ages is this for?', a: 'Ages 1\u201312. Questions adapt to five age groups. Toddler parents can use free-form recording for first words and early speech.' },
  { q: 'What if my child gives short answers?', a: 'Short answers are still worth recording. Even two words from a toddler is a memory. Most children open up once it becomes routine.' },
  { q: 'Do I have to use the daily questions?', a: 'No. There\u2019s a free-form recording option for capturing anything \u2014 a funny moment, a first word, a bedtime story.' },
  { q: 'Where are recordings stored?', a: 'In the cloud, organized by date. Accessible from any device by logging in. Recordings stay available as long as the account is active.' },
  { q: 'Can I download recordings?', a: 'Yes. Every recording can be downloaded as an audio file anytime.' },
  { q: 'Is my data used for anything?', a: 'No. No ads, no AI training, no data selling. Recordings belong to the account holder.' },
];

const PRICING_FEATURES = [
  'Unlimited children',
  '3 daily questions + free recording',
  'Cloud storage, any device',
  '\u2018Hear the Growth\u2019 playback',
  'Download recordings',
];

// ── Component ──────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());
  const heroCTARef = useRef<HTMLButtonElement>(null);

  // Sticky nav blur
  useEffect(() => {
    const container = document.querySelector('.min-h-screen.bg-echo-cream');
    if (!container) return;
    const onScroll = () => setScrolled(container.scrollTop > 10);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Sticky mobile CTA
  useEffect(() => {
    const el = heroCTARef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowStickyBar(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }, []);

  // Section refs with varied animations
  const heroRef = useReveal('up');
  const emotionalRef = useReveal('scale');
  const step1Ref = useReveal('left');
  const step2Ref = useReveal('right');
  const step3Ref = useReveal('scale');
  const featuresRef = useReveal('up');
  const showcaseRef = useReveal('scale');
  const storyRef = useReveal('up');
  const pricingRef = useReveal('up');
  const faqRef = useReveal('left');
  const finalRef = useReveal('scale');

  return (
    <div className="min-h-screen bg-echo-cream font-nunito overflow-y-auto relative">

      {/* ── S1: Nav ───────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 flex items-center justify-between px-5 h-14 transition-all ${scrolled ? 'backdrop-blur-md shadow-sm bg-echo-cream/80' : 'bg-echo-cream'}`}>
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <rect width="56" height="56" rx="16" fill="#FF6B6B" />
            <path d="M12 18a4 4 0 014-4h24a4 4 0 014 4v14a4 4 0 01-4 4H32l-4 6-4-6H16a4 4 0 01-4-4V18z" fill="white" />
            <path d="M28 24c0-2.2-3.5-3.5-3.5 0 0 2 3.5 4.5 3.5 4.5s3.5-2.5 3.5-4.5c0-3.5-3.5-2.2-3.5 0z" fill="#FF6B6B" />
          </svg>
          <span className="font-extrabold text-lg text-echo-charcoal tracking-tight">LittleEchoes</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/signin')} className="font-nunito text-sm font-semibold text-echo-charcoal border-2 border-echo-charcoal/20 px-4 py-1.5 rounded-full active:scale-95 transition-transform" aria-label="Sign in">
            Sign In
          </button>
          <button onClick={() => navigate('/pricing')} className="font-nunito text-sm font-extrabold text-white bg-echo-coral px-4 py-1.5 rounded-full active:scale-95 transition-transform" aria-label="Get started">
            Get Started
          </button>
        </div>
      </nav>

      {/* ── S2: Hero ──────────────────────────────────── */}
      <section ref={heroRef} className="px-5 pt-8 pb-6 text-center">
        <h1 className="font-extrabold text-3xl text-echo-charcoal leading-tight mb-3">
          Their voice is changing.<br />
          <span className="text-echo-coral">Are you capturing it?</span>
        </h1>
        <p className="font-nunito text-sm text-echo-gray mb-6">
          3 questions. 5 minutes. A lifetime of voice memories.
        </p>
        <button
          ref={heroCTARef}
          onClick={() => navigate('/pricing')}
          className="w-full max-w-xs mx-auto block py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral animate-cta-pulse active:scale-95 transition-transform mb-2"
          aria-label="Start capturing echoes"
        >
          Start Capturing Echoes
        </button>
        <p className="font-inter text-xs text-echo-gray mb-8">Cancel anytime</p>

        {/* Phone mockup with glow */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-echo-coral/10 blur-3xl" />
          </div>
          <div className="animate-phone-float relative">
            <PhoneMockup src="/IMG_3452.jpg" alt="LittleEchoes home screen showing daily questions and child profile" width={260} />
          </div>
        </div>
      </section>

      {/* ── S3: Emotional Hook ────────────────────────── */}
      <section ref={emotionalRef} className="bg-[#FFF5E6] px-5 py-12 text-center">
        <p className="font-bold text-xl text-echo-charcoal leading-snug max-w-[340px] mx-auto mb-3">
          You have thousands of photos. But when did you last save how they sound?
        </p>
        <p className="text-sm text-echo-gray">
          Their little voice won't sound like this forever.
        </p>
      </section>

      {/* ── S4: How It Works ──────────────────────────── */}
      <section className="py-16">
        <p className="font-inter font-medium text-xs text-echo-coral uppercase tracking-widest text-center mb-10">
          HOW IT WORKS
        </p>

        {/* Step 1 — text left, screenshot right */}
        <div ref={step1Ref} className="px-5 mb-12 flex items-center gap-5">
          <div className="flex-1 min-w-0">
            <span className="font-extrabold text-3xl text-echo-coral">1</span>
            <p className="font-bold text-base text-echo-charcoal mt-1">Pick your questions</p>
            <p className="text-sm text-echo-gray mt-1">3 fresh prompts, tailored by age.</p>
          </div>
          <PhoneMockup src="/IMG_3452.jpg" alt="Daily questions card" width={160} />
        </div>

        {/* Step 2 — screenshot left, text right */}
        <div ref={step2Ref} className="px-5 mb-12 flex items-center gap-5">
          <PhoneMockup src="/IMG_3456.jpg" alt="Active recording with waveform" width={160} />
          <div className="flex-1 min-w-0">
            <span className="font-extrabold text-3xl text-echo-coral">2</span>
            <p className="font-bold text-base text-echo-charcoal mt-1">Record their answer</p>
            <p className="text-sm text-echo-gray mt-1">One tap. Anywhere. Under 60 seconds.</p>
          </div>
        </div>

        {/* Step 3 — text centered, two overlapping screenshots */}
        <div ref={step3Ref} className="px-5 text-center">
          <span className="font-extrabold text-3xl text-echo-coral">3</span>
          <p className="font-bold text-base text-echo-charcoal mt-1">Relive the memory</p>
          <p className="text-sm text-echo-gray mt-1 mb-6">Browse by date. Hear how they've grown.</p>
          <div className="flex justify-center">
            <div className="relative" style={{ width: 320, height: 380 }}>
              <div className="absolute left-0 top-0">
                <PhoneMockup src="/IMG_3454.jpg" alt="Memories timeline view" width={170} />
              </div>
              <div className="absolute right-0 top-5">
                <PhoneMockup src="/IMG_3455.jpg" alt="Memories calendar view" width={170} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── S5: Feature Grid ──────────────────────────── */}
      <section ref={featuresRef} className="px-5 py-12">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-8">Everything you need</h2>
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          {[
            { icon: '💬', label: 'Daily questions' },
            { icon: '🎙️', label: 'Free-form recording' },
            { icon: '☁️', label: 'Cloud saved' },
            { icon: '🌱', label: 'Hear the growth' },
            { icon: '📥', label: 'Download anytime' },
            { icon: '🔒', label: 'Private & secure' },
          ].map((f, i) => (
            <div
              key={f.label}
              className="flex flex-col items-center text-center scroll-hidden"
              style={{ transitionDelay: `${i * 100}ms` }}
              ref={el => {
                if (!el) return;
                const obs = new IntersectionObserver(([e]) => {
                  if (e.isIntersecting) { el.classList.remove('scroll-hidden'); el.classList.add('scroll-visible'); obs.disconnect(); }
                }, { threshold: 0.1 });
                obs.observe(el);
              }}
            >
              <span className="text-3xl mb-2">{f.icon}</span>
              <span className="font-semibold text-sm text-echo-charcoal">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── S6: Recording Showcase ────────────────────── */}
      <section ref={showcaseRef} className="py-16 relative" style={{ backgroundColor: 'rgba(255,107,107,0.04)' }}>
        <div className="px-5 text-center">
          <h2 className="font-extrabold text-xl text-echo-charcoal mb-2">Record in seconds</h2>
          <p className="text-sm text-echo-gray mb-8">Ask the question. Tap record. Done.</p>
        </div>
        <div className="relative flex justify-center">
          {/* Decorative floating elements */}
          <svg className="absolute top-4 left-8 animate-float-slow opacity-15" width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M7 12h10" strokeWidth="2" stroke="#FF6B6B" fill="none" strokeLinecap="round" /></svg>
          <svg className="absolute top-12 right-10 animate-float-medium opacity-15" width="20" height="20" viewBox="0 0 24 24" fill="#FF6B6B" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="#FF6B6B" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          <svg className="absolute bottom-8 left-12 animate-float-medium opacity-10" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" fill="#FF6B6B" /></svg>

          <PhoneMockup src="/IMG_3453.jpg" alt="Question screen with record button" width={280} />
        </div>
      </section>

      {/* ── S7: Founder Story ─────────────────────────── */}
      <section ref={storyRef} className="bg-[#FFF5E6] px-5 py-10 text-center">
        <h2 className="font-extrabold text-xl text-echo-charcoal mb-4">Why LittleEchoes Exists</h2>
        <p className="text-sm text-echo-charcoal leading-[1.7] max-w-[360px] mx-auto">
          Most parents have thousands of photos but almost no recordings of their child's everyday voice. LittleEchoes started with a simple idea — make it easy to save those small, ordinary moments before they change. No complicated setup, no social sharing. Just a quiet space to collect the sounds of childhood.
        </p>
        <div className="flex justify-center mt-5">
          <svg width="20" height="18" viewBox="0 0 20 18" fill="#FF6B6B" aria-hidden="true">
            <path d="M10 18s-1-.5-2.4-1.6C3.4 13.2 0 9.7 0 6.2 0 2.8 2.7 0 6 0c1.8 0 3.2.8 4 2 .8-1.2 2.2-2 4-2 3.3 0 6 2.8 6 6.2 0 3.5-3.4 7-7.6 10.2C11 17.5 10 18 10 18z" />
          </svg>
        </div>
      </section>

      {/* ── S8: Privacy Strip ─────────────────────────── */}
      <section className="px-5 py-6">
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { icon: '🔒', text: 'Private cloud storage' },
            { icon: '🚫', text: 'No ads, no data selling' },
            { icon: '📥', text: 'Download your recordings' },
          ].map(item => (
            <div key={item.icon} className="flex items-center gap-1.5">
              <span className="text-base">{item.icon}</span>
              <span className="font-nunito text-xs text-echo-gray">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── S9: Pricing ───────────────────────────────── */}
      <section ref={pricingRef} className="px-5 py-16">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">Simple pricing</h2>
        <div className="space-y-4">
          {/* Monthly */}
          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <p className="font-bold text-sm text-echo-charcoal mb-2">Monthly</p>
            <p className="mb-3">
              <span className="font-extrabold text-2xl text-echo-charcoal">$10</span>
              <span className="font-inter text-sm text-echo-gray">/month</span>
            </p>
            <ul className="space-y-2 mb-4">
              {PRICING_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-echo-charcoal">
                  <span className="text-echo-coral font-bold flex-shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/pricing')} className="w-full py-3.5 rounded-full border-2 border-echo-coral text-echo-coral font-extrabold text-sm active:scale-95 transition-transform" aria-label="Get started monthly">
              Get Started
            </button>
          </div>

          {/* Yearly */}
          <div className="bg-white rounded-2xl shadow-soft border-t-4 border-echo-coral relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-echo-coral text-white font-inter font-medium text-xs px-2.5 py-1 rounded-full">Best Value</span>
            </div>
            <div className="p-4 pt-5">
              <p className="font-bold text-sm text-echo-charcoal mb-2">Yearly</p>
              <p className="mb-1">
                <span className="font-extrabold text-2xl text-echo-coral">$60</span>
                <span className="font-inter text-sm text-echo-gray">/year</span>
              </p>
              <p className="font-inter text-xs text-echo-gray mb-3">Save 50%</p>
              <ul className="space-y-2 mb-4">
                {[...PRICING_FEATURES, 'Locked-in pricing'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-echo-charcoal">
                    <span className="text-echo-coral font-bold flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/pricing')} className="w-full py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform" aria-label="Get started yearly best value">
                Get Started — Best Value
              </button>
              <p className="font-inter text-xs text-echo-gray text-center mt-3">Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── S10: FAQ ──────────────────────────────────── */}
      <section ref={faqRef} className="px-5 py-12">
        <h2 className="font-extrabold text-xl text-echo-charcoal text-center mb-6">Common questions</h2>
        <div className="divide-y divide-echo-light-gray">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button onClick={() => toggleFaq(i)} className="w-full flex items-center justify-between py-4 text-left" aria-expanded={openFaq.has(i)}>
                <span className="font-bold text-sm text-echo-charcoal pr-4">{item.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-echo-gray flex-shrink-0 transition-transform duration-200 ${openFaq.has(i) ? 'rotate-180' : ''}`} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq.has(i) ? '200px' : '0px', opacity: openFaq.has(i) ? 1 : 0 }}>
                <p className="text-sm text-echo-gray leading-relaxed pb-4">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S11: Final CTA ────────────────────────────── */}
      <section ref={finalRef} className="px-5 pt-16 pb-12 text-center">
        <p className="font-extrabold text-xl text-echo-charcoal mb-2">Their voice right now is worth saving.</p>
        <button onClick={() => navigate('/pricing')} className="w-full py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform mt-6 mb-4" aria-label="Get started">
          Get Started
        </button>
        <p className="font-inter text-xs text-echo-gray mb-8">
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} className="text-echo-coral font-semibold">Sign in</button>
        </p>
        <div className="flex justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <circle cx="30" cy="24" r="10" fill="#FF6B6B" />
            <rect x="22" y="36" width="16" height="24" rx="8" fill="#FF6B6B" />
            <circle cx="54" cy="32" r="7" fill="#FF6B6B" opacity="0.7" />
            <rect x="48" y="41" width="12" height="18" rx="6" fill="#FF6B6B" opacity="0.7" />
            <path d="M38 50c4 0 6 0 10 0" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ── S12: Footer ───────────────────────────────── */}
      <footer className="border-t border-echo-light-gray px-5 py-8 text-center">
        <p className="font-bold text-sm text-echo-charcoal mb-1">LittleEchoes</p>
        <p className="font-inter text-xs text-echo-gray mb-3">Made with care for families.</p>
        <p className="font-inter text-xs text-echo-gray mb-3">Privacy Policy · Terms · Contact</p>
        <p className="font-inter text-xs text-echo-gray">© 2026 LittleEchoes</p>
      </footer>

      {/* ── S13: Sticky Mobile CTA Bar ────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}
      >
        <div className="bg-white px-5 pt-3 pb-6 max-w-[480px] mx-auto" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
          <button onClick={() => navigate('/pricing')} className="w-full py-3.5 rounded-full bg-echo-coral text-white font-extrabold text-base active:scale-95 transition-transform" aria-label="Start capturing echoes">
            Start Capturing Echoes
          </button>
        </div>
      </div>

    </div>
  );
}
