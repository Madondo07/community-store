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

// ─── Brand Colors ────────────────────────────────────────────────────────────

export const Colors = {
  // CPUT brand blues
  navy: "#2F4858",
  blue: "#0072CE",
  teal: "#8ED4D0",

  // Surfaces
  background: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF0F4",

  // Text
  textPrimary: "#1A1D23",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",

  // Semantic
  success: "#059669",
  successLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",

  // UI chrome
  border: "#E5E7EB",
  borderFocused: "#0072CE",
  divider: "#F3F4F6",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(47, 72, 88, 0.06)",

  // Tab bar
  tabInactive: "#9CA3AF",
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
} as const;

export type ColorPalette = Record<keyof typeof Colors, string>;

export function getColors(scheme: "light" | "dark"): ColorPalette {
  return scheme === "dark" ? DarkColors : Colors;
}

// ─── Fonts ───────────────────────────────────────────────────────────────────

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

// ─── Typography ──────────────────────────────────────────────────────────────

export const Typography = {
  displayLg: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  displayMd: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  titleLg: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  titleMd: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  titleSm: {
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  },
  price: {
    fontSize: 22,
    fontWeight: "800" as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  priceSm: {
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 20,
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
