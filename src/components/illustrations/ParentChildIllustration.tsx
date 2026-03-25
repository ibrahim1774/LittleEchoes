export function ParentChildIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px]">
      {/* Background circles */}
      <circle cx="140" cy="140" r="80" fill="#FFD93D" fillOpacity="0.12" />
      <circle cx="140" cy="140" r="55" fill="#FF6B6B" fillOpacity="0.08" />

      {/* Parent body */}
      <rect x="70" y="115" width="28" height="50" rx="14" fill="#6BC5F8" />
      {/* Parent head */}
      <circle cx="84" cy="105" r="20" fill="#FFB347" />
      {/* Parent hair */}
      <ellipse cx="84" cy="88" rx="18" ry="10" fill="#2D2D2D" />
      {/* Parent smile */}
      <path d="M78 108 Q84 114 90 108" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Parent eyes */}
      <circle cx="79" cy="103" r="2.5" fill="#2D2D2D" />
      <circle cx="89" cy="103" r="2.5" fill="#2D2D2D" />

      {/* Child body */}
      <rect x="158" y="128" width="22" height="40" rx="11" fill="#FF8FAB" />
      {/* Child head */}
      <circle cx="169" cy="118" r="16" fill="#FFB347" />
      {/* Child hair */}
      <ellipse cx="169" cy="104" rx="14" ry="8" fill="#FF6B6B" />
      {/* Child smile */}
      <path d="M164 120 Q169 126 174 120" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Child eyes */}
      <circle cx="165" cy="116" r="2" fill="#2D2D2D" />
      <circle cx="173" cy="116" r="2" fill="#2D2D2D" />

      {/* Holding hands connector */}
      <path d="M98 145 Q130 140 158 148" stroke="#FFB347" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Floating hearts */}
      <text x="50" y="80" fontSize="16">❤️</text>
      <text x="195" y="75" fontSize="12">💛</text>
      <text x="115" y="60" fontSize="14">💜</text>

      {/* Stars */}
      <text x="30" y="130" fontSize="12">✨</text>
      <text x="220" y="120" fontSize="10">⭐</text>
      <text x="140" y="45" fontSize="12">🌟</text>
    </svg>
  );
}
