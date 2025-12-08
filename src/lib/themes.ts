/**
 * PhotoVault Theme Configuration
 * ==============================
 *
 * This file contains all theme definitions for the application.
 * Each theme is generated from Realtime Colors (https://realtimecolors.com)
 *
 * HOW TO ADD A NEW THEME:
 * -----------------------
 * 1. Go to https://realtimecolors.com
 * 2. Adjust the 5 colors (Text, Background, Primary, Secondary, Accent)
 * 3. Click Export → CSS tab
 * 4. Toggle ON both "Themes" and "Shades"
 * 5. Copy the CSS output
 * 6. Add a new entry to the THEMES object below following the existing pattern
 * 7. The theme will automatically appear in the admin theme picker
 *
 * THEME STRUCTURE:
 * ----------------
 * Each theme needs:
 * - id: unique identifier (lowercase, no spaces)
 * - name: display name shown in the picker
 * - description: brief description for the admin
 * - colors: the light/dark mode color values
 *
 * The colors are mapped from Realtime Colors format to shadcn/ui format:
 * - background/foreground: page backgrounds and main text
 * - card: card backgrounds
 * - primary: buttons, links, key actions
 * - secondary: supporting UI elements
 * - muted: subtle backgrounds, disabled states
 * - accent: highlights, badges
 * - border/input/ring: form elements and focus states
 */

export interface ThemeColors {
  // Core
  background: string;
  foreground: string;

  // Card
  card: string;
  cardForeground: string;

  // Popover
  popover: string;
  popoverForeground: string;

  // Primary (buttons, links)
  primary: string;
  primaryForeground: string;

  // Secondary
  secondary: string;
  secondaryForeground: string;

  // Muted
  muted: string;
  mutedForeground: string;

  // Accent
  accent: string;
  accentForeground: string;

  // Destructive
  destructive: string;

  // Border, Input, Ring
  border: string;
  input: string;
  ring: string;

