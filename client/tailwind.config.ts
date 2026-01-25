import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1b1e',
          card: '#25262b',
          text: '#c1c2c5',
          muted: '#909296',
          border: '#373a40'
        },
        primary: '#339af0',
        success: '#51cf66',
        warning: '#fcc419',
        danger: '#ff6b6b'
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config
