/**
 * بطاقة "مهمّة اليوم" - تعرض الإجراء الأهم للمستخدم في وقت محدّد:
 *  - قبل ٨ صباحاً: ورد الصباح / الأذكار
 *  - النهار: متابعة الحفظ / المراجعة المستحقّة
 *  - بعد المغرب: أذكار المساء
 *  - الليل: تأمّل في آية اليوم
 *
 * تُعطي المستخدم سياقاً وتحفيزاً يومياً بدلاً من شبكة بطاقات.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import {
  Sunrise, Sun, Sunset, Moon, ArrowLeft, Sparkles,
  BookOpen, Brain, Heart,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';

export interface DailyAction {
  id: string;
  /** أيقونة الإجراء. */
  icon: 'sunrise' | 'sun' | 'sunset' | 'moon' | 'book' | 'brain' | 'heart' | 'sparkles';
  /** عنوان قصير ("ورد الصباح" أو "مراجعة حفظك"). */
  title: string;
  /** نص توضيحي ("اقرأ ٥ صفحات قبل الظهر"). */
  subtitle: string;
  /** اسم الـ CTA ("ابدأ القراءة", "افتح الأذكار"). */
  cta: string;
  /** ألوان التدرّج. */
  gradient: [string, string];
  /** عنوان eyebrow (اختياري). */
  eyebrow?: string;
}

interface Props {
  action: DailyAction;
  onPress: () => void;
}

const ICON_MAP = {
  sunrise:  Sunrise,
  sun:      Sun,
  sunset:   Sunset,
  moon:     Moon,
  book:     BookOpen,
  brain:    Brain,
  heart:    Heart,
  sparkles: Sparkles,
};

export const DailyActionCard: React.FC<Props> = ({ action, onPress }) => {
  const Icon = ICON_MAP[action.icon];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <LinearGradient
        colors={action.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* نقش هندسي ذهبي */}
        <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} pointerEvents="none">
          <Defs>
            <Pattern id="daily-action-bg" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <Path
                d="M18,3 L21,14 L32,18 L21,22 L18,33 L15,22 L4,18 L15,14 Z"
                fill="none" stroke="#FBF7EA" strokeWidth={0.5}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#daily-action-bg)" />
        </Svg>

        {/* إطار ذهبي داخلي رفيع */}
        <View pointerEvents="none" style={styles.frame} />

        {/* عناصر زخرفية مضيئة */}
        <View style={[styles.decor, { top: -20, end: -20 }]} pointerEvents="none">
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </View>
        <View style={[styles.decor, { bottom: -30, start: -30 }]} pointerEvents="none">
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          {action.eyebrow ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>{action.eyebrow}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.subtitle}>{action.subtitle}</Text>

          <View style={styles.ctaWrap}>
            <View style={styles.ctaInner}>
              <Text style={styles.ctaText}>{action.cta}</Text>
              <ArrowLeft size={14} color="#FBF7EA" strokeWidth={2.4} />
            </View>
          </View>
        </View>

        <View style={styles.iconWrap}>
          <Icon size={42} color="#FBF7EA" strokeWidth={1.6} />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

/**
 * يحسب الإجراء المقترح بناءً على الساعة الحالية وحالة المستخدم.
 */
export interface DailyActionContext {
  /** كم صفحة قُرئت اليوم. */
  pagesReadToday?: number;
  /** هدف الصفحات اليومي. */
  pageGoal?: number;
  /** عدد المراجعات المستحقّة. */
  reviewsDue?: number;
  /** هل قرأ آية اليوم. */
  readDailyAyah?: boolean;
}

export function computeDailyAction(ctx: DailyActionContext = {}): DailyAction {
  const hour = new Date().getHours();
  const pagesGoal = ctx.pageGoal ?? 5;
  const pagesRead = ctx.pagesReadToday ?? 0;
  const wirdRemaining = Math.max(0, pagesGoal - pagesRead);

  // قبل الفجر/الصباح المبكّر - أذكار الصباح
  if (hour >= 4 && hour < 10) {
    return {
      id: 'morning-adhkar',
      icon: 'sunrise',
      eyebrow: 'صباحاً',
      title: 'ورد أذكار الصباح',
      subtitle: 'ابدأ يومك بحصن من ذكر الله - دقائق معدودة تكفيك',
      cta: 'افتح الأذكار',
      gradient: ['#F59E0B', '#D97706'],
    };
  }

  // بعد المغرب - أذكار المساء
  if (hour >= 17 && hour < 21) {
    return {
      id: 'evening-adhkar',
      icon: 'sunset',
      eyebrow: 'مساءً',
      title: 'ورد أذكار المساء',
      subtitle: 'سلام لروحك في نهاية اليوم - ذكر الله طمأنينة',
      cta: 'افتح الأذكار',
      gradient: ['#A855F7', '#6B21A8'],
    };
  }

  // الليل - تأمّل
  if (hour >= 21 || hour < 4) {
    return {
      id: 'night-reflect',
      icon: 'moon',
      eyebrow: 'الليلة',
      title: 'تأمّل في آية اليوم',
      subtitle: 'لحظات هادئة قبل النوم مع كتاب الله',
      cta: 'افتح آية اليوم',
      gradient: ['#0A3D38', '#062825'],
    };
  }

  // الظهيرة - حفظ أو مراجعة
  if (ctx.reviewsDue && ctx.reviewsDue > 0) {
    return {
      id: 'review',
      icon: 'brain',
      eyebrow: 'مهمّ',
      title: `${ctx.reviewsDue} مراجعة مستحقّة`,
      subtitle: 'لا تكسر الجدول - مراجعاتك تنتظرك اليوم',
      cta: 'ابدأ المراجعة',
      gradient: ['#DC2626', '#991B1B'],
    };
  }

  // الورد ناقص
  if (wirdRemaining > 0) {
    return {
      id: 'wird',
      icon: 'book',
      eyebrow: 'الورد اليومي',
      title: `بقي ${wirdRemaining} صفحات لإتمام وردك`,
      subtitle: 'أكمل قراءتك اليومية والحفاظ على السلسلة',
      cta: 'تابع القراءة',
      gradient: ['#0F4A41', '#062825'],
    };
  }

  // افتراضي - تشجيع
  return {
    id: 'default',
    icon: 'sparkles',
    eyebrow: 'أتممت وردك',
    title: 'أحسنت! استزد من الخير',
    subtitle: 'استمع لقارئك المفضل أو راجع حفظك',
    cta: 'افتح المكتبة الصوتية',
    gradient: ['#10B981', '#047857'],
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 140,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  decor: { position: 'absolute' },
  frame: {
    position: 'absolute',
    top: 10, bottom: 10, left: 10, right: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 247, 234, 0.22)',
  },
  eyebrowDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  eyebrow: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FBF7EA',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(251,247,234,0.85)',
    marginTop: 4,
    lineHeight: 19,
  },
  ctaWrap: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBF7EA',
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});
