import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#FFFFFF',
        panel: '#F7F6F3',
        line: '#E4E1D8',
        paper: '#141414',
        ash: '#6B6862',
        signal: '#FF6000',
        signalDim: '#B84600',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
