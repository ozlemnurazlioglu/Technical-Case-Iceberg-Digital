/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0b0d14',
        surface: '#11141d',
        'surface-raised': '#161926',
        border: '#1e2232',
        gold: {
          DEFAULT: '#d4a853',
          light: '#e8c06a',
          dim: 'rgba(212,168,83,0.12)',
        },
        ink: {
          DEFAULT: '#e8e4da',
          2: '#9097b0',
          3: '#535870',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.4)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out forwards',
        'pulse-ring': 'pulse-ring 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
