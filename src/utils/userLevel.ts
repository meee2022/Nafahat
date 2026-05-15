/**
 * نظام المستويات الحقيقي - يُحسب من نشاط المستخدم الفعلي.
 *
 * كل نشاط بيدّي نقاط:
 *   - 1 صفحة مقروءة = 5 نقاط
 *   - 1 آية محفوظة = 10 نقاط
 *   - 100 تسبيحة = 5 نقاط
 *   - 30 دقيقة استماع = 5 نقاط
 *
 * المستويات تبدأ من 1 وتنتهي بـ 8 (مستويات أعلى تأخذ نقاط أكتر).
 */

import { AppStats } from '@/types/index';

export interface UserLevel {
  /** رقم المستوى (1-8). */
  level: number;
  /** الاسم العربي للمستوى. */
  title: string;
  /** الرمز التعبيري. */
  emoji: string;
  /** إجمالي النقاط. */
  points: number;
  /** نقاط بداية هذا المستوى. */
  currentMin: number;
  /** نقاط بداية المستوى التالي (أو -1 لو في أعلى مستوى). */
  nextMin: number;
  /** نسبة التقدّم لهذا المستوى (0-1). */
  progress: number;
  /** نقاط متبقّية للوصول للمستوى التالي. */
  pointsToNext: number;
}

const LEVELS: { min: number; title: string; emoji: string }[] = [
  { min:     0, title: 'مُتعرّف',        emoji: '🌱' },
  { min:    50, title: 'مبتدئ',          emoji: '📖' },
  { min:   200, title: 'طالب علم',       emoji: '📚' },
  { min:   500, title: 'حافظ مبتدئ',     emoji: '⭐' },
  { min:  1000, title: 'حافظ',           emoji: '🌟' },
  { min:  2000, title: 'متمرّس',         emoji: '🏅' },
  { min:  4000, title: 'عالم مبتدئ',     emoji: '🎓' },
  { min:  8000, title: 'متقن',           emoji: '🏆' },
];

/**
 * يحسب النقاط الكلية من إحصائيات المستخدم.
 */
export function computePoints(stats: AppStats): number {
  const pagesPoints      = (stats.pagesRead       ?? 0) * 5;
  const memorizedPoints  = (stats.versesMemorized ?? 0) * 10;
  const tasbeehPoints    = Math.floor((stats.tasbeehCount   ?? 0) / 100) * 5;
  const listenPoints     = Math.floor((stats.listenedMinutes?? 0) / 30) * 5;
  return pagesPoints + memorizedPoints + tasbeehPoints + listenPoints;
}

/**
 * يحسب المستوى من النقاط.
 */
export function computeLevelFromPoints(points: number): UserLevel {
  // ابحث عن أعلى مستوى وصلت له
  let levelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) {
      levelIdx = i;
      break;
    }
  }
  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1];
  const isMaxLevel = !next;

  const currentMin = current.min;
  const nextMin = isMaxLevel ? -1 : next.min;
  const range = isMaxLevel ? 1 : next.min - current.min;
  const inLevel = points - currentMin;
  const progress = isMaxLevel ? 1 : Math.min(1, inLevel / range);
  const pointsToNext = isMaxLevel ? 0 : Math.max(0, next.min - points);

  return {
    level: levelIdx + 1,
    title: current.title,
    emoji: current.emoji,
    points,
    currentMin,
    nextMin,
    progress,
    pointsToNext,
  };
}

/**
 * يحسب المستوى مباشرةً من الإحصائيات.
 */
export function computeUserLevel(stats: AppStats): UserLevel {
  return computeLevelFromPoints(computePoints(stats));
}
