import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'turmeric-yellow': '#FFC72C',
        'chili-red': '#C41E3A',
        'curry-green': '#508D4E',
        'paneer-white': '#F5F5F5',
        'dal-orange': '#FFA500',
        'background-light': '#FFF8E1',
        'text-primary': '#424242',
        'text-secondary': '#757575',
        'accent-primary': '#E67E22',
        'accent-secondary': '#27AE60',
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;