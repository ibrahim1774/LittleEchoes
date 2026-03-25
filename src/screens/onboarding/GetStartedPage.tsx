import { useNavigate } from 'react-router-dom';
import { CelebrationStars } from '@/components/illustrations/CelebrationStars';

export function GetStartedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-echo-cream px-8 pb-20 gap-6">
      <div className="w-full max-w-[220px] animate-bounce-in">
        <CelebrationStars />
      </div>

      <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="font-nunito font-extrabold text-[26px] text-echo-charcoal dark:text-white">
          Let's set up your family!
        </h2>
        <p className="font-nunito text-echo-gray text-sm leading-relaxed">
          Takes less than 2 minutes. Your recordings are saved privately on this device.
        </p>
      </div>

      <button
        onClick={() => navigate('/setup/parent')}
        className="w-full bg-echo-coral text-white font-nunito font-bold text-lg py-4 rounded-full shadow-coral active:scale-95 transition-transform animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        Get Started ✨
      </button>

      <p className="font-inter text-xs text-echo-gray text-center animate-fade-in" style={{ animationDelay: '0.45s' }}>
        All data stays on your device. No account required.
      </p>
    </div>
  );
}
