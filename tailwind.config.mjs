/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      container: {
        center: true,
      },
      colors: {
        primary: {
          '50': '#efeafe',
          '100': '#ded5fd',
          '200': '#bdabfb',
          '300': '#9c82f9',
          '400': '#956dfa',
          '500': '#7a59f7',
          '600': '#6247c6',
          '700': '#493594',
          '800': '#312363',
          '900': '#181131',
        },
        secondary: {
          '50': '#e9edff',
          '100': '#d3dbff',
          '200': '#a8b7fe',
          '300': '#7c93fd',
          '400': '#516ffc',
          '500': '#254bfa',
          '600': '#1e3cc8',
          '700': '#172d96',
          '800': '#0f1e64',
          '900': '#080f32',
        },
        accent: {
          '50': '#f9e6ff',
          '100': '#f3ccff',
          '200': '#e799ff',
          '300': '#db66ff',
          '400': '#cf33ff',
          '500': '#c300ff',
          '600': '#9c00cc',
          '700': '#750099',
          '800': '#4e0066',
          '900': '#270033',
        },
        neutral: {
          '50': '#f8f9fa',
          '100': '#f1f3f5',
          '200': '#e9ecef',
          '300': '#dee2e6',
          '400': '#ced4da',
          '500': '#adb5bd',
          '600': '#6c757d',
          '700': '#495057',
          '800': '#343a40',
          '900': '#1a1f24'
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        display: [
          'Montserrat',
          'Inter',
          'ui-sans-serif',
          'system-ui'
        ],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ],
        accent: [
          'Poppins',
          'Inter',
          'ui-sans-serif',
          'system-ui'
        ]
      },
    }
  },
  plugins: [],
};
