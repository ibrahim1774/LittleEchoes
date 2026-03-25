export function RainbowArc() {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[200px]">
      {/* Rainbow arcs */}
      <path d="M10 110 Q100 10 190 110" stroke="#FF6B6B" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M22 110 Q100 26 178 110" stroke="#FFD93D" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M34 110 Q100 42 166 110" stroke="#A8E06C" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M46 110 Q100 58 154 110" stroke="#6BC5F8" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Clouds */}
      <ellipse cx="30" cy="108" rx="22" ry="12" fill="white" />
      <ellipse cx="18" cy="108" rx="14" ry="10" fill="white" />
      <ellipse cx="42" cy="108" rx="14" ry="10" fill="white" />

      <ellipse cx="170" cy="108" rx="22" ry="12" fill="white" />
      <ellipse cx="158" cy="108" rx="14" ry="10" fill="white" />
      <ellipse cx="182" cy="108" rx="14" ry="10" fill="white" />
    </svg>
  );
}
