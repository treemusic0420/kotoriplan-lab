import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#f7f7f8',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config
