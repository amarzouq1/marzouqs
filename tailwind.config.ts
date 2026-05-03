import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/games/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0A0A0A',
        slate: {
          dark: '#1A1A1A',
          mid: '#2A2A2A',
          light: '#3A3A3A',
        },
        cobalt: {
          DEFAULT: '#0047FF',
          light: '#4080FF',
          bright: '#00AAFF',
          glow: '#0066FF',
        },
        gold: {
          DEFAULT: '#FFD700',
          dim: '#C9A227',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        heavy: '32px',
      },
      boxShadow: {
        cobalt: '0 0 20px rgba(0, 71, 255, 0.4)',
        'cobalt-lg': '0 0 60px rgba(0, 71, 255, 0.3)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.5)',
        'inner-cobalt': 'inset 0 0 20px rgba(0, 71, 255, 0.1)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 71, 255, 0.4)' },
          '50%': { boxShadow: '0 0 60px rgba(0, 71, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0,71,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,71,255,0.05) 1px, transparent 1px)
        `,
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'cobalt-gradient': 'linear-gradient(135deg, #0047FF 0%, #00AAFF 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
