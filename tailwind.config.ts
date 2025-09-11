import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Gradient classes for accent colors
    'from-purple-500', 'to-pink-500',
    'from-blue-500', 'to-cyan-500',
    'from-green-500', 'to-emerald-500',
    'from-orange-500', 'to-red-500',
    'from-pink-500', 'to-rose-500',
    'from-indigo-500', 'to-purple-500',
    'from-teal-500', 'to-cyan-500',
    'from-amber-500', 'to-fuchsia-500',
    'from-blue-500', 'to-teal-500',
    'from-red-500', 'to-yellow-500',
    'from-slate-500', 'to-gray-500',
    'from-lime-500', 'to-green-500',
    'to-fuchsia-500', 'to-yellow-500', 'to-teal-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0EA5E9", // Sky blue
        secondary: "#8B5CF6", // Purple
        success: "#10B981", // Green
        background: "#0A0A0A", // Near black
        surface: "#1A1A1A", // Dark gray
        "text-primary": "#FFFFFF", // White
        "text-secondary": "#A1A1AA", // Gray
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
