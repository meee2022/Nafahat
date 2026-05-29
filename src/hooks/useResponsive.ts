/**
 * 📐 hook التجاوب المركزي — يوحّد منطق العرض/الاتجاه/الأعمدة لكل الشاشات.
 *
 * يُستخدم لجعل التطبيق (المصمَّم رأسياً) يبدو لائقاً في الوضع الأفقي والأجهزة
 * اللوحية: نحدّد عرضاً أقصى للمحتوى القرائي ونوسّطه، ونزيد أعمدة القوائم.
 */
import { useWindowDimensions } from 'react-native';

export interface Responsive {
  /** عرض النافذة الحالي (يتحدّث عند الدوران). */
  width: number;
  /** ارتفاع النافذة الحالي. */
  height: number;
  /** هل الجهاز في الوضع الأفقي. */
  isLandscape: boolean;
  /** شاشة عريضة (أفقي موبايل أو لوحي) — العتبة ٧٠٠px. */
  isWide: boolean;
  /** جهاز لوحي تقريبياً (البُعد الأقصر ≥ ٦٠٠px). */
  isTablet: boolean;
  /** أقصى عرض للمحتوى القرائي ليبقى مقروءاً ومتوسّطاً في الشاشات العريضة. */
  contentMaxWidth: number;
  /**
   * يحسب عدد الأعمدة المناسب لقائمة شبكية:
   * يزيد العدد الأساسي حسب اتّساع الشاشة.
   */
  gridColumns: (base: number) => number;
  /** معامل تكبير الخط في الوضع الأفقي/العريض (للقراءة الأوسع). */
  fontBoost: number;
}

/** عتبة الشاشة العريضة بالـ px. */
const WIDE_BREAKPOINT = 700;
/** عتبة الجهاز اللوحي (أقصر بُعد). */
const TABLET_BREAKPOINT = 600;

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWide = width >= WIDE_BREAKPOINT;
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;

  // عرض المحتوى الأقصى: في الشاشات العريضة نقيّده ليبقى مقروءاً ومتوسّطاً،
  // وإلا نملأ العرض كاملاً.
  const contentMaxWidth = isWide ? Math.min(width, isTablet ? 860 : 720) : width;

  const gridColumns = (base: number): number => {
    if (width >= 1100) return base + 2;
    if (isWide) return base + 1;
    return base;
  };

  // تكبير خفيف للنص عند العرض الكبير (القراءة الأفقية تستفيد من حجم أكبر).
  const fontBoost = isWide ? 1.12 : 1;

  return { width, height, isLandscape, isWide, isTablet, contentMaxWidth, gridColumns, fontBoost };
}
