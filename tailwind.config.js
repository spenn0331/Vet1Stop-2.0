/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue': {
          800: '#1E429F', // primary blue
          700: '#2563EB',
          600: '#3B82F6',
        },
        'yellow': {
          500: '#EAB308', // accent color (gold)
          400: '#FACC15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(rgba(30, 66, 159, 0.8), rgba(30, 66, 159, 0.9)), url('/hero-bg.jpg')",
      },
    },
  },
  plugins: [],
}
