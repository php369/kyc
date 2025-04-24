/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          500: 'oklch(0.84 0.18 117.33)',
        },
      },
      spacing: {
        '1': '0.25rem',
      },
    },
  },
  plugins: [],
} 