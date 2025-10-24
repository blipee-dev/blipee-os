import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Cross-color gradients with shade variations (200, 300, 400, 500, 600, 700, 800)
    // Purple to Pink gradient family
    'from-purple-200', 'to-pink-200',
    'from-purple-300', 'to-pink-300',
    'from-purple-400', 'to-pink-400',
    'from-purple-500', 'to-pink-500',
    'from-purple-600', 'to-pink-600',
    'from-purple-700', 'to-pink-700',
    'from-purple-800', 'to-pink-800',

    // Blue to Cyan gradient family
    'from-blue-200', 'to-cyan-200',
    'from-blue-300', 'to-cyan-300',
    'from-blue-400', 'to-cyan-400',
    'from-blue-500', 'to-cyan-500',
    'from-blue-600', 'to-cyan-600',
    'from-blue-700', 'to-cyan-700',
    'from-blue-800', 'to-cyan-800',

    // Green to Emerald gradient family
    'from-green-200', 'to-emerald-200',
    'from-green-300', 'to-emerald-300',
    'from-green-400', 'to-emerald-400',
    'from-green-500', 'to-emerald-500',
    'from-green-600', 'to-emerald-600',
    'from-green-700', 'to-emerald-700',
    'from-green-800', 'to-emerald-800',

    // Orange to Red gradient family
    'from-orange-200', 'to-red-200',
    'from-orange-300', 'to-red-300',
    'from-orange-400', 'to-red-400',
    'from-orange-500', 'to-red-500',
    'from-orange-600', 'to-red-600',
    'from-orange-700', 'to-red-700',
    'from-orange-800', 'to-red-800',

    // Pink to Rose gradient family
    'from-pink-200', 'to-rose-200',
    'from-pink-300', 'to-rose-300',
    'from-pink-400', 'to-rose-400',
    'from-pink-500', 'to-rose-500',
    'from-pink-600', 'to-rose-600',
    'from-pink-700', 'to-rose-700',
    'from-pink-800', 'to-rose-800',

    // Indigo to Purple gradient family
    'from-indigo-200', 'to-purple-200',
    'from-indigo-300', 'to-purple-300',
    'from-indigo-400', 'to-purple-400',
    'from-indigo-500', 'to-purple-500',
    'from-indigo-600', 'to-purple-600',
    'from-indigo-700', 'to-purple-700',
    'from-indigo-800', 'to-purple-800',

    // Teal to Cyan gradient family
    'from-teal-200', 'to-cyan-200',
    'from-teal-300', 'to-cyan-300',
    'from-teal-400', 'to-cyan-400',
    'from-teal-500', 'to-cyan-500',
    'from-teal-600', 'to-cyan-600',
    'from-teal-700', 'to-cyan-700',
    'from-teal-800', 'to-cyan-800',

    // Amber to Fuchsia gradient family
    'from-amber-200', 'to-fuchsia-200',
    'from-amber-300', 'to-fuchsia-300',
    'from-amber-400', 'to-fuchsia-400',
    'from-amber-500', 'to-fuchsia-500',
    'from-amber-600', 'to-fuchsia-600',
    'from-amber-700', 'to-fuchsia-700',
    'from-amber-800', 'to-fuchsia-800',

    // Blue to Teal gradient family
    'from-blue-200', 'to-teal-200',
    'from-blue-300', 'to-teal-300',
    'from-blue-400', 'to-teal-400',
    'from-blue-500', 'to-teal-500',
    'from-blue-600', 'to-teal-600',
    'from-blue-700', 'to-teal-700',
    'from-blue-800', 'to-teal-800',

    // Red to Yellow gradient family
    'from-red-200', 'to-yellow-200',
    'from-red-300', 'to-yellow-300',
    'from-red-400', 'to-yellow-400',
    'from-red-500', 'to-yellow-500',
    'from-red-600', 'to-yellow-600',
    'from-red-700', 'to-yellow-700',
    'from-red-800', 'to-yellow-800',

    // Slate to Gray gradient family
    'from-slate-200', 'to-gray-200',
    'from-slate-300', 'to-gray-300',
    'from-slate-400', 'to-gray-400',
    'from-slate-500', 'to-gray-500',
    'from-slate-600', 'to-gray-600',
    'from-slate-700', 'to-gray-700',
    'from-slate-800', 'to-gray-800',

    // Lime to Green gradient family
    'from-lime-200', 'to-green-200',
    'from-lime-300', 'to-green-300',
    'from-lime-400', 'to-green-400',
    'from-lime-500', 'to-green-500',
    'from-lime-600', 'to-green-600',
    'from-lime-700', 'to-green-700',
    'from-lime-800', 'to-green-800',

    // Dynamic accent color system - MONOCHROMATIC shade variations
    // Green accent
    'text-green-50', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400',
    'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800', 'text-green-900',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400',
    'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'border-green-50', 'border-green-100', 'border-green-200', 'border-green-300', 'border-green-400',
    'border-green-500', 'border-green-600', 'border-green-700', 'border-green-800', 'border-green-900',
    'from-green-300', 'from-green-400', 'from-green-500', 'from-green-600', 'from-green-700', 'from-green-800',
    'to-green-300', 'to-green-400', 'to-green-500', 'to-green-600', 'to-green-700', 'to-green-800',
    'bg-green-50', 'bg-green-900/20',

    // Blue accent
    'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400',
    'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800', 'text-blue-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400',
    'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900',
    'border-blue-50', 'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-400',
    'border-blue-500', 'border-blue-600', 'border-blue-700', 'border-blue-800', 'border-blue-900',
    'from-blue-300', 'from-blue-400', 'from-blue-500', 'from-blue-600', 'from-blue-700', 'from-blue-800',
    'to-blue-300', 'to-blue-400', 'to-blue-500', 'to-blue-600', 'to-blue-700', 'to-blue-800',
    'bg-blue-900/20',

    // Purple accent
    'text-purple-50', 'text-purple-100', 'text-purple-200', 'text-purple-300', 'text-purple-400',
    'text-purple-500', 'text-purple-600', 'text-purple-700', 'text-purple-800', 'text-purple-900',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400',
    'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800', 'bg-purple-900',
    'border-purple-50', 'border-purple-100', 'border-purple-200', 'border-purple-300', 'border-purple-400',
    'border-purple-500', 'border-purple-600', 'border-purple-700', 'border-purple-800', 'border-purple-900',
    'from-purple-300', 'from-purple-400', 'from-purple-500', 'from-purple-600', 'from-purple-700', 'from-purple-800',
    'to-purple-300', 'to-purple-400', 'to-purple-500', 'to-purple-600', 'to-purple-700', 'to-purple-800',
    'bg-purple-900/20',

    // Orange accent
    'text-orange-50', 'text-orange-100', 'text-orange-200', 'text-orange-300', 'text-orange-400',
    'text-orange-500', 'text-orange-600', 'text-orange-700', 'text-orange-800', 'text-orange-900',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400',
    'bg-orange-500', 'bg-orange-600', 'bg-orange-700', 'bg-orange-800', 'bg-orange-900',
    'border-orange-50', 'border-orange-100', 'border-orange-200', 'border-orange-300', 'border-orange-400',
    'border-orange-500', 'border-orange-600', 'border-orange-700', 'border-orange-800', 'border-orange-900',
    'from-orange-300', 'from-orange-400', 'from-orange-500', 'from-orange-600', 'from-orange-700', 'from-orange-800',
    'to-orange-300', 'to-orange-400', 'to-orange-500', 'to-orange-600', 'to-orange-700', 'to-orange-800',
    'bg-orange-900/20',

    // Pink accent
    'text-pink-50', 'text-pink-100', 'text-pink-200', 'text-pink-300', 'text-pink-400',
    'text-pink-500', 'text-pink-600', 'text-pink-700', 'text-pink-800', 'text-pink-900',
    'bg-pink-50', 'bg-pink-100', 'bg-pink-200', 'bg-pink-300', 'bg-pink-400',
    'bg-pink-500', 'bg-pink-600', 'bg-pink-700', 'bg-pink-800', 'bg-pink-900',
    'border-pink-50', 'border-pink-100', 'border-pink-200', 'border-pink-300', 'border-pink-400',
    'border-pink-500', 'border-pink-600', 'border-pink-700', 'border-pink-800', 'border-pink-900',
    'from-pink-300', 'from-pink-400', 'from-pink-500', 'from-pink-600', 'from-pink-700', 'from-pink-800',
    'to-pink-300', 'to-pink-400', 'to-pink-500', 'to-pink-600', 'to-pink-700', 'to-pink-800',
    'bg-pink-900/20',

    // Cyan accent
    'text-cyan-50', 'text-cyan-100', 'text-cyan-200', 'text-cyan-300', 'text-cyan-400',
    'text-cyan-500', 'text-cyan-600', 'text-cyan-700', 'text-cyan-800', 'text-cyan-900',
    'bg-cyan-50', 'bg-cyan-100', 'bg-cyan-200', 'bg-cyan-300', 'bg-cyan-400',
    'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700', 'bg-cyan-800', 'bg-cyan-900',
    'border-cyan-50', 'border-cyan-100', 'border-cyan-200', 'border-cyan-300', 'border-cyan-400',
    'border-cyan-500', 'border-cyan-600', 'border-cyan-700', 'border-cyan-800', 'border-cyan-900',
    'from-cyan-300', 'from-cyan-400', 'from-cyan-500', 'from-cyan-600', 'from-cyan-700', 'from-cyan-800',
    'to-cyan-300', 'to-cyan-400', 'to-cyan-500', 'to-cyan-600', 'to-cyan-700', 'to-cyan-800',
    'bg-cyan-900/20',
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
