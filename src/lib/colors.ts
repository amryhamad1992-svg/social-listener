// Stackline Official Brand Colors
// Reference: Stackline Brand Guidelines

export const STACKLINE_COLORS = {
  // Primary Colors
  carbonIndigo: '#031425',        // Primary brand color - darkest navy
  navyDark: '#2D3C4A',            // Secondary dark
  productCharts: '#adbdcc',       // Light blue-gray for prior period/secondary data
  moonbeam: '#E0E2E4',            // Light gray for borders/dividers
  productHeader: '#F6F7F8',       // Very light gray backgrounds
  slate: '#4E596A',               // Mid-tone text

  // Accent Colors - Teal Family
  teal: '#16949b',                // Primary teal accent
  tealLight: '#9ee0d0',           // Light teal for backgrounds
  tealDark: '#185450',            // Dark teal
  mint: '#71c184',                // Mint green

  // Accent Colors - Blue Family
  blue: '#46a8f6',                // Bright blue
  blueLight: '#a5cfff',           // Light blue
  blueMuted: '#7e8fa8',           // Muted blue-gray

  // Status Colors
  success: '#71c184',             // Green - positive changes
  successDark: '#185450',         // Dark green
  danger: '#ff534a',              // Coral red - negative changes
  dangerDark: '#bc3c19',          // Dark rust red
  warning: '#ffbd32',             // Gold/amber - warnings
  warningDark: '#f0a202',         // Dark amber

  // Extended Palette
  orange: '#ed792f',
  lime: '#99bd05',
  purple: '#a21671',
  burgundy: '#73171f',
  pinkLight: '#ffc5c5',

  // Neutral Grays
  gray700: '#717B84',
  gray600: '#7D848C',
  gray400: '#dedede',
  gray200: '#f5f5f5',
  gray100: '#fafafa',
  white: '#FFFFFF',
} as const;

// Chart-specific colors
export const CHART_COLORS = {
  current: STACKLINE_COLORS.carbonIndigo,
  prior: STACKLINE_COLORS.productCharts,
  accent: STACKLINE_COLORS.teal,
  comparison: STACKLINE_COLORS.tealLight,
  positive: STACKLINE_COLORS.success,
  negative: STACKLINE_COLORS.danger,
  neutral: STACKLINE_COLORS.slate,
} as const;

// Semantic colors for consistent UI
export const UI_COLORS = {
  text: {
    primary: STACKLINE_COLORS.carbonIndigo,
    secondary: STACKLINE_COLORS.navyDark,
    muted: STACKLINE_COLORS.slate,
    light: STACKLINE_COLORS.productCharts,
  },
  background: {
    page: STACKLINE_COLORS.productHeader,
    card: STACKLINE_COLORS.white,
    hover: STACKLINE_COLORS.gray100,
    selected: STACKLINE_COLORS.productHeader,
  },
  border: {
    default: STACKLINE_COLORS.moonbeam,
    light: STACKLINE_COLORS.gray400,
  },
  accent: {
    primary: STACKLINE_COLORS.teal,
    light: STACKLINE_COLORS.tealLight,
  },
  status: {
    success: STACKLINE_COLORS.success,
    successBg: 'rgba(113, 193, 132, 0.15)',
    danger: STACKLINE_COLORS.danger,
    dangerBg: 'rgba(255, 83, 74, 0.15)',
    warning: STACKLINE_COLORS.warning,
    warningBg: 'rgba(255, 189, 50, 0.15)',
  },
} as const;

export type StacklineColor = keyof typeof STACKLINE_COLORS;
