/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#515A47',
          light: '#6B745E',
          dark: '#3D4435'
        },
        secondary: {
          DEFAULT: '#d7be82',
          light: '#E5D4A6',
          dark: '#C5A65E'
        },
        accent: {
          DEFAULT: '#FF451C',
          light: '#FF6B4A',
          dark: '#E62E05'
        },
        burgundy: {
          DEFAULT: '#400406',
          light: '#661012',
          dark: '#2A0204'
        },
        peach: {
          DEFAULT: '#FFE6D8',
          light: '#FFF4ED',
          dark: '#FFD8C3'
        }
      },
      backgroundColor: {
        'base': '#FFE6D8',
        'card': '#FFFFFF',
        'highlight': '#d7be82'
      },
      textColor: {
        'body': '#515A47',
        'heading': '#400406',
        'inverse': '#FFE6D8'
      },
      borderColor: {
        'default': '#d7be82',
        'focus': '#FF451C'
      }
    }
  },
  plugins: [],
}
