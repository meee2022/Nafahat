/**
 * شاشة المفضلة - الآيات والعلامات المرجعية المحفوظة.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Heart, Bookmark, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, EmptyState } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useReadingStore } from '@store/index';
import { arabicNumber, getSurahById } from '@data/surahs';
import { useT } from '@store/languageStore';

export default function FavoritesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { favorites, bookmarks } = useReadingStore();

  const favoriteAyahs = favorites.map((k) => {
    const [s, a] = k.split(':').map(Number);
    const surah = getSurahById(s);
    return { surahId: s, ayahNumber: a, surahName: surah?.nameAr ?? '' };
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('favorites.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('favorites.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {favoriteAyahs.length === 0 && bookmarks.length === 0 ? (
          <Card padding={32} elevation="xs" bordered>
            <EmptyState
              icon={<Heart size={36} color={t.colors.accent} />}
              title={tr('favorites.empty')}
              description="اضغط على ♥ بجانب أي آية في المصحف لإضافتها لمفضلتك، وستجدها هنا."
              actionLabel="افتح المصحف"
              onAction={() => router.push('/mushaf')}
            />
          </Card>
        ) : (
          <>
            {/* المفضلة */}
            {favoriteAyahs.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الآيات</Text>
                    <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
                      المفضلة ({arabicNumber(favoriteAyahs.length)})
                    </Text>
                  </View>
                  <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
                </View>
                <View style={{ gap: 10 }}>
                  {favoriteAyahs.map((it, idx) => (
                    <Card key={idx} onPress={() => router.push(`/surah/${it.surahId}?ayah=${it.ayahNumber}`)} padding={14} elevation="xs" bordered>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Heart size={18} color={t.colors.error} fill={t.colors.error} />
                        <View style={{ flex: 1 }}>
                          <Text variant="subtitle">{it.surahName}</Text>
                          <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                            الآية {arabicNumber(it.ayahNumber)}
                          </Text>
                        </View>
                        <ChevronLeft size={16} color={t.colors.textTertiary} />
                      </View>
                    </Card>
                  ))}
                </View>
              </>
            ) : null}

            {/* العلامات المرجعية */}
            {bookmarks.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eyebrow, { color: t.colors.accent }]}>العلامات</Text>
                    <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
                      العلامات المرجعية ({arabicNumber(bookmarks.length)})
                    </Text>
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  {bookmarks.map((b) => {
                    const surah = getSurahById(b.surahId);
                    return (
                      <Card key={b.id} onPress={() => router.push(`/surah/${b.surahId}?ayah=${b.ayahNumber}`)} padding={14} elevation="xs" bordered>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Bookmark size={18} color={t.colors.accent} fill={t.colors.accent} />
                          <View style={{ flex: 1 }}>
                            <Text variant="subtitle">{surah?.nameAr}</Text>
                            <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                              الآية {arabicNumber(b.ayahNumber)} · صفحة {arabicNumber(b.page)}
                            </Text>
                          </View>
                          <ChevronLeft size={16} color={t.colors.textTertiary} />
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </>
            ) : null}
          </>
        )}
      </Screen>
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
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 12, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },
});
