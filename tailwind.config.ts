import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'echo-coral': '#FF6B6B',
        'echo-sunny': '#FFD93D',
        'echo-sky': '#6BC5F8',
        'echo-lime': '#A8E06C',
        'echo-lavender': '#C4A1FF',
        'echo-pink': '#FF8FAB',
        'echo-orange': '#FFB347',
        'echo-white': '#FEFEFE',
        'echo-cream': '#FFF9F0',
        'echo-charcoal': '#2D2D2D',
        'echo-gray': '#8E8E93',
        'echo-light-gray': '#F0F0F0',
        'echo-dark-bg': '#1A1A2E',
        'echo-dark-card': '#16213E',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'coral': '0 4px 24px rgba(255, 107, 107, 0.3)',
        'soft': '0 2px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
