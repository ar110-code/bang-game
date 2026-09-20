import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        saloon: {
          950: "#0f0c09",
          900: "#1a140f",
          800: "#2d2016",
          700: "#443121",
          600: "#694a31",
          500: "#8c6544",
          400: "#b5875d",
          300: "#d9ae87",
          200: "#edcfb2",
          100: "#f7e9dc",
          50: "#faf4ed",
        },
        sheriff: {
          DEFAULT: "#eab308", // Golden Star
          dark: "#a16207",
          light: "#fef08a",
        },
        outlaw: {
          DEFAULT: "#dc2626", // Blood red
          dark: "#991b1b",
          light: "#fca5a5",
        },
        deputy: {
          DEFAULT: "#2563eb", // Deep Law Blue
          dark: "#1d4ed8",
          light: "#93c5fd",
        },
        renegade: {
          DEFAULT: "#9333ea", // Shady Purple
          dark: "#6b21a8",
          light: "#d8b4fe",
        },
        card: {
          brown: "#854d0e",
          blue: "#1e40af",
        }
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
        western: ["Georgia", "serif"],
      },
      boxShadow: {
        western: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
      }
    },
  },
  plugins: [],
};
export default config;
