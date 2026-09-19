/** @type {import('tailwindcss').Config} */
/**
 * Blue-black premium theme, iOS-native feel.
 *
 * Token NAMES are semantic (ink / surface / raised / line / hi / muted / accent)
 * rather than colour names, so re-theming is this file alone — which is how the
 * original Figma palette was swapped out for this one without touching a
 * component. The Figma values are preserved in `figma` below for reference.
 *
 * PRD §10.3 note: that standard asks for neutral chrome, because saturated
 * colour next to a product photo distorts how the customer reads the tile's
 * shade. This theme keeps every surface that sits *behind or beside* a product
 * image desaturated near-black, and confines the blue to controls and
 * navigation, so the material still reads true.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070f',        // page background
        deep: '#0a1020',       // headers, totals, contrast blocks
        surface: '#0e1524',    // cards
        raised: '#151d30',     // subtle fills, track backgrounds
        line: '#1f2940',       // hairline separators
        hi: '#eef2fb',         // primary text
        muted: '#8a96b0',      // secondary text
        accent: {
          DEFAULT: '#4d7cfe',  // iOS-blue-adjacent, deepened for a dark ground
          dark: '#3a63d8',
          soft: '#7ba0ff',
        },
        success: '#30d158',    // iOS system green (dark)
        warning: '#ffd60a',    // iOS system yellow (dark)
        danger: '#ff453a',     // iOS system red (dark)

        /** Retained from the Figma variable collection, for reference. */
        figma: {
          cream: '#f6f1ea', stone: '#efe7db', hairline: '#e1d6c8',
          charcoal: '#231f1c', warmgrey: '#6b6259', terracotta: '#b9532f',
        },
      },
      backgroundImage: {
        // The premium gradient. Off-axis so it reads as lit from the top-left
        // rather than as a flat vertical fade.
        premium: 'linear-gradient(165deg, #0d1528 0%, #070b16 46%, #050710 100%)',
        deepfade: 'linear-gradient(180deg, #131d33 0%, #090e1b 100%)',
        accentgrad: 'linear-gradient(135deg, #5b8cff 0%, #3f68e0 100%)',
        // A 1px top highlight, the trick that makes dark cards look lifted.
        hairlight: 'linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,0) 40%)',
        glass: 'linear-gradient(180deg, rgba(20,28,48,.82), rgba(10,15,28,.92))',
      },
      borderRadius: {
        // iOS radii: 10 for grouped lists, 14 for buttons and sheets, 22 for cards.
        sm: '10px',
        DEFAULT: '14px',
        lg: '22px',
        pill: '999px',
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px',
        6: '24px', 8: '32px', 12: '48px', 16: '64px', 24: '96px',
      },
      fontFamily: {
        // The SF stack. On an iPhone this resolves to SF Pro and the app stops
        // looking like a website; elsewhere it falls back gracefully.
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display',
               'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text',
                  'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Apple's type scale, trimmed to what this app uses. Large text carries
        // negative tracking exactly as SF Pro Display does on device.
        eyebrow: ['11px', { lineHeight: '13px', letterSpacing: '0.06em' }],
        micro: ['12px', { lineHeight: '16px' }],
        small: ['14px', { lineHeight: '19px' }],
        base: ['16px', { lineHeight: '21px' }],
        lead: ['17px', { lineHeight: '23px' }],       // iOS body
        h3: ['20px', { lineHeight: '25px', letterSpacing: '-0.015em' }],
        h2: ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        h1: ['28px', { lineHeight: '34px', letterSpacing: '-0.025em' }],
        display: ['34px', { lineHeight: '41px', letterSpacing: '-0.03em' }],  // iOS large title
        figure: ['30px', { lineHeight: '34px', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.04) inset, 0 8px 28px -14px rgba(0,0,0,.9)',
        sheet: '0 -1px 0 rgba(255,255,255,.07) inset, 0 -20px 60px -20px rgba(0,0,0,.95)',
        bar: '0 -0.5px 0 rgba(255,255,255,.08)',
        accent: '0 6px 20px -8px rgba(77,124,254,.65)',
      },
      maxWidth: { app: '520px' },
      transitionTimingFunction: {
        // iOS spring-ish easing for presses and transitions.
        ios: 'cubic-bezier(.32,.72,0,1)',
      },
    },
  },
  plugins: [],
};
