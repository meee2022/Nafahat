/**
 * منطق التكرار المتباعد (Spaced Repetition) - SM-2 مبسّط بمعامل صعوبة لكل مهمة.
 * - يدعم lapse handling: عند الفشل (weak) يقصر الفاصل بدل أن يبدأ من الصفر
 * - الفاصل التالي = الفاصل الحالي × معامل الجودة
 * - الفاصل لا ينقص أبداً تحت 1 يوم لإبقاء المراجعة فعّالة
 */

import { MemorizationStrength, MemorizationTask, MemorizationPlan } from '@/types/index';

const DAY = 86400000;

/**
 * يحسب الفاصل التالي للمراجعة.
 *
 * الجدول الأساسي:
 *   التكرار الأول:  1 يوم
 *   التكرار الثاني: 3 أيام
 *   التكرار الثالث: 7 أيام
 *   التكرار الرابع: 14 يوم
 *   التكرار الخامس: 30 يوم
 *   التكرار السادس+: 60 يوم
 *
 * معاملات الجودة:
 *   weak (صعب):   0.6 × → يقصّر الفاصل (lapse)
 *   medium:        1.3 ×
 *   strong (أتقنت): 2.0 ×
 */
export function scheduleNextReview(
  repetitions: number,
  strength: MemorizationStrength,
): { intervalDays: number; nextAt: number } {
  const factor = strength === 'strong' ? 2.0 : strength === 'medium' ? 1.3 : 0.6;

  const base =
    repetitions <= 1 ? 1 :
    repetitions === 2 ? 3 :
    repetitions === 3 ? 7 :
    repetitions === 4 ? 14 :
    repetitions === 5 ? 30 :
    60;

  // للتكرار الأول الضعيف نُبقي يوماً واحداً (لا نقصّر)
  let intervalDays = Math.max(1, Math.round(base * factor));

  // ضع حدّاً أقصى منطقياً
  intervalDays = Math.min(intervalDays, 180);

  return { intervalDays, nextAt: Date.now() + intervalDays * DAY };
}

export function getDueTasks(tasks: MemorizationTask[]): MemorizationTask[] {
  const now = Date.now();
  return tasks
    .filter((t) => t.status !== 'new' && (t.nextReviewAt ?? 0) <= now)
    .sort((a, b) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0));
}

/**
 * يرجع مهام اليوم مقسّمة:
 * - new: المهام الجديدة المقترحة لليوم (محدودة بـ dailyAmount/range)
 * - due: مراجعات مستحقّة خلال 24 ساعة
 * - inProgress: قيد الحفظ حالياً
 */
export function getTodaysTasks(
  tasks: MemorizationTask[],
  plan?: MemorizationPlan,
): {
  new: MemorizationTask[];
  due: MemorizationTask[];
  inProgress: MemorizationTask[];
} {
  const now = Date.now();
  const inOneDay = now + DAY;

  // عدد المهام الجديدة المسموحة لليوم: نأخذ من dailyAmount أو الافتراضي 2
  const newLimit = plan ? Math.max(1, Math.min(5, Math.ceil(plan.dailyAmount / 5))) : 2;

  return {
    new: tasks.filter((t) => t.status === 'new').slice(0, newLimit),
    due: tasks.filter((t) => t.status !== 'new' && (t.nextReviewAt ?? 0) <= inOneDay),
    inProgress: tasks.filter((t) => t.status === 'learning'),
  };
}

export interface PlanProgress {
  totalTasks: number;
  memorized: number;
  inProgress: number;
  due: number;
  percent: number;
}

export function computePlanProgress(tasks: MemorizationTask[]): PlanProgress {
  const total = tasks.length || 1;
  const memorized = tasks.filter((t) => t.status === 'memorized').length;
  const inProgress = tasks.filter((t) => t.status === 'learning').length;
  const due = getDueTasks(tasks).length;
  return {
    totalTasks: tasks.length,
    memorized,
    inProgress,
    due,
    percent: Math.round((memorized / total) * 100),
  };
}

/**
 * يقترح خطة حفظ تلقائية حسب عدد الآيات اليومي والمدة الإجمالية.
 */
export function suggestPlan(targetVerses: number, daysAvailable: number) {
  const dailyAmount = Math.max(1, Math.ceil(targetVerses / daysAvailable));
  return {
    dailyAmount,
    estimatedDays: Math.ceil(targetVerses / dailyAmount),
    weeklyAmount: dailyAmount * 6,
  };
}

/**
 * يحوّل ms المتبقي إلى نص بشري ("بعد 3 أيام"، "اليوم"، "متأخّر بـ 5 أيام").
 */
export function formatReviewTimeAr(nextReviewAt: number | undefined): string {
  if (!nextReviewAt) return '';
  const diff = nextReviewAt - Date.now();
  const days = Math.round(diff / DAY);
  if (days < 0) return `متأخّر بـ ${Math.abs(days)} يوم`;
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  return `بعد ${days} يوم`;
}
