import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: {
          DEFAULT: "hsl(var(--background) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)"
        },
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)"
        },
        "on-tertiary": "#ffffff",
        "error": "#ba1a1a",
        "on-secondary-container": "#fefcff",
        "tertiary-container": "#3c2300",
        "surface-container-highest": "#e0e3e5",
        "inverse-surface": "#2d3133",
        "outline-variant": "#c6c5d0",
        "surface-tint": "#4f5c8e",
        "tertiary-fixed": "#ffddb8",
        "surface-bright": "#f7f9fb",
        "on-tertiary-fixed-variant": "#653e00",
        "secondary-container": "#2170e4",
        "on-surface": "#191c1e",
        "primary-container": "#172554",
        "surface-dim": "#d8dadc",
        "surface": "#f7f9fb",
        "outline": "#767680",
        "on-primary": "#ffffff",
        "surface-container": "#eceef0",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "on-error-container": "#93000a",
        "tertiary-fixed-dim": "#ffb95f",
        "inverse-primary": "#b7c4fd",
        "primary-fixed": "#dce1ff",
        "on-tertiary-fixed": "#2a1700",
        "tertiary": "#201100",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-surface-variant": "#45464f",
        "inverse-on-surface": "#eff1f3",
        "on-primary-fixed-variant": "#374475",
        "on-secondary": "#ffffff",
        "surface-container-high": "#e6e8ea",
        "on-secondary-fixed-variant": "#004395",
        "secondary-fixed": "#d8e2ff",
        "on-tertiary-container": "#c88000",
        "on-background": "#191c1e",
        "on-primary-container": "#808dc2",
        "secondary-fixed-dim": "#adc6ff",
        "primary-fixed-dim": "#b7c4fd",
        "on-primary-fixed": "#071747",
        "on-secondary-fixed": "#001a42",
        "surface-variant": "#e0e3e5"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "var(--radius)",
        "md": "calc(var(--radius) - 2px)",
        "sm": "calc(var(--radius) - 4px)",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config;
