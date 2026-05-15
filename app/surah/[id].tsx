/**
 * شاشة قراءة السورة - تصميم المصحف الشريف الكلاسيكي:
 *  - إطار ذهبي مزخرف بنقش هندسي إسلامي على الحواف الأربع
 *  - ترويسة بأزرار بيج + اسم السورة + الجزء + زخرفات معيّن
 *  - نص قرآني متتابع بالرسم العثماني + رصائع آيات ذهبية
 *  - شريط سفلي برقم الصفحة وزر القراءة
 *  - بطاقة إجراءات تظهر عند تحديد آية (مرجعية، مفضّلة، نسخ، مشاركة، استمع)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import {
  Play, Pause, Bookmark, Heart, Copy, Share2,
  AlertCircle, RotateCcw, X, CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { getSurahById, arabicNumber } from '@data/surahs';
import { getAyahs as getAyahsFallback } from '@data/ayahs';
import { getSurahAyahs, prefetchSurahs } from '@services/quranApi';
import { useReadingStore, useAudioStore, useSettingsStore } from '@store/index';
import { RECITERS, getReciterById } from '@data/reciters';
import { Ayah } from '@/types/index';
import { useT } from '@store/languageStore';
import {
  MushafBorder,
  MushafHeader,
  MushafFooter,
  AyahRosette,
  AyahDetailSheet,
} from '@components/mushaf';
import { getCurrentAyah } from '@services/verseSync';
import { colorizeTajweed, TAJWEED_PALETTE_LIGHT, TAJWEED_PALETTE_DARK } from '@services/tajweedColors';

// Removed DEFAULT_RECITER; now fetched dynamically.

/**
 * لوحة ألوان المصحف - مرتبطة بهوية التطبيق (parchment + gold + emerald).
 * تُحسَب ديناميكياً من theme.colors لتدعم light/dark mode.
 */
function buildMushafPalette(t: ReturnType<typeof useTheme>) {
  return {
    page:     t.colors.background,      // parchment100 / midnight800
    pageWarm: t.colors.surfaceAlt,      // parchment200 / midnight800
    ink:      t.colors.textPrimary,     // ink900 / parchment100
    inkSoft:  t.colors.textSecondary,   // ink600 / ink300
    gold:     t.colors.accent,          // gold500 / gold300
    goldDeep: t.colors.accentDeep,      // gold700 / gold500
    buttonBg: t.colors.surface,         // parchment50 / midnight700
    selected: t.colors.accentSoft,      // gold50 / rgba gold
    ruby:     t.colors.error,
    emerald:  t.colors.primary,         // emerald700 / gold300
  };
}

