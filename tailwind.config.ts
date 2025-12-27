import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.{js,vue,ts}',
    './pages/**/*.{js,vue,ts}',
    './plugins/**/*.{js,vue,ts}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        'miku-green': '#39C5BB',
        'light-red': '#FF4444',
        'light-blue': '#4488FF',
        'light-pink': '#FF88DD',
        'light-yellow': '#FFD700',
      },
    },
  },
  plugins: [],
} satisfies Config
