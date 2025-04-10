/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#007BFF',
        'urgent-red': '#DC3545',
        'moderate-yellow': '#FFC107',
        'non-urgent-green': '#28A745',
      },
    },
  },
  plugins: [],
};
