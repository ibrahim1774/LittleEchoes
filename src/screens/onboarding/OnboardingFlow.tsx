import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomePage } from './WelcomePage';
import { HowItWorksPage } from './HowItWorksPage';
import { GetStartedPage } from './GetStartedPage';

const PAGES = 3;

export function OnboardingFlow() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function goToPage(index: number) {
    setCurrentPage(index);
    scrollRef.current?.scrollTo({ left: index * window.innerWidth, behavior: 'smooth' });
  }

  function handleScroll() {
    if (!scrollRef.current) return;
    const page = Math.round(scrollRef.current.scrollLeft / window.innerWidth);
    setCurrentPage(page);
  }

  return (
    <div className="relative min-h-screen bg-echo-cream overflow-hidden">
      {/* Skip button */}
      {currentPage < 2 && (
        <button
          onClick={() => navigate('/setup/parent')}
          className="absolute top-4 right-4 z-20 font-nunito text-sm text-echo-gray px-3 py-1 rounded-full hover:bg-echo-light-gray/50 transition-colors"
        >
          Skip
        </button>
      )}

      {/* Pages container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-screen"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="snap-center flex-shrink-0 w-screen min-h-screen">
          <WelcomePage onNext={() => goToPage(1)} />
        </div>
        <div className="snap-center flex-shrink-0 w-screen min-h-screen">
          <HowItWorksPage onNext={() => goToPage(2)} />
        </div>
        <div className="snap-center flex-shrink-0 w-screen min-h-screen">
          <GetStartedPage />
        </div>
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10">
        {Array.from({ length: PAGES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`rounded-full transition-all ${
              i === currentPage
                ? 'w-6 h-2.5 bg-echo-coral'
                : 'w-2.5 h-2.5 bg-echo-light-gray'
            }`}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
