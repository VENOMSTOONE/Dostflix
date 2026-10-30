/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-card': 'var(--surface-card)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-glow': 'var(--accent-glow)',
        primary: '#f4f4f5',
      }
    },
  },
  plugins: [],
}
