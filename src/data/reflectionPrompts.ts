/**
 * محفّزات تأمّل يومية - أسئلة تساعد المستخدم على التفكّر بآياته/يومه.
 * يُعرض واحد عشوائي كل يوم في شاشة الـ Notes.
 */

export interface ReflectionPrompt {
  id: string;
  prompt: string;
  icon: string;
  category: 'تدبر' | 'شكر' | 'دعاء' | 'محاسبة' | 'نمو';
}

export const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  // تدبر
  { id: 'r1',  category: 'تدبر',    icon: '📖', prompt: 'ما هي الآية التي لمست قلبك اليوم؟ ولماذا؟' },
  { id: 'r2',  category: 'تدبر',    icon: '✨', prompt: 'لو تأمّلت في سورة الفاتحة، أيّ آية تحتاج أن تعيش بها هذا الأسبوع؟' },
  { id: 'r3',  category: 'تدبر',    icon: '🌅', prompt: 'كيف يمكن لما قرأته اليوم أن يغيّر تعاملك مع الناس؟' },
  { id: 'r4',  category: 'تدبر',    icon: '🕊️', prompt: 'حدّد آية واحدة تذكّرك بصبر الأنبياء - كيف تستلهم منها؟' },

  // شكر
  { id: 'r5',  category: 'شكر',     icon: '🌟', prompt: 'اذكر ٣ نِعَم تعيشها اليوم ولم تكن تملكها قبل ٥ سنوات.' },
  { id: 'r6',  category: 'شكر',     icon: '☀️', prompt: 'لمن تشعر بالامتنان في حياتك اليوم؟ ولماذا؟' },
  { id: 'r7',  category: 'شكر',     icon: '💚', prompt: 'ما هي النعمة الخفيّة التي لم تلتفت إليها قبلاً؟' },
  { id: 'r8',  category: 'شكر',     icon: '🤲', prompt: 'لو أن صحتك من أعظم النعم، كيف تشكر الله عليها عملياً؟' },

  // دعاء
  { id: 'r9',  category: 'دعاء',    icon: '🌙', prompt: 'ما الدعاء الذي تريد إلحاحاً عليه هذا الشهر؟ ولماذا؟' },
  { id: 'r10', category: 'دعاء',    icon: '🤝', prompt: 'لمن تدعو سراً من أهل بيتك أو أصدقائك؟ ادعُ لهم الآن.' },
  { id: 'r11', category: 'دعاء',    icon: '🛤️', prompt: 'ما القرار الكبير الذي تحتاج فيه استخارة من الله؟' },

  // محاسبة
  { id: 'r12', category: 'محاسبة', icon: '🪞', prompt: 'ما هو الخُلق الذي ندمت على فقدانه اليوم؟' },
  { id: 'r13', category: 'محاسبة', icon: '📋', prompt: 'هل أعطيت كل صلاة من صلواتك اليوم حقّها؟' },
  { id: 'r14', category: 'محاسبة', icon: '⚖️', prompt: 'ماذا قلت اليوم لم يكن ينبغي أن يُقال؟' },
  { id: 'r15', category: 'محاسبة', icon: '🌱', prompt: 'إذا قُيِّمَ يومك بـ ١٠، ما الذي يمكنك تحسينه غداً؟' },

  // نمو
  { id: 'r16', category: 'نمو',     icon: '🌿', prompt: 'ما هي العادة الصالحة التي تريد إضافتها هذا الأسبوع؟' },
  { id: 'r17', category: 'نمو',     icon: '📚', prompt: 'ما هو الذنب الصغير الذي تتجاوزه عادةً ويستحقّ التوقّف عنه؟' },
  { id: 'r18', category: 'نمو',     icon: '🎯', prompt: 'هل اقتربت من حفظ سورة جديدة هذا الشهر؟ ضع هدفاً واضحاً.' },
  { id: 'r19', category: 'نمو',     icon: '🤍', prompt: 'كيف يمكنك أن تكون أرحم بنفسك ومن حولك غداً؟' },
  { id: 'r20', category: 'نمو',     icon: '🌅', prompt: 'لو عرفت أن غداً يومك الأخير، ما الذي ستُغيّر اليوم؟' },
];

/**
 * يرجع محفّزاً يوميّاً ثابتاً بناءً على تاريخ اليوم (نفس المحفّز خلال اليوم).
 */
export function getDailyPrompt(): ReflectionPrompt {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return REFLECTION_PROMPTS[dayOfYear % REFLECTION_PROMPTS.length];
}
