/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#060f1d', 900: '#081628', 800: '#0b1f3a', 700: '#12315a', 600: '#1d4378', 100: '#e6ecf5', 50: '#f3f6fa' },
        gold: { DEFAULT: '#b8935a', light: '#d4b483', dark: '#96753f' },
      },
      fontFamily: { display: ['"Fraunces"', 'Georgia', 'serif'], sans: ['Manrope', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
