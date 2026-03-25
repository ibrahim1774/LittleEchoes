import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export function Splash() {
  const navigate = useNavigate();
  const { state } = useApp();

  useEffect(() => {
    if (state.isLoading) return;
    const timer = setTimeout(() => {
      navigate(state.isOnboarded ? '/home' : '/onboarding', { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.isLoading, state.isOnboarded, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-echo-cream dot-pattern px-8">
      {/* Decorative stars */}
      <div className="absolute top-16 left-8 text-2xl animate-bounce-in" style={{ animationDelay: '0.3s' }}>⭐</div>
      <div className="absolute top-24 right-10 text-lg animate-bounce-in" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-40 left-6 text-xl animate-bounce-in" style={{ animationDelay: '0.7s' }}>🌟</div>
      <div className="absolute bottom-32 right-8 text-lg animate-bounce-in" style={{ animationDelay: '0.4s' }}>💫</div>

      {/* Logo */}
      <div className="animate-bounce-in flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Speech bubble heart icon */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="20" fill="#FF6B6B" />
            <path
              d="M12 18a4 4 0 014-4h24a4 4 0 014 4v14a4 4 0 01-4 4H32l-4 6-4-6H16a4 4 0 01-4-4V18z"
              fill="white"
            />
            <path
              d="M28 24c0-2.2-3.5-3.5-3.5 0 0 2 3.5 4.5 3.5 4.5s3.5-2.5 3.5-4.5c0-3.5-3.5-2.2-3.5 0z"
              fill="#FF6B6B"
            />
          </svg>
          <h1 className="font-nunito font-extrabold text-4xl text-echo-coral tracking-tight">
            LittleEchoes
          </h1>
        </div>

        <p className="font-nunito text-echo-gray italic text-lg text-center leading-relaxed">
          Capture their echoes today.<br />Relive them forever.
        </p>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-echo-coral"
              style={{
                animation: `pulse-scale 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
