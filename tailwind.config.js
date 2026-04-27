/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#0f172a',
          fg: '#f8fafc',
        },
        accent: {
          DEFAULT: '#6366f1',
          fg: '#ffffff',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0a0a0a',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          dark: '#1e293b',
        },
        phase: {
          diagnostic: '#bae6fd',
          build: '#bbf7d0',
          mocks: '#fed7aa',
          refine: '#ddd6fe',
          taper: '#e2e8f0',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 220ms ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
