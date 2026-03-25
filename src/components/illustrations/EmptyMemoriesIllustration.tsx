export function EmptyMemoriesIllustration() {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px]">
      {/* Background circle */}
      <circle cx="120" cy="105" r="75" fill="#FFF9F0" />
      <circle cx="120" cy="105" r="60" stroke="#FFD93D" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.4" />

      {/* Cassette tape shape */}
      <rect x="55" y="70" width="130" height="90" rx="12" fill="#6BC5F8" fillOpacity="0.2" stroke="#6BC5F8" strokeWidth="2" />
      <rect x="70" y="85" width="100" height="60" rx="8" fill="white" fillOpacity="0.6" />

      {/* Tape reels */}
      <circle cx="95" cy="115" r="18" fill="white" stroke="#6BC5F8" strokeWidth="2" />
      <circle cx="95" cy="115" r="8" fill="#6BC5F8" fillOpacity="0.3" />
      <circle cx="145" cy="115" r="18" fill="white" stroke="#6BC5F8" strokeWidth="2" />
      <circle cx="145" cy="115" r="8" fill="#6BC5F8" fillOpacity="0.3" />

      {/* Musical notes floating */}
      <text x="32" y="75" fontSize="20">🎵</text>
      <text x="185" y="80" fontSize="16">🎶</text>
      <text x="110" y="50" fontSize="18">🎵</text>

      {/* Stars */}
      <text x="20" y="130" fontSize="14">✨</text>
      <text x="200" y="135" fontSize="12">⭐</text>
    </svg>
  );
}
