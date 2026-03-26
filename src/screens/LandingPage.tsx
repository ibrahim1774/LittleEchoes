import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎙️',
    title: 'Preserve their voice',
    body: 'Capture exactly how they sound right now — their laugh, their wonder, their words.',
  },
  {
    icon: '📈',
    title: 'Watch them grow',
    body: 'Hear how their answers change from age 4 to 12. Nothing else gives you that.',
  },
  {
    icon: '🔒',
    title: 'Private & safe',
    body: 'Stored on your device and your private cloud. Never shared, never sold.',
  },
];

const STEPS = [
  { num: '1', text: 'Answer 3 daily questions together' },
  { num: '2', text: 'Record in under 5 minutes' },
  { num: '3', text: 'Relive the memory — forever' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-echo-cream font-nunito overflow-y-auto">

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#FF6B6B" />
            <path d="M12 18a4 4 0 014-4h24a4 4 0 014 4v14a4 4 0 01-4 4H32l-4 6-4-6H16a4 4 0 01-4-4V18z" fill="white" />
            <path d="M28 24c0-2.2-3.5-3.5-3.5 0 0 2 3.5 4.5 3.5 4.5s3.5-2.5 3.5-4.5c0-3.5-3.5-2.2-3.5 0z" fill="#FF6B6B" />
          </svg>
          <span className="font-extrabold text-lg text-echo-coral tracking-tight">LittleEchoes</span>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="font-inter text-sm font-semibold text-echo-charcoal border-2 border-echo-charcoal/20 px-4 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-8 pb-10 text-center">
        <div className="text-5xl mb-4">🎙️</div>
        <h1 className="font-extrabold text-3xl text-echo-charcoal leading-tight mb-3">
          Their voice is changing.<br />
          <span className="text-echo-coral">Are you capturing it?</span>
        </h1>
        <p className="font-inter text-echo-gray text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          LittleEchoes asks your child 3 simple questions a day and records their answers. One day, you'll treasure every word.
        </p>
        <button
          onClick={() => navigate('/start')}
          className="w-full max-w-xs mx-auto block py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform mb-3"
        >
          Start Capturing Echoes
        </button>
        <p className="font-inter text-xs text-echo-gray">
          Free trial · No credit card needed to start
        </p>
      </section>

      {/* Social proof */}
      <div className="mx-5 bg-white rounded-2xl px-4 py-3 shadow-soft flex items-center gap-3 mb-8">
        <div className="flex -space-x-2">
          {['👩', '👨', '👩‍🦱', '👨‍🦰'].map((e, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-echo-cream border-2 border-white flex items-center justify-center text-sm">{e}</div>
          ))}
        </div>
        <div>
          <p className="font-nunito font-bold text-echo-charcoal text-sm">Loved by parents</p>
          <p className="font-inter text-xs text-echo-gray">Thousands of families preserving memories</p>
        </div>
      </div>

      {/* Features */}
      <section className="px-5 mb-8">
        <p className="font-inter text-xs text-echo-gray uppercase tracking-widest mb-4 text-center">Why LittleEchoes</p>
        <div className="space-y-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-4 shadow-soft flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-echo-cream flex items-center justify-center text-xl flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-nunito font-bold text-echo-charcoal text-sm">{f.title}</p>
                <p className="font-inter text-xs text-echo-gray mt-0.5 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 mb-8">
        <p className="font-inter text-xs text-echo-gray uppercase tracking-widest mb-4 text-center">How it works</p>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-echo-coral text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                {s.num}
              </div>
              <p className="font-nunito font-semibold text-echo-charcoal text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-5 mb-8 bg-echo-coral rounded-2xl px-5 py-6 text-center text-white">
        <p className="font-inter text-xs uppercase tracking-widest opacity-80 mb-1">Simple pricing</p>
        <p className="font-extrabold text-2xl mb-1">From $10<span className="text-lg font-semibold opacity-80">/month</span></p>
        <p className="font-inter text-sm opacity-80 mb-5">Billed annually · cancel anytime</p>
        <button
          onClick={() => navigate('/start')}
          className="w-full py-3.5 rounded-full bg-white text-echo-coral font-extrabold text-sm active:scale-95 transition-transform"
        >
          Start Free Trial
        </button>
      </section>

      {/* Quote */}
      <section className="mx-5 mb-8 bg-white rounded-2xl px-5 py-5 shadow-soft">
        <p className="font-nunito text-echo-charcoal text-sm leading-relaxed italic mb-3">
          "I played back my daughter's recording from when she was 4. She's 7 now and I sobbed. Best thing I ever did."
        </p>
        <p className="font-inter text-xs text-echo-gray">— Sarah M., mom of two</p>
      </section>

      {/* Footer CTA */}
      <section className="px-5 pb-12 text-center">
        <p className="font-nunito font-extrabold text-xl text-echo-charcoal mb-2">
          Don't let this moment pass.
        </p>
        <p className="font-inter text-xs text-echo-gray mb-6">
          Start recording today. Your future self will thank you.
        </p>
        <button
          onClick={() => navigate('/start')}
          className="w-full py-4 rounded-full bg-echo-coral text-white font-extrabold text-base shadow-coral active:scale-95 transition-transform mb-4"
        >
          Get Started Free
        </button>
        <p className="font-inter text-xs text-echo-gray">
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} className="text-echo-coral font-semibold">
            Sign in
          </button>
        </p>
      </section>

      {/* Footer */}
      <div className="border-t border-echo-light-gray px-5 py-4 text-center">
        <p className="font-nunito text-xs text-echo-gray">LittleEchoes · Made with love for families</p>
      </div>

    </div>
  );
}
