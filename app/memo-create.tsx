/**
 * 🧠 Memorization Setup Wizard — إنشاء خطة حفظ مخصّصة.
 *
 * 3 خطوات بسيطة:
 *  1. اختيار نطاق السور (من → إلى)
 *  2. عدد الآيات اليومية
 *  3. أيام الأسبوع + وقت التذكير
 *
 * Identity: أخضر primary + ذهبي accent. كل خطوة بـ progress indicator أعلى الصفحة.
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, ChevronRight, Brain, Check, BookOpen, Clock, Calendar } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button } from '@components/ui';
import { useMemoStore } from '@store/index';
import { SURAHS, arabicNumber } from '@data/surahs';
import { OrnamentalRule } from '@components/ornaments';

const DAILY_AMOUNTS = [3, 5, 7, 10, 15, 20];
const DAYS_OPTIONS = [3, 5, 6, 7];
const REMINDER_TIMES = ['05:00', '06:00', '06:30', '07:00', '07:30', '08:00', '20:30', '22:00'];

export default function MemoCreateScreen() {
  const t = useTheme();
  const router = useRouter();
  const { createPlan, addTask } = useMemoStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: surah range
  const [startSurah, setStartSurah] = useState(78); // النبأ (جزء عمّ) كافتراضي
  const [endSurah, setEndSurah] = useState(114);
  const [pickerOpen, setPickerOpen] = useState<'start' | 'end' | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  // Step 2: daily amount
  const [dailyAmount, setDailyAmount] = useState(5);

  // Step 3: schedule
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [reminderTime, setReminderTime] = useState('06:30');

  const startSurahObj = useMemo(() => SURAHS.find((s) => s.id === startSurah), [startSurah]);
  const endSurahObj = useMemo(() => SURAHS.find((s) => s.id === endSurah), [endSurah]);

  const filteredSurahs = useMemo(() => {
    if (!pickerQuery.trim()) return SURAHS;
    const q = pickerQuery.trim().toLowerCase();
    return SURAHS.filter((s) => s.nameAr.includes(pickerQuery) || s.nameEn.toLowerCase().includes(q));
  }, [pickerQuery]);

  // 🧮 تقدير المدة لإنهاء الخطة
  const totalAyahs = useMemo(() => {
    return SURAHS.filter((s) => s.id >= startSurah && s.id <= endSurah)
      .reduce((sum, s) => sum + s.versesCount, 0);
  }, [startSurah, endSurah]);
  const estimatedDays = useMemo(() => Math.ceil(totalAyahs / dailyAmount), [totalAyahs, dailyAmount]);
  const estimatedWeeks = Math.ceil(estimatedDays / daysPerWeek);

  const handleCreate = () => {
    if (startSurah > endSurah) {
      Alert.alert('خطأ', 'سورة البداية لازم تكون قبل سورة النهاية أو نفسها');
      return;
    }
    createPlan({
      title: `${startSurahObj?.nameAr} → ${endSurahObj?.nameAr}`,
      unit: 'ayah',
      dailyAmount,
      startSurah,
      endSurah,
      daysPerWeek,
      reminderTime,
    });
    // أول مهمة
    const firstSurah = startSurahObj;
    if (firstSurah) {
      addTask({
        surahId: startSurah,
        ayahFrom: 1,
        ayahTo: Math.min(dailyAmount, firstSurah.versesCount),
        status: 'new',
      });
    }
    Alert.alert('✓ تم إنشاء الخطة', `${estimatedWeeks} أسبوع تقريباً لإكمال الخطة. وفّقك الله.`, [
      { text: 'تمام', onPress: () => router.back() },
    ]);
  };

  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: s <= step ? t.colors.accent : t.colors.surfaceAlt,
                borderColor: s <= step ? t.colors.accent : t.colors.border,
              },
            ]}
          >
            {s < step ? (
              <Check size={12} color="#FFF" />
            ) : (
              <Text style={{ color: s === step ? '#FFF' : t.colors.textTertiary, fontSize: 11, fontWeight: '800' }}>
                {arabicNumber(s)}
              </Text>
            )}
          </View>
          {s < 3 ? <View style={[styles.stepConnector, { backgroundColor: s < step ? t.colors.accent : t.colors.border }]} /> : null}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>خطة مخصّصة</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>إنشاء خطة حفظ</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <StepIndicator />

        {step === 1 ? (
          <Card padding={20} elevation="xs" bordered style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <BookOpen size={20} color={t.colors.accent} />
              <Text variant="h3">نطاق السور</Text>
            </View>
            <Text variant="caption" color={t.colors.textSecondary} style={{ marginBottom: 14 }}>
              اختر من أي سورة تبدأ وأين تنتهي. ابدأ صغير - الاستمرار أهم من الكمّ.
            </Text>

            <Pressable
              onPress={() => { setPickerOpen('start'); setPickerQuery(''); }}
              style={({ pressed }) => [styles.rangeBox, { borderColor: t.colors.borderGold, opacity: pressed ? 0.9 : 1 }]}
            >
              <Text variant="caption" color={t.colors.textTertiary} style={{ fontWeight: '700', letterSpacing: 0.5 }}>من سورة</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.textPrimary, marginTop: 4 }}>
                {startSurahObj?.nameAr} ({arabicNumber(startSurahObj?.versesCount ?? 0)} آية)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { setPickerOpen('end'); setPickerQuery(''); }}
              style={({ pressed }) => [styles.rangeBox, { borderColor: t.colors.borderGold, opacity: pressed ? 0.9 : 1, marginTop: 10 }]}
            >
              <Text variant="caption" color={t.colors.textTertiary} style={{ fontWeight: '700', letterSpacing: 0.5 }}>إلى سورة</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.textPrimary, marginTop: 4 }}>
                {endSurahObj?.nameAr} ({arabicNumber(endSurahObj?.versesCount ?? 0)} آية)
              </Text>
            </Pressable>

            <View style={[styles.totalBox, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold }]}>
              <Text variant="caption" color={t.colors.textSecondary}>إجمالي الآيات في النطاق</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: t.colors.accent, marginTop: 2 }}>
                {arabicNumber(totalAyahs)}
              </Text>
            </View>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card padding={20} elevation="xs" bordered style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Brain size={20} color={t.colors.accent} />
              <Text variant="h3">الكمّ اليومي</Text>
            </View>
            <Text variant="caption" color={t.colors.textSecondary} style={{ marginBottom: 14 }}>
              عدد الآيات اللي هتحفظها كل يوم. الـ SRS بيعيد الجدولة تلقائياً للمراجعة.
            </Text>

            <View style={styles.chipsGrid}>
              {DAILY_AMOUNTS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setDailyAmount(n)}
                  style={({ pressed }) => [
                    styles.amountChip,
                    {
                      backgroundColor: dailyAmount === n ? t.colors.primary : t.colors.surface,
                      borderColor: dailyAmount === n ? t.colors.accent : t.colors.borderGold,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} آيات يومياً`}
                >
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '800',
                    color: dailyAmount === n ? '#FFF' : t.colors.textPrimary,
                  }}>
                    {arabicNumber(n)}
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: dailyAmount === n ? 'rgba(255,255,255,0.8)' : t.colors.textTertiary,
                    marginTop: 2,
                  }}>
                    آية/يوم
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.totalBox, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold, marginTop: 18 }]}>
              <Text variant="caption" color={t.colors.textSecondary}>تقدير الإكمال</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: t.colors.accent, marginTop: 2 }}>
                {arabicNumber(estimatedDays)} يوم · {arabicNumber(estimatedWeeks)} أسبوع
              </Text>
            </View>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card padding={20} elevation="xs" bordered style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Calendar size={20} color={t.colors.accent} />
              <Text variant="h3">الجدول الزمني</Text>
            </View>
            <Text variant="caption" color={t.colors.textSecondary} style={{ marginBottom: 14 }}>
              كم يوم في الأسبوع ووقت التذكير اللي يناسبك.
            </Text>

            <Text variant="caption" color={t.colors.textTertiary} style={{ fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 }}>
              أيام الأسبوع
            </Text>
            <View style={styles.chipsRow}>
              {DAYS_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDaysPerWeek(d)}
                  style={({ pressed }) => [
                    styles.timeChip,
                    {
                      backgroundColor: daysPerWeek === d ? t.colors.primary : t.colors.surface,
                      borderColor: daysPerWeek === d ? t.colors.accent : t.colors.borderGold,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: daysPerWeek === d ? '#FFF' : t.colors.textPrimary }}>
                    {arabicNumber(d)} أيام
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 }}>
              <Clock size={12} color={t.colors.textTertiary} />
              <Text variant="caption" color={t.colors.textTertiary} style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                وقت التذكير
              </Text>
            </View>
            <View style={styles.chipsGrid}>
              {REMINDER_TIMES.map((tm) => (
                <Pressable
                  key={tm}
                  onPress={() => setReminderTime(tm)}
                  style={({ pressed }) => [
                    styles.timeChip,
                    {
                      backgroundColor: reminderTime === tm ? t.colors.primary : t.colors.surface,
                      borderColor: reminderTime === tm ? t.colors.accent : t.colors.borderGold,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: reminderTime === tm ? '#FFF' : t.colors.textPrimary }}>
                    {tm}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
        </View>

        {/* الـ navigation buttons */}
        <View style={styles.navRow}>
          {step > 1 ? (
            <Button label="السابق" variant="ghost" onPress={() => setStep((s) => (s - 1) as any)} />
          ) : <View />}
          {step < 3 ? (
            <Button label="التالي" onPress={() => setStep((s) => (s + 1) as any)} />
          ) : (
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: t.colors.accent, borderColor: t.colors.accentDeep, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="إنشاء الخطة"
            >
              <Check size={18} color="#0A1815" />
              <Text style={{ color: '#0A1815', fontSize: 15, fontWeight: '800' }}>إنشاء الخطة</Text>
            </Pressable>
          )}
        </View>
      </Screen>

      {/* ───── Modal: Surah picker ───── */}
      {pickerOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(null)} />
          <View style={[styles.modalSheet, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={styles.modalDragHandle} />
            <Text variant="h3" style={{ textAlign: 'center', marginBottom: 12 }}>
              اختر سورة {pickerOpen === 'start' ? 'البداية' : 'النهاية'}
            </Text>
            <TextInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="ابحث..."
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.modalInput, { borderColor: t.colors.border, color: t.colors.textPrimary, backgroundColor: t.colors.background }]}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 360, marginTop: 10 }}>
              {filteredSurahs.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    if (pickerOpen === 'start') {
                      setStartSurah(s.id);
                      if (s.id > endSurah) setEndSurah(s.id);
                    } else {
                      setEndSurah(s.id);
                      if (s.id < startSurah) setStartSurah(s.id);
                    }
                    setPickerOpen(null);
                    setPickerQuery('');
                  }}
                  style={({ pressed }) => [styles.surahRow, { backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' }]}
                >
                  <View style={[styles.surahNumBadge, { borderColor: t.colors.borderGold, backgroundColor: t.colors.primarySoft }]}>
                    <Text style={{ color: t.colors.accent, fontSize: 11, fontWeight: '800' }}>
                      {arabicNumber(s.id)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="subtitle">{s.nameAr}</Text>
                    <Text variant="caption" color={t.colors.textTertiary}>
                      {arabicNumber(s.versesCount)} آية · {s.revelationType === 'meccan' ? 'مكية' : 'مدنية'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepConnector: {
    width: 32, height: 2,
    marginHorizontal: 4,
  },
  rangeBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    alignItems: 'center',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountChip: {
    width: '30%',
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 28,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  modalDragHandle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  surahNumBadge: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
