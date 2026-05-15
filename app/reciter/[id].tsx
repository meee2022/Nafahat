/**
 * شاشة قارئ - بطاقة كبيرة + قائمة سوره.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Download, Star, Heart, Globe } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, Chip } from '@components/ui';
import { getReciterById } from '@data/reciters';
import { SURAHS, arabicNumber } from '@data/surahs';
import { useAudioStore } from '@store/index';
import { useT } from '@store/languageStore';

export default function ReciterScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reciter = getReciterById(String(id));
  const { play } = useAudioStore();
  const fatihaName = SURAHS[0]?.nameAr ?? 'الفاتحة';

  if (!reciter) return null;

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title="" />

      {/* بطاقة القارئ */}
      <LinearGradient
        colors={[t.colors.primary, t.colors.primaryDark]}
        style={[styles.heroCard, { borderRadius: t.radius.xl }]}
      >
        <View style={[styles.bigAvatar, { borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Text variant="display" color="#fff">{reciter.nameAr.charAt(0)}</Text>
        </View>
        <Text variant="h1" color="#fff" style={{ marginTop: 16 }}>{reciter.nameAr}</Text>
        <Text variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{reciter.nameEn}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Globe size={12} color="#fff" />
            <Text variant="caption" color="#fff">{reciter.countryAr}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Star size={12} color="#fff" />
            <Text variant="caption" color="#fff">{reciter.style}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text variant="caption" color="#fff">{reciter.bitrate} kbps</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Pressable
            onPress={() => play({ reciter, surahId: 1, surahName: fatihaName })}
            style={[styles.heroBtn, { backgroundColor: '#fff' }]}
          >
            <Play size={16} color={t.colors.primary} fill={t.colors.primary} />
            <Text variant="button" color={t.colors.primary}>{tr('audio.playFromStart')}</Text>
          </Pressable>
          <Pressable style={[styles.heroIconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Heart size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* السور */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('audio.surahs')}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: t.spacing.md }}>
        <Chip label={tr('audio.styleAll')} active />
        <Chip label={tr('audio.downloaded')} />
        <Chip label={tr('audio.favorites')} />
      </View>

      <View style={{ gap: 6 }}>
        {SURAHS.slice(0, 25).map((s) => (
          <Card key={s.id} onPress={() => play({ reciter, surahId: s.id, surahName: s.nameAr })} padding={t.spacing.md} elevation="xs">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.numWrap, { backgroundColor: t.colors.primarySoft }]}>
                <Text variant="label" color={t.colors.primary}>{arabicNumber(s.id)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subtitle">{s.nameAr}</Text>
                <Text variant="caption" color={t.colors.textSecondary}>{arabicNumber(s.versesCount)} {tr('common.ayah')}</Text>
              </View>
              <Pressable hitSlop={t.hitSlop} style={styles.iconBtn}>
                <Download size={16} color={t.colors.textTertiary} />
              </Pressable>
              <Pressable hitSlop={t.hitSlop} style={[styles.playBtn, { backgroundColor: t.colors.primary }]}>
                <Play size={14} color="#fff" fill="#fff" />
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 24, alignItems: 'center', overflow: 'hidden' },
  bigAvatar: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  metaPill: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999,
  },
  heroIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  numWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
