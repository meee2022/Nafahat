/**
 * شاشة آية اليوم - عرض موسّع لآية اليوم بزخارف وأدوات حقيقية.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Defs, Pattern, Rect, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { ArrowRight, Heart, Share2, Copy, Feather, Headphones, Sparkles, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { getAyahOfTheDay } from '@data/featuredAyahs';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import { useReadingStore, useAudioStore } from '@store/index';
import { RECITERS, getReciterById } from '@data/reciters';
import { copyToClipboard, shareText } from '@utils/clipboard';

const DEFAULT_RECITER = getReciterById('mishary') ?? RECITERS[0];

export default function AyahOfDayScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const today = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const FEATURED_AYAH = React.useMemo(() => getAyahOfTheDay(), []);

  const { favorites, toggleFavorite } = useReadingStore();
  const { play } = useAudioStore();
  const [copied, setCopied] = useState(false);

  const isFav = favorites.includes(`${FEATURED_AYAH.surahId}:${FEATURED_AYAH.number}`);
  const fullText = `${FEATURED_AYAH.text}\n\n— سورة ${FEATURED_AYAH.surahName}، الآية ${arabicNumber(FEATURED_AYAH.number)}\n\nمن تطبيق نَفَحات`;

  const handleFavorite = () => {
    toggleFavorite(FEATURED_AYAH.surahId, FEATURED_AYAH.number);
  };

  const handleListen = () => {
    play({
      reciter: DEFAULT_RECITER,
      surahId: FEATURED_AYAH.surahId,
      surahName: FEATURED_AYAH.surahName,
      ayahNumber: FEATURED_AYAH.number,
    });
    router.push('/player');
  };

  const handleReflect = () => {
    // ينقل لشاشة الملاحظات/التدبر مع pre-fill
    router.push({
      pathname: '/notes',
      params: {
        surahId: String(FEATURED_AYAH.surahId),
        ayahNumber: String(FEATURED_AYAH.number),
        prefill: '1',
      },
    });
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleShare = async () => {
    await shareText(fullText, 'آية اليوم - نَفَحات');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('home.today')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('ayahOfDay.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* البطاقة الفاخرة */}
        <View style={[styles.heroWrap]}>
          <LinearGradient
            colors={['#0A3D38', '#0F4A41', '#062825']}
            style={[styles.heroCard]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} pointerEvents="none">
              <Defs>
                <Pattern id="aod-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Path
                    d="M20,4 L24,16 L36,20 L24,24 L20,36 L16,24 L4,20 L16,16 Z"
                    fill="none" stroke="#C9A961" strokeWidth={0.5}
                  />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#aod-bg)" />
            </Svg>

            <View style={[styles.frameOuter, { borderColor: 'rgba(212, 181, 112, 0.45)' }]} />

            <View style={styles.heroContent}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowDot, { backgroundColor: '#D4B570' }]} />
                <Text style={[styles.eyebrowGold]}>{tr('ayahOfDay.eyebrow')}</Text>
                <View style={[styles.eyebrowDot, { backgroundColor: '#D4B570' }]} />
              </View>

              <Text style={[styles.dateText]}>{today}</Text>

              <View style={{ marginVertical: 16, alignItems: 'center' }}>
                <OrnamentalRule width={140} color="#D4B570" variant="star" />
              </View>

              <View style={styles.ayahFrame}>
                <Text style={styles.bracket}>﴿</Text>
                <Text style={[styles.ayahText, { fontFamily: t.fontFamilies.arabicQuran }]}>
                  {FEATURED_AYAH.text}
                </Text>
                <Text style={styles.bracket}>﴾</Text>
              </View>

              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <OrnamentalRule width={120} color="#D4B570" variant="rosette" />
              </View>

              <Text style={styles.ayahRef}>
                {tr('ayahOfDay.surahPrefix')} {FEATURED_AYAH.surahName} · {tr('ayahOfDay.ayahPrefix')} {arabicNumber(FEATURED_AYAH.number)}
              </Text>

              {FEATURED_AYAH.label ? (
                <View style={{ marginTop: 4, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212, 181, 112, 0.4)' }}>
                  <Text style={[styles.label]}>{FEATURED_AYAH.label}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </View>

        {/* أزرار سريعة - مربوطة بالكامل */}
        <View style={[styles.actionsRow, { marginTop: 16, paddingHorizontal: 16 }]}>
          <ActionBtn
            icon={<Heart size={18} color={isFav ? '#E11D48' : t.colors.accent} fill={isFav ? '#E11D48' : 'none'} />}
            label={tr('ayahOfDay.actionFavorite')}
            onPress={handleFavorite}
            active={isFav}
          />
          <ActionBtn
            icon={<Headphones size={18} color={t.colors.accent} />}
            label={tr('ayahOfDay.actionListen')}
            onPress={handleListen}
          />
          <ActionBtn
            icon={<Feather size={18} color={t.colors.accent} />}
            label={tr('ayahOfDay.actionReflect')}
            onPress={handleReflect}
          />
          <ActionBtn
            icon={copied ? <Check size={18} color="#10B981" /> : <Copy size={18} color={t.colors.accent} />}
            label={copied ? 'تم النسخ ✓' : tr('ayahOfDay.actionCopy')}
            onPress={handleCopy}
            active={copied}
          />
          <ActionBtn
            icon={<Share2 size={18} color={t.colors.accent} />}
            label={tr('ayahOfDay.actionShare')}
            onPress={handleShare}
          />
        </View>

        {/* تدبّر */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={14} color={t.colors.accent} />
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('ayahOfDay.reflection')}</Text>
          </View>
          <Card padding={20} elevation="xs" bordered>
            <Text variant="body" style={{ lineHeight: 28 }}>
              {FEATURED_AYAH.reflection}
            </Text>
          </Card>
        </View>

        {/* الذهاب للسورة */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable onPress={() => router.push(`/surah/${FEATURED_AYAH.surahId}`)}>
            <Card padding={16} elevation="xs" bordered background={t.colors.primary + '08'}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.smallIcon, { backgroundColor: t.colors.primary }]}>
                  <Sparkles size={18} color={t.colors.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle">{tr('ayahOfDay.readSurah')}</Text>
                  <Text variant="caption" color={t.colors.textSecondary}>
                    {tr('ayahOfDay.surahPrefix')} {FEATURED_AYAH.surahName}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onPress?: () => void; active?: boolean }> = ({ icon, label, onPress, active }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          borderColor: active ? t.colors.accent : t.colors.borderGold,
          backgroundColor: active ? t.colors.accent + '12' : t.colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon}
      <Text variant="caption" color={active ? t.colors.accent : t.colors.textSecondary} style={{ marginTop: 6, fontWeight: '600' }}>
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

  heroWrap: { marginHorizontal: 16, marginTop: 20 },
  heroCard: { padding: 24, overflow: 'hidden', borderRadius: 4, minHeight: 380 },
  frameOuter: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: 1,
  },
  heroContent: { padding: 8, alignItems: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowDot: { width: 4, height: 4, borderRadius: 2 },
  eyebrowGold: { fontSize: 11, letterSpacing: 3, fontWeight: '700', color: '#D4B570' },
  dateText: { color: 'rgba(245, 239, 224, 0.7)', fontSize: 13, marginTop: 6, letterSpacing: 1 },

  ayahFrame: { alignItems: 'center' },
  bracket: { color: '#D4B570', fontSize: 28, lineHeight: 30, fontWeight: '700' },
  ayahText: {
    fontSize: 24, lineHeight: 48,
    color: '#F5EFE0',
    textAlign: 'center', fontWeight: '500',
    marginVertical: 10,
  },
  ayahRef: { color: '#D4B570', fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 8 },
  label: { color: '#D4B570', fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: {
    flex: 1,
    paddingVertical: 12, marginHorizontal: 3,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },

  smallIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
