/**
 * شاشة التسميع - تسجيل صوتي + مقارنة + نظام تقييم.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Square, Play, Sparkles, RotateCcw, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, Chip, Button, ProgressBar } from '@components/ui';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import { useStatsStore } from '@store/index';

type Mode = 'self' | 'sheikh' | 'complete' | 'quiz';

export default function TasmeeScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('self');
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const recordSession = useStatsStore((s) => s.recordSession);

  const handleSaveSession = () => {
    // نحفظ جلسة بـ 3 دقائق تقديرية كجلسة استماع
    recordSession(3);
    setSaved(true);
    Alert.alert('تم الحفظ ✓', 'تم تسجيل جلسة التسميع في سجلك.', [
      { text: 'حسناً', onPress: () => {
        setHasRecording(false);
        setRecording(false);
        setSaved(false);
      } },
    ]);
  };

  const handleListenRecording = () => {
    Alert.alert('استماع للتسجيل', 'سيتم تشغيل التسجيل الصوتي قريباً.\n(يتطلب تكامل expo-av Recording للتسجيل الفعلي)', [
      { text: 'حسناً' },
    ]);
  };

  const modes: { id: Mode; labelKey: any; descKey: any }[] = [
    { id: 'self',     labelKey: 'tasmee.modeSelf',     descKey: 'tasmee.startRecording' },
    { id: 'sheikh',   labelKey: 'tasmee.modeSheikh',   descKey: 'tasmee.startRecording' },
    { id: 'complete', labelKey: 'tasmee.modeComplete', descKey: 'tasmee.startRecording' },
    { id: 'quiz',     labelKey: 'tasmee.modeQuiz',     descKey: 'tasmee.startRecording' },
  ];

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={tr('tasmee.title')} subtitle={tr('tasmee.subtitle')} />

      {/* اختيار الوضع */}
      <Text variant="label" color={t.colors.textSecondary} style={{ marginBottom: 8 }}>{tr('tasmee.modes')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {modes.map((m) => (
          <Chip key={m.id} label={tr(m.labelKey)} active={mode === m.id} onPress={() => setMode(m.id)} />
        ))}
      </View>

      {/* وصف الوضع */}
      <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.md }}>
        <Text variant="bodySm" color={t.colors.textSecondary}>
          {(() => {
            const m = modes.find((x) => x.id === mode);
            return m ? tr(m.descKey) : '';
          })()}
        </Text>
      </Card>

      {/* نطاق التسميع */}
      <Card padding={t.spacing.lg} elevation="sm" style={{ marginTop: t.spacing.md }}>
        <Text variant="subtitle">{tr('tasmee.range')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Chip label={tr('tasmee.rangeFatiha')}  active />
          <Chip label={tr('tasmee.rangeFullSurah')} />
          <Chip label={tr('tasmee.rangePage')} />
          <Chip label={tr('tasmee.rangeQuarter')} />
          <Chip label={tr('tasmee.rangeFromTo')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={[styles.range, { backgroundColor: t.colors.surfaceAlt, borderRadius: 10 }]}>
            <Text variant="caption" color={t.colors.textSecondary}>{tr('tasmee.fromAyah')}</Text>
            <Text variant="h3" color={t.colors.primary}>{arabicNumber(1)}</Text>
          </View>
          <View style={[styles.range, { backgroundColor: t.colors.surfaceAlt, borderRadius: 10 }]}>
            <Text variant="caption" color={t.colors.textSecondary}>{tr('tasmee.toAyah')}</Text>
            <Text variant="h3" color={t.colors.primary}>{arabicNumber(7)}</Text>
          </View>
        </View>
      </Card>

      {/* منطقة التسجيل */}
      <Card padding={t.spacing.xl} elevation="sm" style={{ marginTop: t.spacing.lg, alignItems: 'center' }}>
        <Text variant="quranSm" align="center" color={t.colors.textPrimary}>
          {tr('tasmee.bismillah')}
        </Text>
        <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
          {tr('tasmee.startRecording')}
        </Text>

        {/* الموجة (مبسطة) */}
        <View style={[styles.waveWrap, { backgroundColor: t.colors.surfaceAlt, marginTop: 18 }]}>
          <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
            {Array.from({ length: 32 }).map((_, i) => {
              const h = recording ? 6 + Math.abs(Math.sin(i / 2 + Date.now() / 600)) * 30 : 6 + Math.abs(Math.sin(i / 1.5)) * 10;
              return (
                <View
                  key={i}
                  style={{
                    width: 4,
                    height: h,
                    backgroundColor: recording ? t.colors.error : t.colors.primary,
                    borderRadius: 2,
                    opacity: 0.6,
                  }}
                />
              );
            })}
          </View>
        </View>

        {recording ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.error }} />
            <Text variant="label" color={t.colors.error}>{tr('tasmee.recording')} ٠٠:٢٣</Text>
          </View>
        ) : null}

        {/* الزر الكبير */}
        <Pressable
          onPress={() => {
            if (recording) { setRecording(false); setHasRecording(true); }
            else { setRecording(true); setHasRecording(false); }
          }}
          style={{ marginTop: 22 }}
        >
          <LinearGradient
            colors={recording ? ['#E11D48', '#BE123C'] : [t.colors.primary, t.colors.primaryDark]}
            style={[styles.bigBtn, { ...t.shadows.lg, shadowColor: recording ? '#E11D48' : t.colors.primary }]}
          >
            {recording ? <Square size={32} color="#fff" fill="#fff" /> : <Mic size={32} color="#fff" />}
          </LinearGradient>
        </Pressable>

        {hasRecording ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Button label={tr('tasmee.listenRecording')} iconLeft={<Play size={16} color="#fff" />} variant="primary" onPress={handleListenRecording} />
            <Button label={tr('tasmee.retake')} iconLeft={<RotateCcw size={16} color={t.colors.primary} />} variant="outline" onPress={() => { setHasRecording(false); }} />
          </View>
        ) : null}
      </Card>

      {/* تقييم بعد الجلسة */}
      {hasRecording ? (
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color={t.colors.accent} />
            <Text variant="subtitle">{tr('tasmee.sessionRating')}</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text variant="caption" color={t.colors.textSecondary}>{tr('tasmee.accuracy')}</Text>
              <Text variant="label" color={t.colors.success}>%92</Text>
            </View>
            <ProgressBar value={0.92} color={t.colors.success} />
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text variant="caption" color={t.colors.textSecondary}>{tr('tasmee.fluency')}</Text>
              <Text variant="label" color={t.colors.primary}>%85</Text>
            </View>
            <ProgressBar value={0.85} color={t.colors.primary} />
          </View>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 14 }}>
            {tr('tasmee.notesExample')}
          </Text>
          <Button
            label={saved ? 'تم الحفظ ✓' : tr('tasmee.saveSession')}
            iconLeft={<Check size={16} color={t.colors.onPrimary} />}
            onPress={handleSaveSession}
            disabled={saved}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  range: { flex: 1, padding: 14, alignItems: 'center' },
  waveWrap: { borderRadius: 12, padding: 16, height: 72, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  bigBtn: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
