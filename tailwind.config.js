/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './public/*.html',
    './public/*.js'
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        surface: { 
          DEFAULT: 'rgba(255,255,255,0.04)', 
          hover: 'rgba(255,255,255,0.07)', 
          active: 'rgba(255,255,255,0.10)' 
        }
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18), transparent)',
      }
    }
  },
  plugins: [],
}
