/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#14B8A6', // Teal color for sidebar
        sidebarText: '#FFFFFF',
        sidebarActive: '#FFFFFF',
        sidebarActiveText: '#14B8A6',
        primary: '#14B8A6', // Teal primary color
        borderGray: '#E5E7EB',
        textGray: '#6B7280',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

