import { Achievement, AppStats, Challenge } from '@/types/index';

/**
 * تعريفات الإنجازات + دالة لحساب التقدم من إحصائيات المستخدم الفعلية.
 * لا توجد بيانات تجريبية - كل شيء يبدأ مقفلًا حتى يحققه المستخدم.
 */

export interface AchievementDef extends Omit<Achievement, 'unlocked' | 'progress'> {
  metric: keyof AppStats;
}

const DEFS: AchievementDef[] = [
  { id: 'a1', title: 'بداية الطريق',      description: 'أنهِ أول جلسة قراءة',           icon: 'Sparkles',   target: 1,    metric: 'sessionsCount' },
  { id: 'a2', title: 'سبعة أيام متتالية', description: 'حافظ على القراءة 7 أيام',       icon: 'Flame',      target: 7,    metric: 'streakDays' },
  { id: 'a3', title: 'حافظ صاعد',         description: 'احفظ 50 آية',                   icon: 'BookOpen',   target: 50,   metric: 'versesMemorized' },
  { id: 'a4', title: 'مستمع نَهِم',       description: 'استمع لـ 100 دقيقة من التلاوة', icon: 'Headphones', target: 100,  metric: 'listenedMinutes' },
  { id: 'a5', title: 'مُسبِّح',           description: 'ابلغ 1000 تسبيحة',              icon: 'Heart',      target: 1000, metric: 'tasbeehCount' },
  { id: 'a6', title: 'قارئ مثابر',        description: 'اقرأ 100 صفحة',                 icon: 'Feather',    target: 100,  metric: 'pagesRead' },
  { id: 'a7', title: 'ختمة كاملة',        description: 'اقرأ القرآن كاملًا (604 صفحة)',  icon: 'Award',      target: 604,  metric: 'pagesRead' },
  { id: 'a8', title: 'ثلاثون يومًا',      description: 'حافظ على السلسلة 30 يومًا',     icon: 'Sunrise',    target: 30,   metric: 'streakDays' },
];

export function computeAchievements(stats: AppStats): Achievement[] {
  return DEFS.map((d) => {
    const value = stats[d.metric] as number;
    const progress = Math.min(1, value / d.target);
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      target: d.target,
      progress,
      unlocked: value >= d.target,
    };
  });
}

/**
 * التحديات النشطة - تُولَّد عند الحاجة (لا توجد تحديات وهمية).
 */
export const CHALLENGES: Challenge[] = [];
