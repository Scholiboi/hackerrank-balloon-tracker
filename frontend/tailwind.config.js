/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        "neo-yellow": "#B8F0C8",
        "neo-pink": "#FEBDD2",
        "neo-green": "#8ED670",
        "neo-blue": "#7CC5D9",
        "neo-red": "#FA5D5D",
      },
      borderWidth: {
        3: "3px",
      },
      boxShadow: {
        neo: "4px 4px 0px 0px #000",
        "neo-lg": "8px 8px 0px 0px #000",
        "neo-sm": "2px 2px 0px 0px #000",
      },
    },
  },
  plugins: [],
};

