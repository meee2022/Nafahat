/**
 * 📏 ثابت موحّد لحشو أعلى شريط العنوان يحترم الـ safe area (الشقّ/Dynamic Island).
 *
 * بدل paddingTop: 50 الثابت الذي كان يجعل زر الرجوع يطلع تحت الساعة على آيفون
 * الحديث، نقرأ insets.top الحقيقي من النظام (متاح متزامناً عند الإقلاع عبر
 * initialWindowMetrics) ونضيف هامشاً بسيطاً. يعمل على كل الأجهزة:
 *   - أندرويد عادي: ~24-40
 *   - آيفون بشقّ: ~47
 *   - آيفون Dynamic Island: ~59
 */
import { initialWindowMetrics } from 'react-native-safe-area-context';

const topInset = initialWindowMetrics?.insets?.top ?? 20;

/** حشو أعلى شريط العنوان (insets.top + هامش راحة). */
export const TOP_BAR_PAD = topInset + 10;
