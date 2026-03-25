export function MicrophoneHero() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[200px]">
      {/* Sound wave rings */}
      <circle cx="100" cy="100" r="90" stroke="#FF6B6B" strokeWidth="1.5" strokeOpacity="0.15" />
      <circle cx="100" cy="100" r="72" stroke="#FFD93D" strokeWidth="1.5" strokeOpacity="0.2" />
      <circle cx="100" cy="100" r="55" stroke="#6BC5F8" strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="100" cy="100" r="40" stroke="#C4A1FF" strokeWidth="2" strokeOpacity="0.3" />

      {/* Mic body */}
      <rect x="82" y="55" width="36" height="60" rx="18" fill="#FF6B6B" />
      {/* Mic highlight */}
      <rect x="88" y="62" width="10" height="20" rx="5" fill="white" fillOpacity="0.35" />

      {/* Mic stand arm */}
      <path d="M100 115 Q100 135 100 140" stroke="#2D2D2D" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 140 Q100 140 118 140" stroke="#2D2D2D" strokeWidth="4" strokeLinecap="round" />

      {/* Mic stand arc */}
      <path d="M68 88 Q60 115 82 130" stroke="#FFD93D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M132 88 Q140 115 118 130" stroke="#A8E06C" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Sound dots left */}
      <circle cx="50" cy="90" r="4" fill="#6BC5F8" />
      <circle cx="42" cy="105" r="3" fill="#C4A1FF" />
      {/* Sound dots right */}
      <circle cx="150" cy="90" r="4" fill="#FF8FAB" />
      <circle cx="158" cy="105" r="3" fill="#FFD93D" />
    </svg>
  );
}
