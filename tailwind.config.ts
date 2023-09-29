import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  mode: 'jit',
  darkMode: ['class', '[data-theme*="dark"]'],
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'max-2xl': { 'max': '1535px' },
        'max-xl': { 'max': '1279px' },
        'max-lg': { 'max': '1023px' },
        'max-md': { 'max': '767px' },
        'max-sm': { 'max': '639px' },
        'max-xs': { 'max': '474px' },
        ...defaultTheme.screens,
      },
      colors: {
        text: 'rgb(var(--text) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'x-primary': 'rgb(var(--x-primary) / <alpha-value>)',
        'x-secondary': 'rgb(var(--x-secondary) / <alpha-value>)',
        'x-accent': 'rgb(var(--x-accent) / <alpha-value>)',
        'darkMuted': 'rgb(var(--darkMuted) / <alpha-value>)',
        'darkVibrant': 'rgb(var(--darkVibrant) / <alpha-value>)',
        'dominant': 'rgb(var(--dominant) / <alpha-value>)',
        'lightMuted': 'rgb(var(--lightMuted) / <alpha-value>)',
        'lightVibrant': 'rgb(var(--lightVibrant) / <alpha-value>)',
        'muted': 'rgb(var(--muted) / <alpha-value>)',
        'vibrant': 'rgb(var(--vibrant) / <alpha-value>)',
        'x-darkMuted': 'rgb(var(--x-darkMuted) / <alpha-value>)',
        'x-darkVibrant': 'rgb(var(--x-darkVibrant) / <alpha-value>)',
        'x-dominant': 'rgb(var(--x-dominant) / <alpha-value>)',
        'x-lightMuted': 'rgb(var(--x-lightMuted) / <alpha-value>)',
        'x-lightVibrant': 'rgb(var(--x-lightVibrant) / <alpha-value>)',
        'x-muted': 'rgb(var(--x-muted) / <alpha-value>)',
        'x-vibrant': 'rgb(var(--x-vibrant) / <alpha-value>)'
      }
    }
  }
};
export default config;