  // Sidebar
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;

  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

/**
 * ALL THEMES
 * ==========
 * Add new themes here. Each theme will automatically appear in the admin picker.
 */
export const THEMES: Record<string, Theme> = {

  // ============================================================================
  // THEME: Warm Gallery
  // ============================================================================
  // Warm cream backgrounds with terracotta primary - sophisticated and inviting
  // Realtime Colors URL: realtimecolors.com/dashboard?colors=2D2A26-FAF8F5-C65D3B-9C8B7A-D4A84B
  // ============================================================================
  'warm-gallery': {
    id: 'warm-gallery',
    name: 'Warm Gallery',
    description: 'Warm cream tones with terracotta accents - inviting and sophisticated',
    light: {
      background: '#FAF8F5',
      foreground: '#1c1a17',
      card: '#FFFFFF',
      cardForeground: '#1c1a17',
      popover: '#FFFFFF',
      popoverForeground: '#1c1a17',
      primary: '#C65D3B',
      primaryForeground: '#FFFFFF',
      secondary: '#f4f2f0',
      secondaryForeground: '#1c1a17',
      muted: '#f4f2f0',
      mutedForeground: '#6e675e',
      accent: '#D4A84B',
      accentForeground: '#1c1a17',
      destructive: '#DC2626',
      border: '#e9e6e2',
      input: '#d4ccc4',
      ring: '#C65D3B',
      sidebar: '#f4f2f0',
      sidebarForeground: '#1c1a17',
      sidebarPrimary: '#C65D3B',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#e9e6e2',
      sidebarAccentForeground: '#1c1a17',
      sidebarBorder: '#e9e6e2',
      sidebarRing: '#C65D3B',
      chart1: '#C65D3B',
      chart2: '#D4A84B',
      chart3: '#9C8B7A',
      chart4: '#773722',
      chart5: '#7b5e1e',
    },
    dark: {
      background: '#1c1917',
      foreground: '#f3f3f1',
      card: '#28120b',
      cardForeground: '#f3f3f1',
      popover: '#28120b',
      popoverForeground: '#f3f3f1',
      primary: '#d17d61',
      primaryForeground: '#1c1a17',
      secondary: '#37342f',
      secondaryForeground: '#f3f3f1',
      muted: '#37342f',
      mutedForeground: '#a19a91',
      accent: '#e1c484',
      accentForeground: '#1c1a17',
      destructive: '#EF4444',
      border: '#3b332b',
      input: '#37342f',
      ring: '#d17d61',
      sidebar: '#28120b',
      sidebarForeground: '#f3f3f1',
      sidebarPrimary: '#d17d61',
      sidebarPrimaryForeground: '#1c1a17',
      sidebarAccent: '#37342f',
      sidebarAccentForeground: '#f3f3f1',
      sidebarBorder: '#3b332b',
      sidebarRing: '#d17d61',
      chart1: '#d17d61',
      chart2: '#e1c484',
      chart3: '#a8998a',
      chart4: '#9e4a2e',
      chart5: '#a47d28',
    },
  },

  // ============================================================================
  // THEME: Cool Professional
  // ============================================================================
  // Cool slate backgrounds with indigo primary - modern and professional
  // Realtime Colors URL: realtimecolors.com/dashboard?colors=0F172A-F8FAFC-4F46E5-64748B-06B6D4
  // ============================================================================
  'cool-professional': {
    id: 'cool-professional',
    name: 'Cool Professional',
    description: 'Cool slate tones with indigo accents - modern and clean',
    light: {
      background: '#F8FAFC',
      foreground: '#0e1525',
      card: '#FFFFFF',
      cardForeground: '#0e1525',
      popover: '#FFFFFF',
      popoverForeground: '#0e1525',
      primary: '#4F46E5',
      primaryForeground: '#FFFFFF',
      secondary: '#f0f2f4',
      secondaryForeground: '#0e1525',
      muted: '#f0f2f4',
      mutedForeground: '#566376',
      accent: '#06B6D4',
      accentForeground: '#FFFFFF',
      destructive: '#DC2626',
      border: '#e1e5ea',
      input: '#c4cbd4',
      ring: '#4F46E5',
      sidebar: '#f0f2f4',
      sidebarForeground: '#0e1525',
      sidebarPrimary: '#4F46E5',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#e1e5ea',
      sidebarAccentForeground: '#0e1525',
      sidebarBorder: '#e1e5ea',
      sidebarRing: '#4F46E5',
      chart1: '#4F46E5',
      chart2: '#06B6D4',
      chart3: '#64748B',
      chart4: '#191386',
      chart5: '#057f94',
    },
    dark: {
      background: '#0f1924',
      foreground: '#ecf0f8',
      card: '#1b294b',
      cardForeground: '#ecf0f8',
      popover: '#1b294b',
      popoverForeground: '#ecf0f8',
      primary: '#7f79ec',
      primaryForeground: '#0e1525',
      secondary: '#2b323b',
      secondaryForeground: '#ecf0f8',
      muted: '#2b323b',
      mutedForeground: '#8996a9',
      accent: '#39dcf9',
      accentForeground: '#0e1525',
      destructive: '#EF4444',
      border: '#2b323b',
      input: '#2b323b',
      ring: '#7f79ec',
      sidebar: '#1b294b',
      sidebarForeground: '#ecf0f8',
      sidebarPrimary: '#7f79ec',
      sidebarPrimaryForeground: '#0e1525',
      sidebarAccent: '#2b323b',
      sidebarAccentForeground: '#ecf0f8',
      sidebarBorder: '#2b323b',
      sidebarRing: '#7f79ec',
      chart1: '#7f79ec',
      chart2: '#39dcf9',
      chart3: '#8996a9',
      chart4: '#544ce6',
      chart5: '#06a9c6',
    },
  },

  // ============================================================================
  // THEME: Gallery Dark
  // ============================================================================
  // Warm dark background with amber accents - perfect for photo viewing
  // Realtime Colors URL: realtimecolors.com/dashboard?colors=FAFAF9-1C1917-F59E0B-44403C-FBBF24
  // ============================================================================
  'gallery-dark': {
    id: 'gallery-dark',
    name: 'Gallery Dark',
    description: 'Warm dark theme with amber highlights - ideal for viewing photos',
    light: {
      background: '#f4f2f1',
      foreground: '#1c1c17',
      card: '#FFFFFF',
      cardForeground: '#1c1c17',
      popover: '#FFFFFF',
      popoverForeground: '#1c1c17',
      primary: '#F59E0B',
      primaryForeground: '#1c1c17',
      secondary: '#f3f2f1',
      secondaryForeground: '#1c1c17',
      muted: '#f3f2f1',
      mutedForeground: '#6c6660',
      accent: '#FBBF24',
      accentForeground: '#1c1c17',
      destructive: '#DC2626',
      border: '#e7e6e4',
      input: '#cfccc9',
      ring: '#F59E0B',
      sidebar: '#f3f2f1',
      sidebarForeground: '#1c1c17',
      sidebarPrimary: '#F59E0B',
      sidebarPrimaryForeground: '#1c1c17',
      sidebarAccent: '#e7e6e4',
      sidebarAccentForeground: '#1c1c17',
      sidebarBorder: '#e7e6e4',
      sidebarRing: '#F59E0B',
      chart1: '#F59E0B',
      chart2: '#FBBF24',
      chart3: '#44403C',
      chart4: '#935f06',
      chart5: '#966c03',
    },
    dark: {
      background: '#1c1917',
      foreground: '#f3f3f1',
      card: '#38322e',
      cardForeground: '#f3f3f1',
      popover: '#38322e',
      popoverForeground: '#f3f3f1',
      primary: '#f7b23b',
      primaryForeground: '#1c1c17',
      secondary: '#363330',
      secondaryForeground: '#f3f3f1',
      muted: '#363330',
      mutedForeground: '#9f9993',
      accent: '#fbc337',
      accentForeground: '#1c1c17',
      destructive: '#EF4444',
      border: '#514d48',
      input: '#363330',
      ring: '#f7b23b',
      sidebar: '#38322e',
      sidebarForeground: '#f3f3f1',
      sidebarPrimary: '#f7b23b',
      sidebarPrimaryForeground: '#1c1c17',
      sidebarAccent: '#363330',
      sidebarAccentForeground: '#f3f3f1',
      sidebarBorder: '#514d48',
      sidebarRing: '#f7b23b',
      chart1: '#f7b23b',
      chart2: '#fbc337',
      chart3: '#9f9993',
      chart4: '#c47f08',
      chart5: '#c89004',
    },
  },

  // ============================================================================
  // THEME: Soft Sage
  // ============================================================================
  // Soft sage green background with emerald primary and pink accent - calming
  // Realtime Colors URL: realtimecolors.com/dashboard?colors=1E293B-F4F7F4-059669-6B7280-F472B6
  // ============================================================================
  'soft-sage': {
    id: 'soft-sage',
    name: 'Soft Sage',
    description: 'Soft sage green with emerald and pink accents - calm and fresh',
    light: {
      background: '#F4F7F4',
      foreground: '#111822',
      card: '#FFFFFF',
      cardForeground: '#111822',
      popover: '#FFFFFF',
      popoverForeground: '#111822',
      primary: '#059669',
      primaryForeground: '#FFFFFF',
      secondary: '#f1f2f3',
      secondaryForeground: '#111822',
      muted: '#f1f2f3',
      mutedForeground: '#5d636f',
      accent: '#F472B6',
      accentForeground: '#FFFFFF',
      destructive: '#DC2626',
      border: '#e3e5e8',
      input: '#c7cad1',
      ring: '#059669',
      sidebar: '#e1eae1',
      sidebarForeground: '#111822',
      sidebarPrimary: '#059669',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#c4d4c4',
      sidebarAccentForeground: '#111822',
      sidebarBorder: '#c4d4c4',
      sidebarRing: '#059669',
      chart1: '#059669',
      chart2: '#F472B6',
      chart3: '#6B7280',
      chart4: '#059467',
      chart5: '#be0e69',
    },
    dark: {
      background: '#161d16',
      foreground: '#eef1f6',
      card: '#2c3a2c',
      cardForeground: '#eef1f6',
      popover: '#2c3a2c',
      popoverForeground: '#eef1f6',
      primary: '#6bfacd',
      primaryForeground: '#111822',
      secondary: '#2e3138',
      secondaryForeground: '#eef1f6',
      muted: '#2e3138',
      mutedForeground: '#9096a2',
      accent: '#f471b5',
      accentForeground: '#111822',
      destructive: '#EF4444',
      border: '#464a53',
      input: '#2e3138',
      ring: '#6bfacd',
      sidebar: '#2c3a2c',
      sidebarForeground: '#eef1f6',
      sidebarPrimary: '#6bfacd',
      sidebarPrimaryForeground: '#111822',
      sidebarAccent: '#425742',
      sidebarAccentForeground: '#eef1f6',
      sidebarBorder: '#425742',
      sidebarRing: '#6bfacd',
      chart1: '#6bfacd',
      chart2: '#f471b5',
      chart3: '#9096a2',
      chart4: '#39f9bc',
      chart5: '#f1419c',
    },
  },

  // ============================================================================
  // THEME: Original Teal (Current PhotoVault theme)
  // ============================================================================
  // The original teal theme for reference/fallback
  // ============================================================================
  'original-teal': {
    id: 'original-teal',
    name: 'Original Teal',
    description: 'The original PhotoVault teal theme',
    light: {
      background: '#FFFFFF',
      foreground: '#111111',
      card: '#FFFFFF',
      cardForeground: '#111111',
      popover: '#FFFFFF',
      popoverForeground: '#111111',
      primary: '#00B3A4',
      primaryForeground: '#FFFFFF',
      secondary: '#F7F7F7',
      secondaryForeground: '#111111',
      muted: '#F7F7F7',
      mutedForeground: '#666666',
      accent: '#00B3A4',
      accentForeground: '#FFFFFF',
      destructive: '#DC2626',
      border: '#EAEAEA',
      input: '#DADADA',
      ring: '#00B3A4',
      sidebar: '#F7F7F7',
      sidebarForeground: '#111111',
      sidebarPrimary: '#00B3A4',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#EAEAEA',
      sidebarAccentForeground: '#111111',
      sidebarBorder: '#EAEAEA',
      sidebarRing: '#00B3A4',
      chart1: '#00B3A4',
      chart2: '#00D9C5',
      chart3: '#008F84',
      chart4: '#00665D',
      chart5: '#004D46',
    },
    dark: {
      background: '#0A0A0A',
      foreground: '#F7F7F7',
      card: '#1A1A1A',
      cardForeground: '#F7F7F7',
      popover: '#1A1A1A',
      popoverForeground: '#F7F7F7',
      primary: '#00D9C5',
      primaryForeground: '#0A0A0A',
      secondary: '#2A2A2A',
      secondaryForeground: '#F7F7F7',
      muted: '#2A2A2A',
      mutedForeground: '#999999',
      accent: '#00D9C5',
      accentForeground: '#0A0A0A',
      destructive: '#EF4444',
      border: '#333333',
      input: '#2A2A2A',
      ring: '#00D9C5',
      sidebar: '#1A1A1A',
      sidebarForeground: '#F7F7F7',
      sidebarPrimary: '#00D9C5',
      sidebarPrimaryForeground: '#0A0A0A',
      sidebarAccent: '#2A2A2A',
      sidebarAccentForeground: '#F7F7F7',
      sidebarBorder: '#333333',
      sidebarRing: '#00D9C5',
      chart1: '#00D9C5',
      chart2: '#00F5E1',
      chart3: '#00B3A4',
      chart4: '#008F84',
      chart5: '#00665D',
    },
  },
};

/**
 * Get list of all available themes for the picker
 */
export function getThemeList(): { id: string; name: string; description: string }[] {
  return Object.values(THEMES).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));
}

/**
 * Get a specific theme by ID
 */
export function getTheme(id: string): Theme | undefined {
  return THEMES[id];
}

/**
 * Default theme ID
 */
export const DEFAULT_THEME = 'original-teal';

/**
 * CSS Variable mapping - converts theme colors to CSS custom properties
 */
export function themeToCssVariables(colors: ThemeColors): Record<string, string> {
  return {
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--popover': colors.popover,
    '--popover-foreground': colors.popoverForeground,
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--destructive': colors.destructive,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--sidebar': colors.sidebar,
    '--sidebar-foreground': colors.sidebarForeground,
    '--sidebar-primary': colors.sidebarPrimary,
    '--sidebar-primary-foreground': colors.sidebarPrimaryForeground,
    '--sidebar-accent': colors.sidebarAccent,
    '--sidebar-accent-foreground': colors.sidebarAccentForeground,
    '--sidebar-border': colors.sidebarBorder,
    '--sidebar-ring': colors.sidebarRing,
    '--chart-1': colors.chart1,
    '--chart-2': colors.chart2,
    '--chart-3': colors.chart3,
    '--chart-4': colors.chart4,
    '--chart-5': colors.chart5,
  };
}
