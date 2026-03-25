import { MicrophoneHero } from '@/components/illustrations/MicrophoneHero';

interface Props {
  onNext: () => void;
}

const steps = [
  { icon: '🎯', color: 'bg-echo-coral/10 text-echo-coral', text: 'Get 3 fun questions picked just for your child' },
  { icon: '🎤', color: 'bg-echo-sky/10 text-echo-sky', text: 'Record their answer — just tap and let them talk!' },
  { icon: '💫', color: 'bg-echo-lavender/10 text-echo-lavender', text: 'Replay their growth and hear how they change' },
];

export function HowItWorksPage({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-echo-cream px-8 pb-20 gap-6">
      <div className="w-full max-w-[180px] animate-fade-in">
        <MicrophoneHero />
      </div>

      <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-nunito font-extrabold text-[26px] text-echo-charcoal dark:text-white">
          Ask. Record. Remember.
        </h2>
      </div>

      <div className="w-full space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${step.color}`}>
              {step.icon}
            </div>
            <p className="font-nunito text-echo-charcoal dark:text-white text-sm font-semibold leading-snug">
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-2 bg-echo-coral text-white font-nunito font-bold text-base px-10 py-3.5 rounded-full shadow-coral active:scale-95 transition-transform animate-fade-in"
        style={{ animationDelay: '0.35s' }}
      >
        Next →
      </button>
    </div>
  );
}
