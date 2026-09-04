/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zoho: {
          blue: '#1976d2',
          red: '#dc2626',
          green: '#16a34a',
          amber: '#d97706',
        }
      }
    },
  },
  plugins: [],
}
