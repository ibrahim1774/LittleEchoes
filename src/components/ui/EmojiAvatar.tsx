interface EmojiAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  onClick?: () => void;
  bgColor?: string;
}

const sizeMap = {
  sm: 'w-10 h-10 text-xl',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-16 h-16 text-3xl',
  xl: 'w-20 h-20 text-4xl',
};

export function EmojiAvatar({
  emoji,
  size = 'md',
  selected = false,
  onClick,
  bgColor = 'bg-echo-cream',
}: EmojiAvatarProps) {
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeMap[size]} ${bgColor}
        rounded-full flex items-center justify-center
        transition-all active:scale-95
        ${selected ? 'ring-4 ring-echo-coral ring-offset-2 scale-105' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      type="button"
    >
      {emoji}
    </button>
  );
}
