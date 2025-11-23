import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colors from Figma design
        primary: {
          DEFAULT: '#1c1c1c',
          dark: '#0b0b0b',
          light: '#252525',
        },
        secondary: {
          DEFAULT: '#424242',
          light: '#4a5565',
        },
        background: {
          DEFAULT: '#f3f3f3',
          light: '#ffffff',
        },
        accent: {
          DEFAULT: '#3d27ff',
          green: '#d1fec6',
          'green-dark': '#388512',
        },
        text: {
          DEFAULT: '#252525',
          secondary: '#424242',
          muted: '#727272',
          light: '#4a5565',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'hero': ['64px', { lineHeight: '1.2', letterSpacing: '-1.28px' }],
        'h1': ['36px', { lineHeight: 'normal', letterSpacing: '-0.36px' }],
        'h2': ['32px', { lineHeight: '30px' }],
        'h3': ['24px', { lineHeight: '32px' }],
        'h4': ['24px', { lineHeight: '32px' }],
        'body-lg': ['19px', { lineHeight: '1.5' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '18px' }],
      },
      borderRadius: {
        'figma-sm': '8px',
        'figma-md': '12px',
        'figma-lg': '15px',
        'figma-xl': '24px',
        'figma-2xl': '32px',
      },
      boxShadow: {
        'figma-button': 'inset -4px -4px 4px 0px rgba(0,0,0,0.4), inset 4px 4px 6px 0px rgba(255,255,255,0.15)',
        'figma-card': 'inset -4px -4px 12px 0px rgba(132,132,132,0.25), inset 5px 4px 4px 0px rgba(255,255,255,0.25)',
      },
      backdropBlur: {
        'figma': '5.091px',
        'figma-md': '13px',
      },
    },
  },
  plugins: [],
}
export default config
