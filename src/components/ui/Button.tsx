import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'font-nunito font-700 rounded-full transition-all active:scale-[0.98] focus:outline-none select-none';

  const variants = {
    primary: 'bg-echo-coral text-white shadow-coral hover:brightness-105',
    secondary:
      'bg-transparent border-2 border-echo-coral text-echo-coral hover:bg-echo-coral/5',
    ghost: 'bg-transparent text-echo-gray hover:bg-echo-light-gray/50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
