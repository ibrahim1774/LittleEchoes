import { ParentChildIllustration } from '@/components/illustrations/ParentChildIllustration';

interface Props {
  onNext: () => void;
}

export function WelcomePage({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-echo-cream px-8 pb-20 gap-6">
      <div className="w-full animate-fade-in">
        <ParentChildIllustration />
      </div>

      <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h1 className="font-nunito font-extrabold text-[28px] text-echo-charcoal leading-tight dark:text-white">
          Welcome to LittleEchoes
        </h1>
        <p className="font-nunito text-echo-gray text-base leading-relaxed">
          3 questions a day.<br />A lifetime of memories.
        </p>
      </div>

      <button
        onClick={onNext}
        className="mt-4 bg-echo-coral text-white font-nunito font-bold text-base px-10 py-3.5 rounded-full shadow-coral active:scale-95 transition-transform animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        Next →
      </button>
    </div>
  );
}
