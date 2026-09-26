/**
 * NariSetu Doctor - Clinical Healthcare Design System
 * 
 * Tablet-first clinical design language:
 * - Medical White background (#F8FAFC)
 * - Deep Medical Navy Primary (#0A2540 / #1E3A8A)
 * - Clinical Teal Secondary (#0D9488)
 * - Pure White Surfaces with soft neutral borders (#E2E8F0, #CBD5E1)
 * - Semantic clinical tier indicators (Low, Moderate, High, Urgent)
 * - Tablet touch ergonomics:
 *   • Touch targets: min 48–52px
 *   • Buttons: 52–56px
 *   • Checkbox / Options: 56–64px
 *   • Typography hierarchy: Screen Title (28–32px), Section (20–24px), Question (20–24px), Body (16–18px), Metadata (14–16px)
 */

export const ClinicalTheme = {
  colors: {
    // Brand & Clinical Primary
    primary: '#0A2540',       // Deep Clinical Navy
    primaryLight: '#1E3A8A',  // Hospital Blue
    primaryAccent: '#0284C7', // Clinical Cobalt
    primarySoft: '#EFF6FF',   // Subtle Blue Tint

    // Secondary & Accents
    secondary: '#0D9488',     // Clinical Teal
    secondarySoft: '#F0FDFA', // Subtle Teal Tint

    // Neutrals & Surfaces
    background: '#F8FAFC',    // Medical White (Slate 50)
    surface: '#FFFFFF',       // Pure White
    surfaceMuted: '#F1F5F9',  // Subtle Surface (Slate 100)
    surfaceHover: '#E2E8F0',  // Surface Highlight (Slate 200)

    // Borders & Dividers
    border: '#E2E8F0',        // Neutral Soft Gray
    borderMedium: '#CBD5E1',  // Stronger Gray
    borderFocus: '#0284C7',   // Focus Border

    // Typography
    textPrimary: '#0F172A',   // Dark Charcoal / Deep Navy
    textSecondary: '#334155', // Clinical Slate
    textMuted: '#64748B',     // Clinical Gray
    textLight: '#94A3B8',     // Soft Gray
    textWhite: '#FFFFFF',

    // Clinical Risk Tiers
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

    // Workflow Status
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

  typography: {
    screenTitle: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: -0.4,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    question: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#0F172A',
      lineHeight: 30,
      letterSpacing: -0.2,
    },
    bodyLarge: {
      fontSize: 17,
      lineHeight: 25,
      color: '#334155',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: '#334155',
    },
    metadata: {
      fontSize: 14,
      lineHeight: 20,
      color: '#64748B',
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#64748B',
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
  },

  dimensions: {
    minTouchTarget: 48,
    buttonHeight: 54,
    optionRowHeight: 58,
    checkboxRowHeight: 58,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    elevated: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
};
