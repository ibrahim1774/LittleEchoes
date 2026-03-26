import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

declare function fbq(...args: unknown[]): void;

const PLAN_VALUES: Record<string, number> = {
  monthly: 9.99,
  yearly: 59.99,
};

export function PaymentSuccessScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get('plan') ?? 'monthly';
    const valueParam = searchParams.get('value');
    const value = valueParam ? parseFloat(valueParam) : (PLAN_VALUES[plan] ?? 9.99);
    const eventId = crypto.randomUUID();

    // Client-side pixel
    try {
      fbq('track', 'Purchase', { value, currency: 'USD' }, { eventID: eventId });
    } catch {
      // fbq not available (ad blocker or script not loaded)
    }

    // Server-side Conversions API for deduplication
    void fetch('/api/fb-purchase-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value,
        currency: 'USD',
        eventId,
        eventSourceUrl: window.location.href,
      }),
    });

    const timer = setTimeout(() => {
      navigate('/signup', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg flex flex-col items-center justify-center px-8 text-center">
      <div className="text-6xl mb-4 animate-bounce-in">🎉</div>
      <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white mb-2">
        Payment confirmed!
      </h1>
      <p className="font-inter text-echo-gray text-sm leading-relaxed mb-6">
        Welcome to LittleEchoes. Now let's create your account to get started.
      </p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-echo-coral"
            style={{ animation: `pulse-scale 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
