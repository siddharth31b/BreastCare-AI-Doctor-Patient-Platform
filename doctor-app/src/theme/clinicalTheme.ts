/**
 * BreastCare AI / NariSetu Doctor - Clinical Healthcare Design System
 * 
 * Target Platform: React Native + Expo SDK 57 on Android 11 (API 31)
 * Target Device: Lenovo Tab M10 FHD Plus (TB-J616X), 1200x2000 px, Landscape Tablet (~1333dp x 800dp)
 * 
 * Design Principles:
 * - Modern, Calm, Clinical, Professional, Trustworthy, Minimal, High-Readability
 * - Tablet-First Touch Ergonomics (Min touch target 48dp, primary actions 56-64dp)
 * - Restrained clinical palette (Medical Navy, Hospital Blue, Cobalt, Clinical Teal)
 * - Semantic risk tier stratification (Low, Moderate, High, Urgent)
 * - Hindi / Devanagari line-height protection (fontSize x 1.45+ to prevent glyph clipping)
 * - Native Android elevation paired with subtle borders
 */

export const ClinicalTheme = {
  colors: {
    // Brand & Clinical Primary
    primary: '#0A2540',       // Deep Medical Navy (Authority, Header, Brand Monogram)
    primaryLight: '#1E3A8A',  // Hospital Blue (Sub-headers, Selected Text)
    primaryAccent: '#0284C7', // Clinical Cobalt (Primary Active Accent, Interactive Elements)
    primarySoft: '#EFF6FF',   // Subtle Blue Tint (Selected Option/Card Background)

    // Secondary & Clinical Accents
    secondary: '#0D9488',     // Clinical Teal (Secondary Actions, Triage Confirmations)
    secondarySoft: '#F0FDFA', // Subtle Teal Tint

    // Neutrals & Surfaces
    background: '#F8FAFC',    // Medical White (Slate 50 - Soft neutral clinic workstation background)
    surface: '#FFFFFF',       // Pure White Card Surface
    surfaceMuted: '#F1F5F9',  // Subtle Surface (Slate 100)
    surfaceHover: '#E2E8F0',  // Surface Highlight (Slate 200)

    // Borders & Dividers
    border: '#E2E8F0',        // Neutral Soft Gray Border
    borderDefault: '#E2E8F0', // Neutral Default Border
    borderSubtle: '#F1F5F9',  // Subtle Gray Border
    borderMedium: '#CBD5E1',  // Stronger Gray Border (Slate 300)
    borderFocus: '#1A56DB',   // Cobalt Focus Border (High-visibility active input state)
    borderError: '#EF4444',   // Critical Red Border (Validation failure)
    borderSuccess: '#15803D', // Clinical Green Border
    borderWarning: '#B45309', // Warning Amber Border

    // Typography & Ink
    textPrimary: '#0F172A',   // Dark Charcoal / Deep Navy (High contrast, 15.4:1 on white)
    textSecondary: '#334155', // Clinical Slate (Labels, descriptions)
    textMuted: '#64748B',     // Clinical Gray (Metadata, hints)
    textLight: '#94A3B8',     // Soft Gray (Placeholders, inactive elements)
    textWhite: '#FFFFFF',

    // Text Sub-scale for structured token consumption
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      muted: '#64748B',
      disabled: '#94A3B8',
      inverse: '#FFFFFF',
    },

    // Background sub-tokens
    bgApp: '#F8FAFC',
    bgSurface: '#FFFFFF',
    bgMuted: '#F1F5F9',
    bgInput: '#FFFFFF',
    bgDisabled: '#F1F5F9',
    bgSelected: '#EFF6FF',
    bgReadonly: '#F8FAFC',

    // Interaction states
    interaction: {
      pressed: 'rgba(15, 23, 42, 0.06)',
      pressedDark: 'rgba(255, 255, 255, 0.15)',
      selected: '#EFF6FF',
      focus: '#1A56DB',
    },

    // Clinical Risk Tiers (Semantic Clinical Stratification)
    riskLow: '#15803D',
    riskLowBg: '#F0FDF4',
    riskLowBorder: '#86EFAC',

    riskModerate: '#B45309',
    riskModerateBg: '#FFFBEB',
    riskModerateBorder: '#FDE68A',

    riskHigh: '#C2410C',
    riskHighBg: '#FFF7ED',
    riskHighBorder: '#FDBA74',

    riskUrgent: '#B91C1C',
    riskUrgentBg: '#FEF2F2',
    riskUrgentBorder: '#FCA5A5',

    // Clinical Input & Interactive States
    focus: '#1A56DB',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    errorBorder: '#FCA5A5',

    success: '#15803D',
    successBg: '#F0FDF4',
    successBorder: '#86EFAC',

    warning: '#B45309',
    warningBg: '#FFFBEB',
    warningBorder: '#FDE68A',

    disabledBg: '#F1F5F9',
    disabledText: '#94A3B8',
    disabledBorder: '#E2E8F0',

    readOnlyBg: '#F8FAFC',
    readOnlyText: '#334155',
    readOnlyBorder: '#CBD5E1',

    // Workflow Status Indicators
    statusLive: '#10B981',
    statusLiveBg: 'rgba(16, 185, 129, 0.12)',
    statusLiveBorder: 'rgba(16, 185, 129, 0.3)',

    statusPending: '#D97706',
    statusPendingBg: 'rgba(217, 119, 6, 0.1)',
    statusPendingBorder: 'rgba(217, 119, 6, 0.25)',

    statusValidated: '#0284C7',
    statusValidatedBg: 'rgba(2, 132, 199, 0.1)',
    statusValidatedBorder: 'rgba(2, 132, 199, 0.25)',
  },

  // 4/8 Based Predictable Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
    space48: 48,
    space64: 64,
    // Bracket and alias compatibility
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
    space16: 16,
    space24: 24,
    space32: 32,
  },

  // Centralized Radius Tokens
  radius: {
    small: 6,
    medium: 8,
    large: 12,
    xl: 16,
    pill: 9999,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    '2xl': 20,
    full: 9999, // Backward-compatibility alias
  },

  // Android Native Elevation Tokens
  elevation: {
    none: 0,
    card: 2,
    raised: 4,
    modal: 8,
    overlay: 12,
  },

  // Shadow Definitions Paired With Elevation
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    raised: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 4,
    },
    elevated: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    modal: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    overlay: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Touch Ergonomics & Component Dimensions
  dimensions: {
    minTouchTarget: 48,
    buttonHeight: 56,
    primaryActionHeight: 60,
    iconButtonSize: 48,
    largeIconButtonSize: 56,
    inputHeight: 54,
    optionRowHeight: 58,
    checkboxRowHeight: 58,
    headerHeight: 72,
  },

  // Touch Target Constants
  touchTargets: {
    minimumTouchTarget: 48,
    minTouchTarget: 48,
    min: 48,
    primaryButtonHeight: 60,
    primaryActionHeight: 60,
    primaryAction: 60,
    secondaryButtonHeight: 56,
    secondaryAction: 56,
    iconButtonSize: 48,
    iconButton: 48,
    largeActionHeight: 64,
    largeIconButtonSize: 56,
    inputHeight: 54,
    optionRow: 58,
    checkboxRow: 58,
  },

  // Typography System (English / Latin Default)
  typography: {
    display: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.4,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    title: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '500' as const,
      color: '#334155',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      color: '#334155',
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      color: '#64748B',
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: '#334155',
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700' as const,
      color: '#64748B',
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
    numeric: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.5,
    },
    numericMetric: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.5,
    },

    // Backward-compatibility aliases for existing screens
    screenTitle: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.4,
    },
    sectionTitle: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    question: {
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    metadata: {
      fontSize: 14,
      lineHeight: 20,
      color: '#64748B',
      fontWeight: '500' as const,
    },

    // Explicit Hindi/Devanagari helpers
    bodyHindi: {
      fontSize: 16,
      lineHeight: 25,
      fontWeight: '400' as const,
      color: '#334155',
    },
    bodyLargeHindi: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '500' as const,
      color: '#334155',
    },
    labelHindi: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: '#334155',
    },
    titleHindi: {
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    h1Hindi: {
      fontSize: 28,
      lineHeight: 42,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
    h2Hindi: {
      fontSize: 24,
      lineHeight: 36,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    h3Hindi: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    buttonHindi: {
      fontSize: 16,
      lineHeight: 25,
      fontWeight: '700' as const,
    },
    questionHindi: {
      fontSize: 22,
      lineHeight: 34,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    displayHindi: {
      fontSize: 32,
      lineHeight: 48,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
  },

  // Hindi / Devanagari Typography Safeguards (Preventing matra clipping with >=1.45x lineHeight)
  typographyHindi: {
    lineHeightMultiplier: 1.45,
    display: {
      fontSize: 32,
      lineHeight: 48,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
    h1: {
      fontSize: 28,
      lineHeight: 42,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
    h2: {
      fontSize: 24,
      lineHeight: 36,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    h3: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    title: {
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '500' as const,
      color: '#334155',
    },
    body: {
      fontSize: 16,
      lineHeight: 25,
      fontWeight: '400' as const,
      color: '#334155',
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
      color: '#64748B',
    },
    label: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: '#334155',
    },
    button: {
      fontSize: 16,
      lineHeight: 25,
      fontWeight: '700' as const,
    },
    question: {
      fontSize: 22,
      lineHeight: 34,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    numeric: {
      fontSize: 32,
      lineHeight: 46,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
    numericMetric: {
      fontSize: 32,
      lineHeight: 46,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
  },

  // Responsive Tablet Layout Constants
  tablet: {
    contentMaxWidth: 1080,
    formMaxWidth: 960,
    narrowContentMaxWidth: 720,
    pagePadding: 32,
    columnGap: 24,
    cardPadding: 24,
    sectionGap: 32,
    screenHorizontalPadding: 32,
    screenHorizontalPaddingLandscape: 40,
    screenVerticalPadding: 24,

    // Two-Column Clinical Split Ratios
    dashboardLeftRatio: 0.65,
    dashboardRightRatio: 0.35,

    cameraLeftRatio: 0.60,
    cameraRightRatio: 0.40,

    reviewLeftRatio: 0.40,
    reviewRightRatio: 0.60,
  },

  tabletLayout: {
    contentMaxWidth: 1080,
    formMaxWidth: 960,
    narrowContentMaxWidth: 720,
    screenHorizontalPadding: 32,
    screenHorizontalPaddingLandscape: 40,
    screenVerticalPadding: 24,

    // Two-Column Clinical Split Ratios
    dashboardLeftRatio: 0.65,
    dashboardRightRatio: 0.35,

    cameraLeftRatio: 0.60,
    cameraRightRatio: 0.40,

    reviewLeftRatio: 0.40,
    reviewRightRatio: 0.60,
  },

  // Responsive Breakpoints
  breakpoints: {
    phone: 600,
    smallTablet: 768,
    tabletLandscape: 1024,
    largeTablet: 1280,
  },

  // Centralized Input State Tokens
  inputStates: {
    default: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1.5,
      textColor: '#0F172A',
      placeholderColor: '#94A3B8',
    },
    focused: {
      backgroundColor: '#FFFFFF',
      borderColor: '#1A56DB',
      borderWidth: 2,
      textColor: '#0F172A',
      placeholderColor: '#94A3B8',
    },
    error: {
      backgroundColor: '#FEF2F2',
      borderColor: '#EF4444',
      borderWidth: 1.5,
      textColor: '#0F172A',
      placeholderColor: '#94A3B8',
    },
    disabled: {
      backgroundColor: '#F1F5F9',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textColor: '#94A3B8',
      placeholderColor: '#CBD5E1',
    },
    readonly: {
      backgroundColor: '#F8FAFC',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      textColor: '#334155',
      placeholderColor: '#94A3B8',
    },
    success: {
      backgroundColor: '#F0FDF4',
      borderColor: '#15803D',
      borderWidth: 1.5,
      textColor: '#0F172A',
      placeholderColor: '#94A3B8',
    },
  },

  // Accessibility Tokens
  accessibility: {
    minimumTouchTarget: 48,
    minTouchTarget: 48,
    iconButtonSize: 48,
    primaryButtonHeight: 60,
    primaryCtaHeight: 60,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    hitSlopLarge: { top: 14, bottom: 14, left: 14, right: 14 },
  },

  // Motion & Interaction Tokens (Calm, Professional, Non-Decorative)
  interaction: {
    pressOpacity: 0.85,
    shortAnimationMs: 150,
    standardAnimationMs: 200,
    modalTransitionMs: 250,
  },
};

// Reusable Theme Utilities
export const getRiskColors = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'urgent':
      return {
        text: ClinicalTheme.colors.riskUrgent,
        bg: ClinicalTheme.colors.riskUrgentBg,
        border: ClinicalTheme.colors.riskUrgentBorder,
      };
    case 'high':
      return {
        text: ClinicalTheme.colors.riskHigh,
        bg: ClinicalTheme.colors.riskHighBg,
        border: ClinicalTheme.colors.riskHighBorder,
      };
    case 'moderate':
      return {
        text: ClinicalTheme.colors.riskModerate,
        bg: ClinicalTheme.colors.riskModerateBg,
        border: ClinicalTheme.colors.riskModerateBorder,
      };
    default:
      return {
        text: ClinicalTheme.colors.riskLow,
        bg: ClinicalTheme.colors.riskLowBg,
        border: ClinicalTheme.colors.riskLowBorder,
      };
  }
};

export const getStatusColors = (status?: string) => {
  switch (status) {
    case 'DOCTOR_VALIDATED':
      return {
        text: ClinicalTheme.colors.riskLow,
        bg: ClinicalTheme.colors.riskLowBg,
        border: ClinicalTheme.colors.riskLowBorder,
      };
    case 'PENDING_DOCTOR_REVIEW':
    case 'COMPLETED':
      return {
        text: ClinicalTheme.colors.statusPending,
        bg: ClinicalTheme.colors.statusPendingBg,
        border: ClinicalTheme.colors.statusPendingBorder,
      };
    case 'REASSESSMENT_REQUESTED':
      return {
        text: ClinicalTheme.colors.riskUrgent,
        bg: ClinicalTheme.colors.riskUrgentBg,
        border: ClinicalTheme.colors.riskUrgentBorder,
      };
    default:
      return {
        text: ClinicalTheme.colors.textMuted,
        bg: ClinicalTheme.colors.surfaceMuted,
        border: ClinicalTheme.colors.borderMedium,
      };
  }
};

export const getDeviceCategory = (
  width: number
): 'phone' | 'smallTablet' | 'tabletLandscape' | 'largeTablet' => {
  if (width >= ClinicalTheme.breakpoints.largeTablet) return 'largeTablet';
  if (width >= ClinicalTheme.breakpoints.tabletLandscape) return 'tabletLandscape';
  if (width >= ClinicalTheme.breakpoints.smallTablet) return 'smallTablet';
  return 'phone';
};

export const getResponsiveSpacing = (
  category: 'phone' | 'smallTablet' | 'tabletLandscape' | 'largeTablet'
) => {
  switch (category) {
    case 'largeTablet':
      return { pagePadding: 48, columnGap: 32, cardPadding: 28 };
    case 'tabletLandscape':
      return { pagePadding: 40, columnGap: 24, cardPadding: 24 };
    case 'smallTablet':
      return { pagePadding: 24, columnGap: 16, cardPadding: 20 };
    default:
      return { pagePadding: 16, columnGap: 12, cardPadding: 16 };
  }
};

export const getTypography = (
  variant: keyof typeof ClinicalTheme.typography,
  isHindi: boolean = false
) => {
  if (isHindi && variant in ClinicalTheme.typographyHindi) {
    return (ClinicalTheme.typographyHindi as any)[variant];
  }
  return ClinicalTheme.typography[variant];
};

export const getButtonVariant = (
  variant: 'primary' | 'cobalt' | 'teal' | 'danger'
) => {
  switch (variant) {
    case 'cobalt':
      return {
        backgroundColor: ClinicalTheme.colors.primaryAccent,
        textColor: ClinicalTheme.colors.textWhite,
      };
    case 'teal':
      return {
        backgroundColor: ClinicalTheme.colors.secondary,
        textColor: ClinicalTheme.colors.textWhite,
      };
    case 'danger':
      return {
        backgroundColor: ClinicalTheme.colors.riskUrgent,
        textColor: ClinicalTheme.colors.textWhite,
      };
    default:
      return {
        backgroundColor: ClinicalTheme.colors.primary,
        textColor: ClinicalTheme.colors.textWhite,
      };
  }
};

// Standalone Named Exports for Convenience
export const SPACING = ClinicalTheme.spacing;
export const RADIUS = ClinicalTheme.radius;
export const ELEVATION = ClinicalTheme.elevation;
export const TOUCH_TARGETS = ClinicalTheme.touchTargets;
export const TABLET_LAYOUT = ClinicalTheme.tablet;
export const INPUT_STATES = ClinicalTheme.inputStates;
export const ACCESSIBILITY = ClinicalTheme.accessibility;
export const INTERACTION = ClinicalTheme.interaction;
