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
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#1E40AF',
          dark: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#FACC15',
          dark: '#EAB308',
          light: '#FEF08A',
        },
        navy: {
          bg: '#07111F',
          deep: '#0B1220',
          surface: '#111827',
          card: '#172554',
          border: 'rgba(59, 130, 246, 0.25)',
        },
        gold: {
          DEFAULT: '#FACC15',
          hover: '#EAB308',
        },
        dark: {
          DEFAULT: '#07111F',
          surface: '#0B1220',
          card: '#111827',
          border: 'rgba(59,130,246,0.25)',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.5)',
        'glow-gold': '0 0 25px -5px rgba(250, 204, 21, 0.5)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
