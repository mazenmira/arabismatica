import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
      colors: {
        gold: {
          50:  '#FAF5E4', 100: '#F5EDD0', 200: '#EDD894',
          300: '#E8C97A', 400: '#D4A853', 500: '#C9A84C',
          600: '#A8872D', 700: '#8B6D2E', 800: '#6B5020', 900: '#4A3510',
        },
        ink: { DEFAULT: '#16100A', light: '#1E1508', muted: '#2C1E08' },
        parch: { DEFAULT: '#FAF6EE', dark: '#F0E8D4', cream: '#FDF9F2' },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-up': 'fadeUp 0.3s ease-out',
      },
      keyframes: {
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
