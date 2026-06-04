/**
 * شاشة التسبيح - تصميم mandala هندسي ساحر:
 * - دائرة مركزية بنقش نجمة 16-بتلة
 * - رقم العداد بخط ذهبي ضخم
 * - حلقات تظهر التقدم
 * - زخارف محيطة بنبضات
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { ArrowRight, RotateCcw, Vibrate, Volume2, VolumeX, Settings2, Check, X } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text } from '@components/ui';
import { useTasbeehStore, useStatsStore } from '@store/index';
import { arabicNumber } from '@data/surahs';
import { OrnamentalRule } from '@components/ornaments';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function TasbeehScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const SIZE = Math.min(width - 48, 340);
  const { items, selectedId, select, increment, reset, setGoal, todayCount } = useTasbeehStore();
  const incrementStats = useStatsStore((s) => s.incrementTasbeeh);

  const current = items.find((i) => i.id === selectedId)!;
  const progress = current.goal > 0 ? current.current / current.goal : 0;
  const isComplete = current.current >= current.goal;

  // ⚙️ إعدادات السبحة
  const [vibrate, setVibrate] = useState(true);
  const [sound, setSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 🔊 مشغّل صوت النقرة (يُنشأ مرّة واحدة)
  const tickPlayer = useRef<AudioPlayer | null>(null);
  if (sound && !tickPlayer.current) {
    try {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      tickPlayer.current = createAudioPlayer(require('../assets/sounds/tick.wav'));
    } catch {}
  }

  // تحرير مشغّل صوت النقرة عند الخروج من الشاشة
  useEffect(() => {
    return () => {
      try { tickPlayer.current?.remove(); } catch {}
      tickPlayer.current = null;
    };
  }, []);

  const handleTap = () => {
    increment();
    incrementStats(1);
    if (vibrate) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (sound && tickPlayer.current) {
      try { tickPlayer.current.seekTo(0); tickPlayer.current.play(); } catch {}
    }
  };

  const goalOptions = [33, 99, 100, 500, 1000];

  // نجمة 16 بتلة للدائرة المركزية
  const renderStarPattern = () => {
    const cx = 50, cy = 50;
    const points: string[] = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 48 : 36;
      const angle = (i * Math.PI) / 8 - Math.PI / 2;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M${points.join(' L')} Z`;
  };

  // 16 شعاع
  const renderRays = () => {
    const rays = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const x1 = 50 + 14 * Math.cos(angle);
      const y1 = 50 + 14 * Math.sin(angle);
      const x2 = 50 + 18 * Math.cos(angle);
      const y2 = 50 + 18 * Math.sin(angle);
      rays.push(<Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.colors.accent} strokeWidth={0.3} opacity={0.4} />);
    }
    return rays;
  };

  // محيط التقدم - نقاط حول الدائرة
  const renderProgressDots = () => {
    const total = 60;
    const filled = Math.round(progress * total);
    const dots = [];
    for (let i = 0; i < total; i++) {
      const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
      const r = 48;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      const color = i < filled ? (isComplete ? t.colors.accent : t.colors.primary) : t.colors.border;
      const size = i < filled ? 0.9 : 0.5;
      dots.push(<Circle key={i} cx={x} cy={y} r={size} fill={color} />);
    }
    return dots;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* الترويسة */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={t.hitSlop}
          accessible
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('tasbeeh.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('tasbeeh.title')}</Text>
        </View>
        <View style={[styles.todayPill, { borderColor: t.colors.borderGold }]}>
          <Text style={[styles.todayPillText, { color: t.colors.textPrimary }]}>{tr('tasbeeh.today')}</Text>
          <Text style={[styles.todayPillNum, { color: t.colors.accent }]}>{arabicNumber(todayCount)}</Text>
        </View>
      </View>

      <Screen scrollable={false} contentStyle={{ paddingHorizontal: 0 }}>
        {/* اختيار الذكر */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {items.slice(0, 5).map((it) => {
              const active = it.id === selectedId;
              return (
                <Pressable
                  key={it.id}
                  onPress={() => select(it.id)}
                  style={[
                    styles.dhikrChip,
                    {
                      borderColor: active ? t.colors.accent : t.colors.border,
                      backgroundColor: active ? t.colors.accent + '14' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? t.colors.accent : t.colors.textSecondary }}>
                    {it.text.length > 18 ? it.text.slice(0, 18) + '…' : it.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* الذكر الحالي */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 8 }}>
          <Text style={[styles.dhikrText, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}>
            {current.text}
          </Text>
        </View>

        {/* MANDALA المركزية */}
        <View style={styles.mandalaWrap}>
          <Pressable
            onPress={handleTap}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="centerGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor={t.colors.surface} stopOpacity="1" />
                  <Stop offset="70%" stopColor={t.colors.surface} stopOpacity="1" />
                  <Stop offset="100%" stopColor={t.colors.surfaceAlt} stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id="ringGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor={isComplete ? t.colors.accent : t.colors.primary} stopOpacity="0.18" />
                  <Stop offset="100%" stopColor={isComplete ? t.colors.accent : t.colors.primary} stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* هالة خارجية ناعمة */}
              <Circle cx="50" cy="50" r="50" fill="url(#ringGrad)" />

              {/* نقاط التقدم على المحيط */}
              <G>{renderProgressDots()}</G>

              {/* الحلقة الذهبية الخارجية */}
              <Circle cx="50" cy="50" r="42" fill="none" stroke={t.colors.accent} strokeWidth={0.3} opacity={0.55} />
              <Circle cx="50" cy="50" r="40" fill="none" stroke={t.colors.accent} strokeWidth={0.6} />

              {/* النجمة الكبيرة الخلفية */}
              <Path
                d={renderStarPattern()}
                fill={t.colors.accent + '08'}
                stroke={t.colors.accent}
                strokeWidth={0.5}
                opacity={0.5}
              />

              {/* الدائرة المركزية */}
              <Circle cx="50" cy="50" r="32" fill="url(#centerGrad)" />
              <Circle cx="50" cy="50" r="32" stroke={t.colors.accent} strokeWidth={0.8} fill="none" />
              <Circle cx="50" cy="50" r="29" stroke={t.colors.accent} strokeWidth={0.3} fill="none" opacity={0.5} />

              {/* أشعة */}
              <G>{renderRays()}</G>

              {/* نجمة صغيرة في المنتصف خلف الرقم */}
              <Path
                d="M50,30 L52,46 L68,50 L52,54 L50,70 L48,54 L32,50 L48,46 Z"
                fill={t.colors.accent}
                opacity={0.06}
              />
            </Svg>

            {/* الرقم في المنتصف */}
            <View style={styles.numberOverlay} pointerEvents="none">
              <Text style={[styles.bigNumber, { color: isComplete ? t.colors.accent : t.colors.primary }]}>
                {arabicNumber(current.current)}
              </Text>
              <View style={{ marginTop: 4 }}>
                <OrnamentalRule width={48} color={t.colors.accent} variant="simple" />
              </View>
              <Text style={[styles.targetText, { color: t.colors.textTertiary }]}>
                من {arabicNumber(current.goal)}
              </Text>
            </View>
          </Pressable>

          {isComplete ? (
            <View style={[styles.completePill, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent }]}>
              <Text style={[styles.completeText, { color: t.colors.accent }]}>
                {tr('tasbeeh.complete')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: t.colors.textTertiary }]}>
              {tr('tasbeeh.tapToCount')}
            </Text>
          )}
        </View>

        {/* أزرار سفلية */}
        <View style={styles.bottomActions}>
          <ActionBtn
            icon={<RotateCcw size={18} color={t.colors.textPrimary} strokeWidth={1.6} />}
            label={tr('tasbeeh.reset')}
            onPress={() => { reset(selectedId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); }}
          />
          <ActionBtn
            icon={<Vibrate size={18} color={vibrate ? t.colors.accent : t.colors.textPrimary} strokeWidth={1.6} />}
            label={tr('tasbeeh.vibrate')}
            active={vibrate}
            onPress={() => { setVibrate((v) => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }}
          />
          <ActionBtn
            icon={sound
              ? <Volume2 size={18} color={t.colors.accent} strokeWidth={1.6} />
              : <VolumeX size={18} color={t.colors.textPrimary} strokeWidth={1.6} />}
            label={tr('tasbeeh.sound')}
            active={sound}
            onPress={() => setSound((s) => !s)}
          />
          <ActionBtn
            icon={<Settings2 size={18} color={t.colors.textPrimary} strokeWidth={1.6} />}
            label={tr('tasbeeh.settings')}
            onPress={() => setShowSettings(true)}
          />
        </View>
      </Screen>

      {/* ⚙️ إعدادات السبحة — اختيار الهدف */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSettings(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: t.colors.textPrimary }}>إعدادات السبحة</Text>
              <Pressable onPress={() => setShowSettings(false)} hitSlop={10}>
                <X size={20} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 10 }}>
              هدف العدّ للذِّكر الحالي
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
              {goalOptions.map((g) => {
                const active = current.goal === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => { setGoal(selectedId, g); Haptics.selectionAsync().catch(() => {}); }}
                    style={[styles.goalChip, { backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt, borderColor: active ? t.colors.primary : t.colors.border }]}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: active ? '#fff' : t.colors.textPrimary }}>
                      {arabicNumber(g)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 1, backgroundColor: t.colors.divider, marginVertical: 16 }} />

            {/* مفاتيح سريعة للاهتزاز والصوت */}
            <ToggleRow label="الاهتزاز عند العدّ" value={vibrate} onToggle={() => setVibrate((v) => !v)} />
            <ToggleRow label="صوت النقرة" value={sound} onToggle={() => setSound((s) => !s)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const ToggleRow: React.FC<{ label: string; value: boolean; onToggle: () => void }> = ({ label, value, onToggle }) => {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.colors.textPrimary }}>{label}</Text>
      <View style={[styles.checkBox, { backgroundColor: value ? t.colors.primary : 'transparent', borderColor: value ? t.colors.primary : t.colors.border }]}>
        {value ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
};

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onPress?: () => void; active?: boolean }> = ({ icon, label, onPress, active }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          borderColor: active ? t.colors.accent : t.colors.border,
          backgroundColor: active ? t.colors.accent + '12' : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '600', color: active ? t.colors.accent : t.colors.textSecondary, letterSpacing: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: TOP_BAR_PAD,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  todayPillText: { fontSize: 10, letterSpacing: 1, fontWeight: '600' },
  todayPillNum: { fontSize: 13, fontWeight: '700' },

  dhikrChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dhikrText: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'center',
    fontWeight: '600',
  },

  mandalaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  numberOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: '300',
    letterSpacing: -2,
    lineHeight: 78,
  },
  targetText: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '500',
    marginTop: 4,
  },
  hint: {
    marginTop: 22,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '500',
  },
  completePill: {
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  completeText: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
  },

  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 22,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  checkBox: {
    width: 26, height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
