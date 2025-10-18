/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#50C786',
        success: '#50C786',
      },
    },
  },
  plugins: [require("daisyui")],
}

