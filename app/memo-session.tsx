/**
 * شاشة جلسة حفظ تفاعلية (Flashcards):
 * - تعرض نص الآية مع إمكانية إخفاء/كشف
 * - وضع "اقرأ → اختبر" حيث الكلمات تختفي تدريجياً
 * - يحدّد قوة الحفظ بعد كل بطاقة (صعب/متوسط/أتقنت)
 * - يستدعي markTaskMemorized من الـ store الذي يولّد المهمة التالية تلقائياً
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button, ProgressBar } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { getSurahById, arabicNumber } from '@data/surahs';
import { getSurahAyahs } from '@services/quranApi';
import { useMemoStore } from '@store/index';
import { useT } from '@store/languageStore';
import { Ayah, MemorizationStrength } from '@/types/index';

type Mode = 'reveal' | 'cloze' | 'recall';

export default function MemoSessionScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks, markTaskMemorized, startLearningTask } = useMemoStore();

  const task = useMemo(() => tasks.find((x) => x.id === taskId), [taskId, tasks]);
  const surah = useMemo(() => (task ? getSurahById(task.surahId) : null), [task]);

  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<Mode>('reveal');
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!task || !surah) return;
    let mounted = true;
    setAyahs(null);
    setError(null);
    getSurahAyahs(surah.id)
      .then((all) => {
        if (!mounted) return;
        // اقطع النطاق المطلوب فقط
        const slice = all.filter((a) => a.number >= task.ayahFrom && a.number <= task.ayahTo);
        setAyahs(slice);
        // إذا كانت جديدة، انقلها لحالة learning
        if (task.status === 'new') startLearningTask(task.id);
      })
      .catch(() => mounted && setError('تعذّر تحميل نص الآيات - تحقق من الاتصال'));
    return () => { mounted = false; };
  }, [task?.id, surah?.id]);

  if (!task || !surah) {
    return (
      <Screen>
        <Text>المهمة غير موجودة.</Text>
      </Screen>
    );
  }

  const current = ayahs?.[idx];
  const totalCards = ayahs?.length ?? 0;
  const progress = totalCards > 0 ? (idx + 1) / totalCards : 0;

  const handleRate = (strength: MemorizationStrength) => {
    // آخر بطاقة - علّم المهمة كلها كمحفوظة
    if (idx === totalCards - 1) {
      markTaskMemorized(task.id, strength);
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setRevealed(false);
  };

  const handlePrev = () => {
    setIdx((i) => Math.max(0, i - 1));
    setRevealed(false);
  };

  const handleNext = () => {
    setIdx((i) => Math.min(totalCards - 1, i + 1));
    setRevealed(false);
  };

  // تطبيق وضع cloze: إخفاء بعض الكلمات
  const renderClozeText = (text: string) => {
    if (revealed) return text;
    const words = text.split(/\s+/);
    // اخفِ كل كلمة ثانية
    return words.map((w, i) => (i % 2 === 0 ? w : '___')).join(' ');
  };

  // وضع recall: إخفاء كل النص
  const renderRecallText = (text: string) => (revealed ? text : '⋯ ⋯ ⋯ ⋯');

  // شاشة الإنهاء
  if (finished) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <LinearGradient
          colors={[t.colors.primary, t.colors.primaryDark]}
          style={styles.finishHero}
        >
          <Sparkles size={56} color="#FBF7EA" />
          <Text style={[styles.finishTitle, { color: '#FBF7EA' }]}>أحسنت!</Text>
          <Text style={[styles.finishSub, { color: 'rgba(251,247,234,0.85)' }]}>
            حفظت {arabicNumber(totalCards)} آية من سورة {surah.nameAr}
          </Text>
          <View style={{ marginTop: 18 }}>
            <OrnamentalRule width={120} color="#FBF7EA" variant="rosette" />
          </View>
          <Text style={[styles.finishHint, { color: 'rgba(251,247,234,0.7)' }]}>
            تم جدولة المراجعة التالية وتوليد المهمة الجديدة في خطتك
          </Text>
        </LinearGradient>
        <View style={{ padding: 16, gap: 12 }}>
          <Button label="العودة للحفظ" iconLeft={<Check size={16} color={t.colors.onPrimary} />} onPress={() => router.replace('/(tabs)/memorization')} />
          <Button label="ابدأ المهمة التالية" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>جلسة حفظ</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{surah.nameAr}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 30 }}>
        {/* شريط التقدّم */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text variant="caption" color={t.colors.textSecondary}>
              {arabicNumber(idx + 1)} / {arabicNumber(totalCards)} آية
            </Text>
            <Text variant="caption" color={t.colors.textTertiary}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <ProgressBar value={progress} color={t.colors.accent} height={6} />
        </View>

        {/* مبدّل الوضع */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <ModeChip label="كشف" active={mode === 'reveal'} onPress={() => { setMode('reveal'); setRevealed(true); }} />
          <ModeChip label="كلمات ناقصة" active={mode === 'cloze'} onPress={() => { setMode('cloze'); setRevealed(false); }} />
          <ModeChip label="تذكّر" active={mode === 'recall'} onPress={() => { setMode('recall'); setRevealed(false); }} />
        </View>

        {/* الخطأ */}
        {error ? (
          <Card padding={14} elevation="xs" bordered background={t.colors.error + '14'} style={{ marginBottom: 14 }}>
            <Text variant="bodySm" color={t.colors.error}>{error}</Text>
          </Card>
        ) : null}

        {/* البطاقة */}
        {!ayahs ? (
          <Card padding={32} elevation="sm" bordered>
            <ActivityIndicator color={t.colors.accent} size="large" />
            <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ marginTop: 14 }}>
              جارٍ تحميل الآيات...
            </Text>
          </Card>
        ) : current ? (
          <Card padding={t.spacing.xl} elevation="sm" bordered style={{ alignItems: 'center', minHeight: 220 }}>
            <Text variant="caption" color={t.colors.accent} style={{ letterSpacing: 2, fontWeight: '700' }}>
              ◇  الآية {arabicNumber(current.number)}  ◇
            </Text>
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 28,
                  lineHeight: 56,
                  textAlign: 'center',
                  fontFamily: t.fontFamilies.arabicQuran,
                  color: t.colors.textPrimary,
                  fontWeight: '500',
                }}
              >
                {mode === 'reveal' ? current.text :
                 mode === 'cloze'  ? renderClozeText(current.text) :
                                     renderRecallText(current.text)}
              </Text>
            </View>

            {/* زر الكشف للأوضاع غير reveal */}
            {mode !== 'reveal' ? (
              <Pressable
                onPress={() => setRevealed((r) => !r)}
                style={[styles.revealBtn, { borderColor: t.colors.accent, backgroundColor: revealed ? t.colors.accent + '14' : 'transparent' }]}
              >
                {revealed ? <EyeOff size={16} color={t.colors.accent} /> : <Eye size={16} color={t.colors.accent} />}
                <Text variant="label" color={t.colors.accent} style={{ marginStart: 6 }}>
                  {revealed ? 'إخفاء' : 'كشف الآية'}
                </Text>
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        {/* ملاحة بين البطاقات */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'center' }}>
          <Pressable onPress={handlePrev} disabled={idx === 0} style={[styles.navBtn, { borderColor: t.colors.border, opacity: idx === 0 ? 0.4 : 1 }]}>
            <ChevronRight size={20} color={t.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={() => setRevealed((r) => !r)} style={[styles.navBtn, { borderColor: t.colors.accent }]}>
            <RotateCcw size={18} color={t.colors.accent} />
          </Pressable>
          <Pressable onPress={handleNext} disabled={idx >= totalCards - 1} style={[styles.navBtn, { borderColor: t.colors.border, opacity: idx >= totalCards - 1 ? 0.4 : 1 }]}>
            <ChevronLeft size={20} color={t.colors.textPrimary} />
          </Pressable>
        </View>

        {/* أزرار التقييم - تظهر عندما يكشف المستخدم آخر بطاقة */}
        {ayahs && idx === totalCards - 1 && (revealed || mode === 'reveal') ? (
          <View style={{ marginTop: 24 }}>
            <Text variant="subtitle" align="center" style={{ marginBottom: 12 }}>كيف وجدت الحفظ؟</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="صعب" variant="outline" onPress={() => handleRate('weak')} style={{ flex: 1, borderColor: t.colors.error }} />
              <Button label="متوسط" variant="outline" onPress={() => handleRate('medium')} style={{ flex: 1, borderColor: t.colors.primary }} />
              <Button label="أتقنت" onPress={() => handleRate('strong')} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const ModeChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeChip,
        {
          borderColor: active ? t.colors.accent : t.colors.border,
          backgroundColor: active ? t.colors.accent + '14' : 'transparent',
        },
      ]}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: '700',
        color: active ? t.colors.accent : t.colors.textSecondary,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  revealBtn: {
    marginTop: 18,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderRadius: 999,
  },

  navBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  modeChip: {
    flex: 1, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 999,
  },

  finishHero: {
    paddingTop: 80, paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  finishTitle: {
    fontSize: 36, fontWeight: '700',
    marginTop: 14,
  },
  finishSub: {
    fontSize: 15, fontWeight: '500',
    marginTop: 8, textAlign: 'center',
  },
  finishHint: {
    fontSize: 12, marginTop: 14,
    textAlign: 'center', letterSpacing: 0.5,
  },
});
