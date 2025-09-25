/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

// Helper to support opacity with CSS variables in Tailwind color utilities
const withOpacityValue = (variable) => ({ opacityValue }) => {
  if (opacityValue !== undefined) {
    return `rgb(var(${variable}) / ${opacityValue})`
  }
  return `rgb(var(${variable}))`
}

export default {
  darkMode: 'class',
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Roboto', ...defaultTheme.fontFamily.sans
        ],
        title: [
          'Roboto', ...defaultTheme.fontFamily.sans
        ]
      },
      fontSize: {
        'xs': ['0.75rem', '140%'],
        'sm': ['0.875rem', '140%'],
        'base': ['1rem', '140%'],
        'lg': ['1.125rem', '140%'],
        'xl': ['1.25rem', '140%'],
        '2xl': ['1.5rem', '140%'],
      },
      colors: {
        // Semantic tokens (to be expanded as we migrate)
        'bg-primary': withOpacityValue('--bg-primary'),
        'bg-secondary': withOpacityValue('--bg-secondary'),
        'bg-hover': withOpacityValue('--bg-hover'),
        'bg-disabled': withOpacityValue('--bg-disabled'),

        'border-default': withOpacityValue('--border-default'),
        'border-strong': withOpacityValue('--border-strong'),
        'border-muted': withOpacityValue('--border-muted'),

        'text-primary': withOpacityValue('--text-primary'),
        'text-secondary': withOpacityValue('--text-secondary'),
        'text-tertiary': withOpacityValue('--text-tertiary'),
        'text-accent': withOpacityValue('--text-accent'),
        'text-danger': withOpacityValue('--text-danger'),

        link: withOpacityValue('--link'),
        'link-hover': withOpacityValue('--link-hover'),

        'btn-bg': withOpacityValue('--btn-bg'),
        'btn-text': withOpacityValue('--btn-text'),
        'btn-border': withOpacityValue('--btn-border'),
        'btn-hover-bg': withOpacityValue('--btn-hover-bg'),
        'btn-cta-bg': withOpacityValue('--btn-cta-bg'),
        'btn-cta-hover-bg': withOpacityValue('--btn-cta-hover-bg'),

        'tab-bg-active': withOpacityValue('--tab-bg-active'),
        'tab-text-active': withOpacityValue('--tab-text-active'),
        'tab-bg-inactive': withOpacityValue('--tab-bg-inactive'),
        'tab-text-inactive': withOpacityValue('--tab-text-inactive'),
        'tab-bg-hover': withOpacityValue('--tab-bg-hover'),

        'badge-bg-success': withOpacityValue('--badge-bg-success'),
        'badge-text-success': withOpacityValue('--badge-text-success'),
        'badge-bg-success-soft': withOpacityValue('--badge-bg-success-soft'),
        'badge-bg-warning': withOpacityValue('--badge-bg-warning'),
        'badge-text-warning': withOpacityValue('--badge-text-warning'),
        'badge-bg-warning-soft': withOpacityValue('--badge-bg-warning-soft'),
        'badge-bg-error': withOpacityValue('--badge-bg-error'),
        'badge-bg-error-strong': withOpacityValue('--badge-bg-error-strong'),
        'badge-text-error': withOpacityValue('--badge-text-error'),

        accent: withOpacityValue('--accent'),
        'accent-strong': withOpacityValue('--accent-strong'),
      }
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      bazk: '1352px',
    },
  },
}

