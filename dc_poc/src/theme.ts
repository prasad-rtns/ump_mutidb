import { Platform } from "react-native";

/**
 * POC palette inspired by dubaiculture.gov.ae — clean portal UI, teal primary, gold accents.
 * Not official brand assets; tune against production design tokens when available.
 */
export const fontSans =
  Platform.OS === "web"
    ? ('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' as const)
    : undefined;

export const theme = {
  colors: {
    /** Primary teal — navigation, key actions */
    primary: "#0d4f47",
    primaryDark: "#0a3d37",
    primaryMuted: "#e8f2f0",
    /** Gold accent — links, highlights (gov portal style) */
    accent: "#b8860b",
    accentDark: "#8f6a08",
    accentLight: "#f5efe2",
    background: "#f2f5f4",
    backgroundElevated: "#fafbfb",
    surface: "#ffffff",
    surfaceMuted: "#f7f9f8",
    text: "#1c2423",
    textMuted: "#5a6967",
    textOnPrimary: "#ffffff",
    border: "#dde8e5",
    borderLight: "#eef4f2",
    heroOverlay: "rgba(10, 52, 46, 0.85)",
    /** Legacy aliases (used across screens) */
    brandGreen: "#0d4f47",
    headerBg: "#ffffff",
    headerBorder: "#e1eae8",
    tabBar: "#ffffff",
    footerBg: "#0a302b",
    footerText: "rgba(255,255,255,0.95)",
    footerMuted: "rgba(255,255,255,0.68)",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  maxContentWidth: 1140,
  /** Subtle card elevation (portal-style cards) */
  shadow: {
    card: {
      shadowColor: "#0d4f47",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
      elevation: 3,
    },
    header: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  },
} as const;
