export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif'],
      },
      colors: {
        gold: {
          50: '#fdfbf3', 100: '#faf3dd', 200: '#f4e4ae', 300: '#ecd075',
          400: '#e3b83f', 500: '#d4a017', 600: '#b8860b', 700: '#96660a',
          800: '#7a5210', 900: '#664413',
        },
        sky: {
          50: '#eff9ff', 100: '#dff2ff', 200: '#b8e6ff', 300: '#7dd4ff',
          400: '#3abfff', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e',
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d5d9e2', 300: '#b0b7c6',
          400: '#858fa5', 500: '#66718a', 600: '#515a71', 700: '#424a5c',
          800: '#1a1d26', 900: '#101218', 950: '#08090d',
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 160, 23, 0.15)',
        'gold-lg': '0 0 40px rgba(212, 160, 23, 0.25)',
        'sky': '0 0 20px rgba(14, 165, 233, 0.2)',
        'sky-lg': '0 0 40px rgba(14, 165, 233, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}