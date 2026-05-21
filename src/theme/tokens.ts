export const colors = {
  background: "#F6F7F9",
  surface: "#FFFFFF",
  border: "#DDE3EA",
  foreground: "#111827",
  mutedForeground: "#667085",
  primary: "#0F766E",
  success: "#15803D",
  warning: "#B45309",
  danger: "#B42318",
  info: "#2563EB",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const typography = {
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  heading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
} as const;

export const shadows = {
  card: {
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

