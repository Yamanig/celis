import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: false,
      padding: false,
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui bridge tokens (consumed from globals.css)
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        caution: {
          DEFAULT: "hsl(var(--caution) / <alpha-value>)",
          foreground: "hsl(var(--caution-foreground) / <alpha-value>)",
        },
        // Celis-owned semantic tokens (direct use in application code preferred)
        celis: {
          primary: "hsl(var(--celis-primary) / <alpha-value>)",
          "primary-hover": "hsl(var(--celis-primary-hover) / <alpha-value>)",
          "primary-active": "hsl(var(--celis-primary-active) / <alpha-value>)",
          "primary-subtle": "hsl(var(--celis-primary-subtle) / <alpha-value>)",
          "primary-muted": "hsl(var(--celis-primary-muted) / <alpha-value>)",
          secondary: "hsl(var(--celis-secondary) / <alpha-value>)",
          "secondary-hover": "hsl(var(--celis-secondary-hover) / <alpha-value>)",
          "secondary-subtle": "hsl(var(--celis-secondary-subtle) / <alpha-value>)",
          destructive: "hsl(var(--celis-destructive) / <alpha-value>)",
          "destructive-hover": "hsl(var(--celis-destructive-hover) / <alpha-value>)",
          "destructive-subtle": "hsl(var(--celis-destructive-subtle) / <alpha-value>)",
          success: "hsl(var(--celis-success) / <alpha-value>)",
          "success-hover": "hsl(var(--celis-success-hover) / <alpha-value>)",
          "success-subtle": "hsl(var(--celis-success-subtle) / <alpha-value>)",
          caution: "hsl(var(--celis-caution) / <alpha-value>)",
          "caution-subtle": "hsl(var(--celis-caution-subtle) / <alpha-value>)",
          bg: "hsl(var(--celis-bg) / <alpha-value>)",
          "surface-base": "hsl(var(--celis-surface-base) / <alpha-value>)",
          "surface-elevated": "hsl(var(--celis-surface-elevated) / <alpha-value>)",
          "surface-overlay": "hsl(var(--celis-surface-overlay) / <alpha-value>)",
          "surface-inset": "hsl(var(--celis-surface-inset) / <alpha-value>)",
          border: "hsl(var(--celis-border) / <alpha-value>)",
          "border-strong": "hsl(var(--celis-border-strong) / <alpha-value>)",
          "border-subtle": "hsl(var(--celis-border-subtle) / <alpha-value>)",
          ink: "hsl(var(--celis-ink) / <alpha-value>)",
          "ink-secondary": "hsl(var(--celis-ink-secondary) / <alpha-value>)",
          "ink-tertiary": "hsl(var(--celis-ink-tertiary) / <alpha-value>)",
          "ink-financial": "hsl(var(--celis-ink-financial) / <alpha-value>)",
          "ink-inverse": "hsl(var(--celis-ink-inverse) / <alpha-value>)",
          "ink-on-primary": "hsl(var(--celis-ink-on-primary) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Inter Variable",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      keyframes: {
        "accordion-down": {
          from: { gridTemplateRows: "0fr" },
          to: { gridTemplateRows: "1fr" },
        },
        "accordion-up": {
          from: { gridTemplateRows: "1fr" },
          to: { gridTemplateRows: "0fr" },
        },
        "slide-in-from-bottom": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-right": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-out forwards",
        "accordion-up": "accordion-up 200ms ease-in forwards",
        "slide-in-from-bottom":
          "slide-in-from-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-from-right":
          "slide-in-from-right 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 150ms ease-in-out forwards",
        "fade-out": "fade-out 150ms ease-in-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
  ],
};

export default config;
