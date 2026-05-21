/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F6F7F9",
        surface: "#FFFFFF",
        elevated: "#FFFFFF",
        border: "#DDE3EA",
        muted: "#EEF2F6",
        "muted-foreground": "#667085",
        foreground: "#111827",
        primary: "#0F766E",
        "primary-foreground": "#FFFFFF",
        secondary: "#1F2937",
        "secondary-foreground": "#FFFFFF",
        success: "#15803D",
        warning: "#B45309",
        danger: "#B42318",
        info: "#2563EB",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      fontFamily: {
        sans: ["System"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

