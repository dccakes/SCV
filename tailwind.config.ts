import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const oklchToken = (tokenName: string): string => `oklch(var(${tokenName}) / <alpha-value>)`

const themeColorTokens = {
  border: oklchToken('--border'),
  input: oklchToken('--input'),
  ring: oklchToken('--ring'),
  background: oklchToken('--background'),
  foreground: oklchToken('--foreground'),
  primary: {
    DEFAULT: oklchToken('--primary'),
    foreground: oklchToken('--primary-foreground'),
  },
  secondary: {
    DEFAULT: oklchToken('--secondary'),
    foreground: oklchToken('--secondary-foreground'),
  },
  success: {
    DEFAULT: oklchToken('--success'),
    foreground: oklchToken('--success-foreground'),
  },
  destructive: {
    DEFAULT: oklchToken('--destructive'),
    foreground: oklchToken('--destructive-foreground'),
  },
  muted: {
    DEFAULT: oklchToken('--muted'),
    foreground: oklchToken('--muted-foreground'),
  },
  accent: {
    DEFAULT: oklchToken('--accent'),
    foreground: oklchToken('--accent-foreground'),
  },
  popover: {
    DEFAULT: oklchToken('--popover'),
    foreground: oklchToken('--popover-foreground'),
  },
  card: {
    DEFAULT: oklchToken('--card'),
    foreground: oklchToken('--card-foreground'),
  },
  'sidebar-ink': oklchToken('--sidebar-ink'),
  'sidebar-cream': oklchToken('--sidebar-cream'),
  'etta-ink': oklchToken('--etta-ink'),
} as const

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './@/**/*.{ts,tsx}',
    './node_modules/@daveyplate/better-auth-ui/dist/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Instrument Serif', 'serif'],
      },
      colors: themeColorTokens,
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
  // Safelist for dynamically interpolated Tailwind classes (e.g. `text-${primaryColor}`)
  safelist: [
    'text-primary',
    'border-primary',
    'bg-primary',
    'bg-primary/10',
    'bg-primary/5',
    'bg-primary/40',
    'border-primary/40',
    'text-primary/40',
    'hover:bg-primary/90',
    'hover:text-primary/80',
    'text-primary-foreground',
    'bg-muted-foreground/30',
    'bg-muted-foreground',
    'bg-emerald-500',
    'bg-destructive',
    'bg-muted-foreground/50',
    'px-12',
    'py-3',
    'w-[525px]',
  ],
} satisfies Config

export default config