export default function SurahDetail() {
  const t = useTheme();
  const MUSHAF = useMemo(() => buildMushafPalette(t), [t]);
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const surah = useMemo(() => getSurahById(Number(id)), [id]);

  const { toggleBookmark, toggleFavorite, bookmarks, favorites, setLastRead } = useReadingStore();
  const { play, current, isPlaying, toggle, positionMs, durationMs } = useAudioStore();
  const { preferredReciterId, setPreferredReciterId } = useSettingsStore();
  const activeReciter = useMemo(() => getReciterById(preferredReciterId) ?? RECITERS[0], [preferredReciterId]);

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [fontSize] = useState(26);
  const [tajweedColored, setTajweedColored] = useState(false);

  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showRecitersModal, setShowRecitersModal] = useState(false);

  useEffect(() => {
    if (!surah) return;
    let mounted = true;
    setAyahs(null);
    setLoadError(null);

    getSurahAyahs(surah.id)
      .then((data) => {
        if (!mounted) return;
        setAyahs(data);
        prefetchSurahs([surah.id - 1, surah.id + 1].filter((n) => n >= 1 && n <= 114));
      })
      .catch(() => {
        if (!mounted) return;
        setAyahs(getAyahsFallback(surah.id, surah.versesCount));
        setLoadError(tr('mushaf.loadError'));
      });

    return () => { mounted = false; };
  }, [surah?.id, retryKey]);

  if (!surah) {
    return (
      <View style={{ flex: 1, backgroundColor: MUSHAF.page, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: MUSHAF.ink }}>{tr('mushaf.surahNotFound')}</Text>
      </View>
    );
  }

  const isCurrentlyPlaying = current?.surahId === surah.id && isPlaying;
  // الآية الجارية حالياً أثناء الاستماع (تظليل live)
  const playingAyahNumber = useMemo(() => {
    if (!isCurrentlyPlaying || !ayahs || durationMs === 0) return null;
    return getCurrentAyah(positionMs, durationMs, ayahs);
  }, [isCurrentlyPlaying, ayahs, positionMs, durationMs]);
  const showBismillah = surah.id !== 1 && surah.id !== 9;
  const juzLabel = `الجزء ${juzNameAr(surah.juzStart)}`;
  const surahNameWithPrefix = `سورة ${surah.nameAr}`;
  const subInfo = `${surah.revelationType === 'meccan' ? 'مكية' : 'مدنية'}  ·  ${arabicNumber(surah.versesCount)} آية`;

  const handlePlay = () => {
    if (current?.surahId === surah.id) toggle();
    else play({ reciter: activeReciter, surahId: surah.id, surahName: surah.nameAr });
    setLastRead({
      surahId: surah.id, ayahNumber: 1, surahName: surah.nameAr,
      page: surah.pageStart, updatedAt: Date.now(),
    });
  };

  const quranFont = t.fontFamilies.arabicQuran;

  return (
    <View style={{ flex: 1, backgroundColor: MUSHAF.pageWarm }}>
      <MushafBorder
        goldColor={MUSHAF.gold}
        goldDeep={MUSHAF.goldDeep}
        pageColor={MUSHAF.page}
        ornamentBg={MUSHAF.pageWarm}
      >

        {/* ───── الترويسة ───── */}
        <View style={styles.headerWrap}>
          <MushafHeader
            juzLabel={juzLabel}
            surahName={surahNameWithPrefix}
            subInfo={subInfo}
            onBack={() => {
              if (router.canGoBack?.()) router.back();
              else router.replace('/mushaf');
            }}
            onMenu={() => router.push('/mushaf')}
            goldColor={MUSHAF.gold}
            goldDeep={MUSHAF.goldDeep}
            textColor={MUSHAF.inkSoft}
            buttonBg={MUSHAF.buttonBg}
            pageColor={MUSHAF.page}
            quranFont={quranFont}
          />
        </View>

        {/* ───── محتوى الصفحة - النص القرآني ───── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* بسملة */}
          {showBismillah ? (
            <View style={styles.bismillahWrap}>
              <BismillahOrnament goldColor={MUSHAF.gold} />
              <Text
                style={{
                  fontFamily: quranFont,
                  fontSize: fontSize + 4,
                  lineHeight: (fontSize + 4) * 1.7,
                  color: MUSHAF.ink,
                  textAlign: 'center',
                  fontWeight: '500',
                  marginTop: 8,
                }}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </Text>
              <BismillahOrnament goldColor={MUSHAF.gold} />
            </View>
          ) : null}

          {/* رسالة خطأ */}
          {loadError ? (
            <View style={[styles.errBox, { borderColor: MUSHAF.gold, backgroundColor: 'rgba(184,148,86,0.10)' }]}>
              <AlertCircle size={16} color={MUSHAF.goldDeep} />
              <Text style={{ flex: 1, color: MUSHAF.goldDeep, fontSize: 13, marginHorizontal: 8 }}>
                {loadError}
              </Text>
              <Pressable onPress={() => setRetryKey((k) => k + 1)} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <RotateCcw size={14} color={MUSHAF.goldDeep} />
                <Text style={{ color: MUSHAF.goldDeep, fontSize: 13 }}>{tr('common.retry')}</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Loading */}
          {!ayahs ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={MUSHAF.gold} size="large" />
              <Text style={{ color: MUSHAF.inkSoft, marginTop: 14, fontFamily: quranFont, fontSize: 14 }}>
                {tr('mushaf.loadingScripture')}
              </Text>
            </View>
          ) : null}

          {/* النص القرآني المتتابع */}
          {ayahs ? (
            <View style={styles.ayahFlow}>
              <Text
                style={{
                  fontFamily: quranFont,
                  fontSize,
                  lineHeight: fontSize * 2.3,
                  color: MUSHAF.ink,
                  textAlign: 'justify',
                  writingDirection: 'rtl',
                  fontWeight: '500',
                }}
              >
                {ayahs.map((ayah) => {
                  const isSelected = selectedAyah === ayah.number;
                  const isPlayingNow = playingAyahNumber === ayah.number;
                  // أولوية التظليل: المُحدّدة > الجارية الاستماع
                  const bg = isSelected
                    ? MUSHAF.selected
                    : isPlayingNow
                      ? MUSHAF.gold + '38' // ذهبي شفّاف للآية المُشغّلة
                      : 'transparent';

                  // إذا فعّل المستخدم التجويد الملوّن، نقسّم النص لـ segments
                  const segments = tajweedColored
                    ? colorizeTajweed(ayah.text, TAJWEED_PALETTE_LIGHT)
                    : null;

                  return (
                    <Text
                      key={ayah.number}
                      onPress={() => setSelectedAyah(isSelected ? null : ayah.number)}
                      style={{
                        fontFamily: quranFont,
                        color: MUSHAF.ink,
                        backgroundColor: bg,
                      }}
                    >
                      {segments
                        ? segments.map((seg, i) => (
                            <Text key={i} style={{ fontFamily: quranFont, color: seg.color ?? MUSHAF.ink }}>
                              {seg.text}
                            </Text>
                          ))
                        : ayah.text}
                      {/* رصيعة الآية - inline داخل الـ Text */}
                      <Text style={{ fontFamily: quranFont, fontSize: fontSize * 0.95 }}>
                        {' '}
                      </Text>
                      <View style={styles.rosetteInline}>
                        <AyahRosette
                          number={ayah.number}
                          size={fontSize * 1.15}
                          goldColor={MUSHAF.gold}
                          innerColor={MUSHAF.page}
                        />
                      </View>
                      <Text style={{ fontFamily: quranFont }}>{' '}</Text>
                    </Text>
                  );
                })}
              </Text>
            </View>
          ) : null}

          {/* نهاية السورة */}
          {ayahs && ayahs.length > 0 ? (
            <View style={styles.endWrap}>
              <BismillahOrnament goldColor={MUSHAF.gold} />
              <Text style={{ marginTop: 8, color: MUSHAF.gold, fontFamily: quranFont, fontSize: 13, letterSpacing: 2 }}>
                ◇  انتهت سورة {surah.nameAr}  ◇
              </Text>
            </View>
          ) : null}

        </ScrollView>

        {/* Bottom Sheet: تفسير + ترجمة + إجراءات */}
        {selectedAyah !== null && ayahs ? (
          <AyahDetailSheet
            visible={selectedAyah !== null}
            onClose={() => setSelectedAyah(null)}
            surahId={surah.id}
            ayahNumber={selectedAyah}
            ayahText={ayahs.find((a) => a.number === selectedAyah)?.text ?? ''}
            surahName={surah.nameAr}
            isBookmarked={bookmarks.some((b) => b.surahId === surah.id && b.ayahNumber === selectedAyah)}
            isFavorite={favorites.includes(`${surah.id}:${selectedAyah}`)}
            onToggleBookmark={() => toggleBookmark(surah.id, selectedAyah, surah.pageStart)}
            onToggleFavorite={() => toggleFavorite(surah.id, selectedAyah)}
            onPlay={() => play({ reciter: activeReciter, surahId: surah.id, surahName: surah.nameAr, ayahNumber: selectedAyah })}
          />
        ) : null}

        {/* ───── الشريط السفلي ───── */}
        <View style={styles.footerWrap}>
          <MushafFooter
            pageNumber={surah.pageStart}
            onReadMode={() => setTajweedColored((v) => !v)}
            goldColor={MUSHAF.gold}
            textColor={MUSHAF.inkSoft}
            amiriFont={quranFont}
          />
        </View>

      </MushafBorder>

      {/* زر التشغيل العائم - أسفل-وسط */}
      {!selectedAyah ? (
        <View style={styles.floatingControlsWrap}>
          {/* شارة تغيير القارئ */}
          <Pressable
            onPress={() => setShowRecitersModal(true)}
            style={[styles.reciterBadge, { backgroundColor: MUSHAF.buttonBg, borderColor: MUSHAF.gold }]}
          >
            <Text style={{ fontSize: 12, color: MUSHAF.goldDeep, fontWeight: '700' }}>
              بصوت: {activeReciter.nameAr.split(' ').slice(-2).join(' ')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => [styles.playFab, { opacity: pressed ? 0.85 : 1, backgroundColor: MUSHAF.gold }]}
          >
            {isCurrentlyPlaying
              ? <Pause size={18} color={MUSHAF.page} fill={MUSHAF.page} />
              : <Play size={18} color={MUSHAF.page} fill={MUSHAF.page} />}
            <Text style={{ color: MUSHAF.page, fontFamily: quranFont, fontWeight: '700', fontSize: 14, letterSpacing: 1 }}>
              {isCurrentlyPlaying ? 'إيقاف' : 'استمع للسورة'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* ───── Modal اختيار القارئ ───── */}
      <Modal
        visible={showRecitersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecitersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.textPrimary }}>اختر القارئ</Text>
              <Pressable onPress={() => setShowRecitersModal(false)} style={{ padding: 4 }}>
                <X size={24} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={RECITERS}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected = item.id === preferredReciterId;
                return (
                  <Pressable
                    onPress={() => {
                      setPreferredReciterId(item.id);
                      setShowRecitersModal(false);
                      // إعادة تشغيل الصوت بالقارئ الجديد إذا كان يعمل
                      if (isPlaying && current?.surahId === surah.id) {
                        play({ reciter: item, surahId: surah.id, surahName: surah.nameAr });
                      }
                    }}
                    style={[
                      styles.reciterItem,
                      { backgroundColor: isSelected ? t.colors.accentSoft : t.colors.surface },
                      isSelected && { borderColor: t.colors.accent, borderWidth: 1 }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? t.colors.accentDeep : t.colors.textPrimary }}>
                        {item.nameAr}
                      </Text>
                      <Text style={{ fontSize: 13, color: t.colors.textTertiary, marginTop: 4 }}>
                        {item.style} • {item.countryAr}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle2 size={22} color={t.colors.accent} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────── زخرفة بسملة ───────────────

const BismillahOrnament: React.FC<{ goldColor: string }> = ({ goldColor }) => (
  <View style={{ alignItems: 'center', marginVertical: 4 }}>
    <Svg width={180} height={14} viewBox="0 0 180 14">
      <Defs>
        <SvgGradient id="bism-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={goldColor} stopOpacity={0} />
          <Stop offset="50%" stopColor={goldColor} stopOpacity={0.85} />
          <Stop offset="100%" stopColor={goldColor} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {/* الخط الأفقي */}
      <Path d="M 8 7 L 78 7" stroke="url(#bism-grad)" strokeWidth={0.8} />
      <Path d="M 102 7 L 172 7" stroke="url(#bism-grad)" strokeWidth={0.8} />
      {/* معيّن مركزي مزدوج */}
      <Path d="M 90 2 L 96 7 L 90 12 L 84 7 Z" fill={goldColor} opacity={0.9} />
      <Path d="M 90 4 L 94 7 L 90 10 L 86 7 Z" fill="#FBF5E3" opacity={0.55} />
      <Circle cx="90" cy="7" r="1" fill={goldColor} />
    </Svg>
  </View>
);

// ─────────────── زر إجراء داخل لوحة الآية ───────────────

const ActionItem: React.FC<{ icon: React.ReactNode; label: string; onPress?: () => void }> = ({ icon, label, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
    >
      {icon}
      <Text style={{ color: t.colors.textSecondary, fontSize: 11, marginTop: 6, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

// ─────────────── Helpers ───────────────

function juzNameAr(juzNumber: number): string {
  const names = [
    '', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن',
    'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
    'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون',
    'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون', 'الخامس والعشرون',
    'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون',
  ];
  return names[juzNumber] ?? arabicNumber(juzNumber);
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  scroll: {
    paddingTop: 6,
    paddingBottom: 32,
  },
  bismillahWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  ayahFlow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  rosetteInline: {
    // Inline display
  } as any,
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  endWrap: {
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 8,
  },
  actionPanel: {
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: 56,
  },
  footerWrap: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  floatingControlsWrap: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    alignItems: 'center',
  },
  reciterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  playFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
});
