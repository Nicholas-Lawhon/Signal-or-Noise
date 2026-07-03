/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        son: {
          bg: '#08111F',
          surface: '#0E1A2D',
          card: '#111F35',
          cardElevated: '#17263D',
          borderSubtle: '#1B2A42',
          border: '#24324A',
          borderStrong: '#38506F',
          text: '#F4F7FB',
          textSecondary: '#A9B7CA',
          textMuted: '#66758C',
          signalBlue: '#4DA3FF',
          signalCyan: '#38D5E6',
          green: '#35D07F',
          amber: '#FFB84D',
          red: '#FF5C73',
          violet: '#A875FF',
          noiseGray: '#4E5C70',
          textInverse: '#06101E',
        },
      },
    },
  },
  plugins: [],
};
