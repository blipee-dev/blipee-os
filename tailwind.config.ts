import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan';
type AccentShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

type GradientShade = '200' | '300' | '400' | '500' | '600' | '700' | '800';

const accentColors: AccentColor[] = ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'];
const accentShades: AccentShade[] = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
];
const accentClassTypes = ['text', 'bg', 'border'] as const;

const gradientPairs: Array<[string, string]> = [
  ['purple', 'pink'],
  ['blue', 'cyan'],
  ['green', 'emerald'],
  ['orange', 'red'],
  ['pink', 'rose'],
  ['indigo', 'purple'],
  ['teal', 'cyan'],
  ['amber', 'fuchsia'],
  ['blue', 'teal'],
  ['red', 'yellow'],
  ['slate', 'gray'],
  ['lime', 'green'],
];

const gradientShades: GradientShade[] = ['200', '300', '400', '500', '600', '700', '800'];

const accentSafelist = accentColors.flatMap((color) =>
  accentShades.flatMap((shade) => accentClassTypes.map((type) => `${type}-${color}-${shade}`))
);

const gradientSafelist = gradientPairs.flatMap(([from, to]) =>
  gradientShades.flatMap((shade) => [`from-${from}-${shade}`, `to-${to}-${shade}`])
);

const translucentAccents = accentColors.map((color) => `bg-${color}-900/20`);

const safelist = Array.from(
  new Set([...accentSafelist, ...gradientSafelist, ...translucentAccents])
);

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist,
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: '#262626',
        input: '#262626',
        ring: '#0EA5E9',
        background: '#0A0A0A',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#0EA5E9',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#27272A',
          foreground: '#A1A1AA',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-primary-rgb, 139, 92, 246))',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#1A1A1A',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#111111',
          foreground: '#FFFFFF',
        },
        surface: '#1A1A1A',
        'surface-light': '#262626',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [typography],
};

export default config;
