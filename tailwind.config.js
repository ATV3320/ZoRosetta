/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          dark: '#1e40af',
        },
        secondary: {
          DEFAULT: '#4ADE80',
          dark: '#22c55e',
        },
        background: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
        },
      },
    },
  },
  plugins: [],
} 