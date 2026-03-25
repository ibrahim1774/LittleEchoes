export function CelebrationStars() {
  return (
    <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px]">
      {/* Center glow */}
      <circle cx="120" cy="95" r="50" fill="#FFD93D" fillOpacity="0.15" />
      <circle cx="120" cy="95" r="30" fill="#FF6B6B" fillOpacity="0.12" />

      {/* Large star center */}
      <text x="98" y="115" fontSize="40">⭐</text>

      {/* Surrounding stars */}
      <text x="40" y="80" fontSize="24">✨</text>
      <text x="175" y="75" fontSize="20">🌟</text>
      <text x="55" y="145" fontSize="18">💫</text>
      <text x="170" y="148" fontSize="22">✨</text>
      <text x="105" y="40" fontSize="16">⭐</text>
      <text x="18" y="115" fontSize="14">💛</text>
      <text x="200" y="115" fontSize="14">🧡</text>

      {/* Confetti shapes */}
      <rect x="30" y="50" width="8" height="8" rx="2" fill="#FF6B6B" transform="rotate(25 34 54)" />
      <rect x="190" y="140" width="8" height="8" rx="2" fill="#6BC5F8" transform="rotate(-15 194 144)" />
      <rect x="200" y="55" width="6" height="6" rx="1" fill="#A8E06C" transform="rotate(40 203 58)" />
      <rect x="25" y="150" width="6" height="6" rx="1" fill="#C4A1FF" transform="rotate(-30 28 153)" />

      {/* Small circles */}
      <circle cx="155" cy="30" r="4" fill="#FF8FAB" />
      <circle cx="75" cy="165" r="3" fill="#FFD93D" />
      <circle cx="210" cy="90" r="3" fill="#FF6B6B" />
    </svg>
  );
}
