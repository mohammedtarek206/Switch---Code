import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066FF',
          dark: '#0044CC',
          light: '#3385FF',
        },
        accent: {
          DEFAULT: '#00FF88',
          dark: '#00CC6E',
          light: '#33FFAA',
        },
        cyber: {
          DEFAULT: '#8B5CF6',
          dark: '#6D28D9',
          light: '#A78BFA',
        },
        dark: {
          DEFAULT: '#0A0E27',
          light: '#1A1F3A',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        english: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
