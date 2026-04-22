import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        prompt: ['var(--font-prompt)', 'sans-serif'],
        sans: ['var(--font-prompt)', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e8f0f7',
          100: '#c5d9eb',
          200: '#9fbfdd',
          300: '#79a5cf',
          400: '#5c91c5',
          500: '#3f7dba',
          600: '#2d6aaa',
          700: '#1d5494',
          800: '#154c79',
          900: '#0d3a5c',
          950: '#07243a',
          DEFAULT: '#154c79',
        },
        secondary: {
          50: '#e3f2f9',
          100: '#b9dff0',
          200: '#8bcae7',
          300: '#5cb5dd',
          400: '#38a5d6',
          500: '#1e81b0',
          600: '#1872a0',
          700: '#125f8c',
          800: '#0d4e79',
          900: '#063a5c',
          950: '#02243a',
          DEFAULT: '#1e81b0',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        modal: '0 20px 60px -10px rgb(0 0 0 / 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
