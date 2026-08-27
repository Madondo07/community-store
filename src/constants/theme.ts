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
