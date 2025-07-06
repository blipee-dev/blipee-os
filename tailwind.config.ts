import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',     // Sky blue
        secondary: '#8B5CF6',   // Purple
        success: '#10B981',     // Green
        background: '#0A0A0A',  // Near black
        surface: '#1A1A1A',     // Dark gray
        'text-primary': '#FFFFFF',        // White
        'text-secondary': '#A1A1AA', // Gray
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config