/**
 * Community Store — CPUT-Branded Design System
 *
 * Color tokens derived from CPUT Brand Identity:
 *   Navy  #003C71 — headers, primary buttons, active nav
 *   Blue  #0072CE — links, selected chips, interactive highlights
 *   Teal  #0198CD — extracted from cput.ac.za SVGs, verification accents
 *
 * Replace with certified brand pack values before final submission.
 */

import { Platform } from "react-native";

// ─── Brand Colors (Swych official palette — Section 7 brand guide) ───────────

export const Colors = {
  // Navy (primary)
  navy: "#2F4858",       // 500 — headers, primary buttons, active nav
  navy700: "#21323E",    // darker navy for text/high-contrast needs
  navy100: "#D5DADE",
  navy50: "#EEF0F2",

  // Teal (secondary/accent)
  teal: "#8ED4D0",        // 500 — lighter backgrounds, soft accents
  teal700: "#639492",     // stronger teal — use for buttons/badges needing contrast
  teal200: "#D2EEEC",
  teal100: "#E8F6F6",

  // Gray (neutral)
  gray700: "#484D50",
  gray500: "#788085",
  gray200: "#D6D9DA",
  gray50: "#F8F9F9",

  // Legacy "blue" — repurposed to brand teal-700 for interactive highlights
  // (selected chips, focus borders). Consider renaming usages to `teal700`
  // directly in a future pass — kept as `blue` for now so existing
  // components (17 usages across 11 files) don't break.
  blue: "#639492",

  // Surfaces
  background: "#F8F9F9",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF0F2",

  // Text
  textPrimary: "#1A1D23",
  textSecondary: "#484D50",
  textTertiary: "#788085",
  textInverse: "#FFFFFF",

  // Semantic (official functional colors)
  success: "#389E6D",
  successLight: "#D1FAE5",
  warning: "#E09E35",
  warningLight: "#FEF3C7",
  danger: "#D34747",
  dangerLight: "#FEE2E2",

  // UI chrome
  border: "#D6D9DA",
  borderFocused: "#639492",
  divider: "#F8F9F9",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(47, 72, 88, 0.06)",

  // Tab bar
  tabInactive: "#788085",
  tabActive: "#2F4858",
} as const;


// ─── Dark Palette ────────────────────────────────────────────────────────────

export const DarkColors = {
  navy: "#8ED4D0",        // accent role in dark mode — bright teal, 5.7:1 contrast vs dark navy bg (passes WCAG AA)
  blue: "#6FB3E0",         // provisional lighter blue — team hasn't locked the light-mode blue value yet either
  teal: "#D2EEEC",

  background: "#21323E",
  surface: "#2F4858",
  surfaceAlt: "#283D4B",

  textPrimary: "#F8F9F9",
  textSecondary: "#B7BEC2",
  textTertiary: "#8B9296",
  textInverse: "#1A2830",  // dark text for teal-filled elements — preserves navy-on-teal contrast rule

  success: "#389E6D",
  successLight: "#1F3D2E",
  warning: "#E09E35",
  warningLight: "#3D2F14",
  danger: "#D34747",
  dangerLight: "#3D1F1F",

  border: "#3A4A56",
  borderFocused: "#6FB3E0",
  divider: "#2C3A44",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(255, 255, 255, 0.06)",

  tabInactive: "#6B7680",
  tabActive: "#8ED4D0",
    navy700: "#639492",
  navy100: "#3A4A56",
  navy50: "#283D4B",
  teal700: "#8ED4D0",
  teal200: "#21323E",
  teal100: "#1A2830",
  gray700: "#D6D9DA",
  gray500: "#8B9296",
  gray200: "#484D50",
  gray50: "#21323E",
} as const;

export type ColorPalette = Record<keyof typeof Colors, string>;

export function getColors(scheme: "light" | "dark"): ColorPalette {
  return scheme === "dark" ? DarkColors : Colors;
}

// ─── Fonts ───────────────────────────────────────────────────────────────────
// ─── Fonts (legacy system fallback — kept for compatibility) ─────────────────

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "'SFMono-Regular', Menlo, Consolas, monospace",
  },
});

// ─── Brand Fonts (Swych official — Poppins headings, Inter body) ─────────────

export const FontFamily = {
  headingBold: "Poppins_700Bold",
  headingExtraBold: "Poppins_800ExtraBold",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Typography = {
  displayLg: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.3,
    fontFamily: FontFamily.headingExtraBold,
  },
  displayMd: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
    letterSpacing: -0.2,
    fontFamily: FontFamily.headingBold,
  },
  titleLg: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
    fontFamily: FontFamily.headingBold,
  },
  titleMd: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
    fontFamily: FontFamily.headingBold,
  },
  titleSm: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 20,
    fontFamily: FontFamily.headingBold,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
    fontFamily: FontFamily.bodyRegular,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
    fontFamily: FontFamily.bodyRegular,
  },
  caption: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
    fontFamily: FontFamily.bodyMedium,
  },
  price: {
    fontSize: 22,
    fontWeight: "800" as const,
    lineHeight: 26,
    letterSpacing: -0.3,
    fontFamily: FontFamily.headingExtraBold,
  },
  priceSm: {
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 20,
    fontFamily: FontFamily.headingBold,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  "5xl": 64,
} as const;

// ─── Border Radii ────────────────────────────────────────────────────────────

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  }),
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
