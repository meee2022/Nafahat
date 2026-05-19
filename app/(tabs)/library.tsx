/**
 * 📚 تبويب المكتبة — البوّابة الموحّدة للمحتوى الإسلامي.
 *
 * يجمع:
 *  - المقالات (قصص الأنبياء، تدبّرات، تاريخ، إيمانيات...)
 *  - الأحاديث النبوية (الأربعون النووية، البخاري، مسلم...)
 *  - مع carousels لكل قسم: الأكثر قراءة / المتميّز / حديث اليوم
 *
 * هوية Nafahat: أخضر primary + ذهبي accent + لمسات عثمانية.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  Library, ScrollText, ChevronLeft, BookOpen, Clock, Eye, Sparkles,
  Search, Bookmark,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { SectionHeading } from '@components/home';
import { OrnamentalRule } from '@components/ornaments';
import { useArticlesStore } from '@store/index';
import { getFeaturedArticles, getLatestArticles, type Article, ARTICLE_CATEGORIES } from '@data/articles';
import { HADITHS, HADITH_COLLECTIONS, getCollectionMeta, type Hadith } from '@data/hadith';

export default function LibraryScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getViews = useArticlesStore((s) => s.getViews);
  const isBookmarked = useArticlesStore((s) => s.isBookmarked);

  // المحتوى المتميّز
  const featured = useMemo(() => getFeaturedArticles().slice(0, 4), []);
  const latest = useMemo(() => getLatestArticles(6), []);

  // حديث اليوم (يدور حسب اليوم)
  const todayHadith = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return HADITHS[dayOfYear % HADITHS.length];
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ═════════════ HERO أخضر premium ═════════════ */}
        <LinearGradient
          colors={[t.colors.primary, '#0F4A41', '#062825']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: Math.max(insets.top, 20) }]}
        >
          {/* نقش هندسي */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.10 }]} pointerEvents="none">
            <Path
              d="M0 30 L20 10 L40 30 L60 10 L80 30 L100 10 M0 70 L20 50 L40 70 L60 50 L80 70 L100 50"
              stroke="#D4B570" strokeWidth="0.4" fill="none"
            />
          </Svg>
          {/* إطار ذهبي رفيع */}
          <View pointerEvents="none" style={styles.heroFrame} />

          <View style={styles.heroTop}>
            <View style={styles.heroBranding}>
              <Text style={styles.brandingText}>المكتبة</Text>
              <View style={styles.brandingRule} />
              <Text style={styles.brandingSubtext}>مقالات وأحاديث وتدبّرات</Text>
            </View>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="بحث"
            >
              <Search size={20} color="#FFF" />
            </Pressable>
          </View>

          {/* Featured banners — Articles + Hadith كروت كبيرة */}
          <View style={styles.featuredGrid}>
            <Pressable
              onPress={() => router.push('/articles' as any)}
              accessibilityRole="button"
              accessibilityLabel="افتح المقالات"
              style={({ pressed }) => [styles.bigCardWrap, { opacity: pressed ? 0.92 : 1 }]}
            >
              <View style={[styles.bigCard, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: t.colors.accent + '70' }]}>
                <View style={[styles.bigCardIcon, { backgroundColor: t.colors.accent + '22', borderColor: t.colors.accent }]}>
                  <Library size={26} color={t.colors.accent} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={styles.bigCardTitle}>المقالات</Text>
                  <View style={{ backgroundColor: t.colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#0A1815', fontSize: 9, fontWeight: '800' }}>جديد</Text>
                  </View>
                </View>
                <Text style={styles.bigCardSub} numberOfLines={2}>
                  قصص الأنبياء · تدبّرات قرآنية · تاريخ
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/hadith' as any)}
              accessibilityRole="button"
              accessibilityLabel="افتح الأحاديث"
              style={({ pressed }) => [styles.bigCardWrap, { opacity: pressed ? 0.92 : 1 }]}
            >
              <View style={[styles.bigCard, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: t.colors.accent + '70' }]}>
                <View style={[styles.bigCardIcon, { backgroundColor: t.colors.accent + '22', borderColor: t.colors.accent }]}>
                  <ScrollText size={26} color={t.colors.accent} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={styles.bigCardTitle}>الأحاديث</Text>
                  <View style={{ backgroundColor: t.colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#0A1815', fontSize: 9, fontWeight: '800' }}>٨٦</Text>
                  </View>
                </View>
                <Text style={styles.bigCardSub} numberOfLines={2}>
                  الأربعون · البخاري · مسلم
                </Text>
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ═════════════ حديث اليوم ═════════════ */}
        {todayHadith ? (
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <SectionHeading eyebrow="من السنة المطهّرة" title="حديث اليوم" />
            <Pressable
              onPress={() => router.push('/hadith' as any)}
              accessibilityRole="button"
              accessibilityLabel="افتح الأحاديث"
              style={({ pressed }) => [
                styles.hadithCard,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderGold,
                  opacity: pressed ? 0.94 : 1,
                  shadowColor: t.colors.shadowColor,
                },
              ]}
            >
              <Text style={[styles.hadithNarrator, { color: t.colors.accent }]} numberOfLines={2}>
                {todayHadith.narrator}
              </Text>
              <Text
                style={[styles.hadithMatn, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}
                numberOfLines={4}
              >
                {todayHadith.text}
              </Text>
              <View style={styles.hadithOrnament}>
                <View style={[styles.ornamentLine, { backgroundColor: t.colors.borderGold }]} />
                <View style={[styles.ornamentDot, { backgroundColor: t.colors.accent }]} />
                <View style={[styles.ornamentLine, { backgroundColor: t.colors.borderGold }]} />
              </View>
              <View style={styles.hadithFooter}>
                <View style={[styles.gradeChip, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold }]}>
                  <Text style={{ color: t.colors.accent, fontSize: 10, fontWeight: '700' }}>
                    {getCollectionMeta(todayHadith.collection)?.nameAr ?? ''}
                  </Text>
                </View>
                <ChevronLeft size={16} color={t.colors.accent} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* ═════════════ مقالات متميّزة ═════════════ */}
        {featured.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <SectionHeading eyebrow="المتميّز" title="مقالات مختارة" />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {featured.map((article) => (
                <FeaturedArticleCard
                  key={article.id}
                  article={article}
                  isBookmarked={isBookmarked(article.id)}
                  views={getViews(article.id)}
                  onPress={() => router.push(`/articles/${article.id}` as any)}
                  t={t}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ═════════════ تصنيفات المقالات ═════════════ */}
        <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="تصفّح بالتصنيف" title="جميع التصنيفات" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {ARTICLE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push(`/articles?cat=${cat.id}` as any)}
              accessibilityRole="button"
              accessibilityLabel={cat.nameAr}
              style={({ pressed }) => [
                styles.catChip,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: cat.color + '60',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
              <Text style={{ color: t.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{cat.nameAr}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ═════════════ كتب الأحاديث (collections) ═════════════ */}
        <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="كتب الحديث" title="من الكتب التسعة" />
        </View>
        <View style={styles.collectionsGrid}>
          {HADITH_COLLECTIONS.filter((c) => c.id !== 'curated').slice(0, 6).map((coll) => (
            <Pressable
              key={coll.id}
              onPress={() => router.push('/hadith' as any)}
              accessibilityRole="button"
              accessibilityLabel={coll.fullNameAr}
              style={({ pressed }) => [
                styles.collectionCard,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: coll.color + '50',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={[styles.collectionIconBox, { backgroundColor: coll.color + '15', borderColor: coll.color + '40' }]}>
                <Text style={{ fontSize: 18 }}>{coll.emoji}</Text>
              </View>
              <Text style={{ color: t.colors.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 6 }} numberOfLines={1}>
                {coll.nameAr}
              </Text>
              <Text style={{ color: coll.color, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                {coll.isSahih ? 'صحيح' : 'سنن'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ═════════════ الأحدث من المقالات ═════════════ */}
        {latest.length > 0 ? (
          <View style={{ marginTop: 26 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <SectionHeading eyebrow="آخر المنشور" title="أحدث المقالات" />
            </View>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {latest.slice(0, 4).map((article) => (
                <CompactArticleRow
                  key={article.id}
                  article={article}
                  onPress={() => router.push(`/articles/${article.id}` as any)}
                  views={getViews(article.id)}
                  t={t}
                />
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/articles' as any)}
              style={({ pressed }) => [styles.viewAllBtn, { borderColor: t.colors.borderGold, opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="عرض جميع المقالات"
            >
              <Text style={{ color: t.colors.accent, fontSize: 13, fontWeight: '800' }}>عرض جميع المقالات</Text>
              <ChevronLeft size={14} color={t.colors.accent} />
            </Pressable>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════ Sub-components ═══════

const FeaturedArticleCard: React.FC<{
  article: Article;
  isBookmarked: boolean;
  views: number;
  onPress: () => void;
  t: any;
}> = ({ article, isBookmarked, views, onPress, t }) => {
  const cat = ARTICLE_CATEGORIES.find((c) => c.id === article.category);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [styles.featuredArticle, { opacity: pressed ? 0.94 : 1 }]}
    >
      <LinearGradient colors={article.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredCover}>
        <Text style={styles.featuredEmoji}>{article.coverEmoji}</Text>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.featuredOverlay}>
          {cat ? (
            <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{cat.nameAr}</Text>
            </View>
          ) : null}
          <Text style={styles.featuredTitle} numberOfLines={2}>{article.title}</Text>
          <View style={styles.featuredMeta}>
            <Clock size={10} color="rgba(255,255,255,0.85)" />
            <Text style={styles.featuredMetaText}>{article.readMinutes} د</Text>
            {views > 0 ? (
              <>
                <View style={styles.featuredMetaDot} />
                <Eye size={10} color="rgba(255,255,255,0.85)" />
                <Text style={styles.featuredMetaText}>{views}</Text>
              </>
            ) : null}
          </View>
        </View>
      </LinearGradient>
      {isBookmarked ? (
        <View style={[styles.bookmarkBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Bookmark size={11} color={t.colors.accent} fill={t.colors.accent} />
        </View>
      ) : null}
    </Pressable>
  );
};

const CompactArticleRow: React.FC<{
  article: Article;
  onPress: () => void;
  views: number;
  t: any;
}> = ({ article, onPress, views, t }) => {
  const cat = ARTICLE_CATEGORIES.find((c) => c.id === article.category);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [
        styles.compactRow,
        { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, opacity: pressed ? 0.95 : 1 },
      ]}
    >
      <LinearGradient colors={article.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compactCover}>
        <Text style={{ fontSize: 32 }}>{article.coverEmoji}</Text>
      </LinearGradient>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        {cat ? (
          <Text style={{ color: cat.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
            {cat.nameAr}
          </Text>
        ) : null}
        <Text style={{ color: t.colors.textPrimary, fontWeight: '800', fontSize: 14, marginTop: 3 }} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Clock size={10} color={t.colors.textTertiary} />
            <Text style={{ color: t.colors.textTertiary, fontSize: 10 }}>{article.readMinutes} د</Text>
          </View>
          {views > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Eye size={10} color={t.colors.textTertiary} />
              <Text style={{ color: t.colors.textTertiary, fontSize: 10 }}>{views}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <ChevronLeft size={16} color={t.colors.accent} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroFrame: {
    position: 'absolute',
    top: 14, bottom: 14, left: 14, right: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.25)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 18,
    zIndex: 10,
  },
  heroBranding: { flex: 1 },
  brandingText: {
    color: '#D4B570',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandingRule: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(212, 181, 112, 0.6)',
    marginVertical: 4,
  },
  brandingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.35)',
  },

  // ── Featured big cards (Articles + Hadith) ──
  featuredGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  bigCardWrap: { flex: 1 },
  bigCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 140,
  },
  bigCardIcon: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  bigCardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bigCardSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },

  // ── Hadith of the day card ──
  hadithCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hadithNarrator: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  hadithMatn: {
    fontSize: 15,
    lineHeight: 28,
    textAlign: 'right',
  },
  hadithOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  ornamentLine: { flex: 1, height: 0.7, maxWidth: 50 },
  ornamentDot: { width: 4, height: 4, borderRadius: 2 },
  hadithFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  // ── Featured articles horizontal ──
  featuredArticle: {
    width: 240,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredCover: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  featuredEmoji: {
    position: 'absolute',
    top: -10, end: -10,
    fontSize: 100,
    opacity: 0.25,
  },
  featuredOverlay: {
    padding: 12,
    gap: 6,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredMetaDot: {
    width: 2, height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 8, end: 8,
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Categories chips ──
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  // ── Collections grid ──
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  collectionCard: {
    width: '31.5%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  collectionIconBox: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  // ── Compact list row ──
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  compactCover: {
    width: 56, height: 56,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  // ── View all ──
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
