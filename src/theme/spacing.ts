/**
 * نظام المسافات والزوايا والظلال - مُحدّث لرؤية "Editorial Sanctuary":
 * - مسافات أوسع (تنفّس بصري حقيقي)
 * - ظلال طبقية ناعمة (نسيج بدل أن تكون قاسية)
 * - زوايا متناسقة (8/16 أساس)
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  xxxl: 48,
  huge: 64,
  giant: 80,
} as const;

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

/**
 * ظلال طبقية - مبنية بأكثر من طبقة عبر تركيب الظل (sm + md + lg).
 * في React Native يمكن طبقة واحدة فقط، لكن الإعدادات نفسها مصمّمة لتبدو
 * ناعمة وعميقة بدل أن تكون شفّافة وحادة.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0A1612',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0A1612',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A1612',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0A1612',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 10,
  },
  xl: {
    shadowColor: '#0A1612',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.14,
    shadowRadius: 48,
    elevation: 16,
  },
  /** ظل ملوّن للبطاقات المميّزة - يأخذ لون الـ accent. */
  accent: {
    shadowColor: '#B8923B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const opacity = {
  disabled: 0.38,
  faded: 0.6,
  muted: 0.78,
  full: 1,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

/** أحجام شاشة معيارية للـ layouts. */
export const layout = {
  screenPadding: 20,
  sectionGap: 32,
  cardGap: 12,
  maxContentWidth: 720,
} as const;
