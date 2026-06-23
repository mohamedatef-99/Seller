/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — used for the hero "still owed" card + CTAs.
        brand: {
          50: '#eef7f3',
          100: '#d6ece1',
          500: '#0e9f6e',
          600: '#0b7e58',
          700: '#086344',
        },
      },
      fontFamily: {
        // Cairo/Tajawal read well in Arabic; falls back to system.
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
