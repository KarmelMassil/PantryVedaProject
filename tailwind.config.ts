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
        primary: "#FF8C42",
        secondary: "#2D3748",
        accent: "#48BB78",
        warning: "#F6AD55",
        background: "#FAFBFC",
        card: "#FFFFFF",
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
        serif: ['"Inter"', 'serif'],
      },
      backgroundImage: {
        'gradient-orange-to-pink': 'linear-gradient(to right, #FF8C42, #FF66A1)',
      },
    },
  },
  plugins: [],
};
export default config;