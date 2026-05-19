/**
 * 📚 شاشة المقالات — مكتبة المحتوى الإسلامي.
 *
 * هوية Nafahat: أخضر primary + ذهبي accent، Ottoman touches في الـ featured.
 *
 * البنية:
 *  - Hero بسيط بالعنوان + بحث
 *  - شريط تصنيفات أفقي (chips)
 *  - "المتميّز" carousel (لو في مقالات featured)
 *  - "أحدث المقالات" grid/list مع كروت فاخرة
 *  - بحث inline يفلتر النتائج
 *
 * كل بطاقة:
 *  - cover gradient + emoji كبير (visual signature)
 *  - شارة التصنيف (لون feature)
 *  - عنوان + موجز
 *  - تاريخ النشر + عداد مشاهدات + وقت القراءة
 *  - أزرار: حفظ / مشاركة / إعجاب
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, FlatList, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  Search, ArrowRight, Bookmark, Heart, Share2, Eye, Clock, Calendar,
  Sparkles, ChevronLeft, BookOpen,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useArticlesStore } from '@store/index';
import {
  ARTICLES,
  ARTICLE_CATEGORIES,
  getFeaturedArticles,
  getLatestArticles,
  searchArticles,
  type Article,
  type ArticleCategory,
  type ArticleCategoryMeta,
} from '@data/articles';

export default function ArticlesScreen() {
  const t = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all');

  const isBookmarked = useArticlesStore((s) => s.isBookmarked);
  const isLiked = useArticlesStore((s) => s.isLiked);
  const toggleBookmark = useArticlesStore((s) => s.toggleBookmark);
  const toggleLike = useArticlesStore((s) => s.toggleLike);
  const getViews = useArticlesStore((s) => s.getViews);

  const filtered = useMemo(() => {
    let list: Article[];
    if (query.trim()) {
      list = searchArticles(query);
    } else if (activeCategory === 'all') {
      list = getLatestArticles();
    } else {
      list = ARTICLES.filter((a) => a.category === activeCategory)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    }
    return list;
  }, [query, activeCategory]);

  const featured = useMemo(() => getFeaturedArticles(), []);

  const handleShare = (article: Article) => {
    Share.share({
      title: article.title,
      message: `${article.title}\n\n${article.excerpt}\n\nمن تطبيق نَفَحات`,
    }).catch(() => {});
  };

  const formatDate = (ts: number) => {
    try {
      return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleDateString();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* HERO — green gradient bar */}
      <LinearGradient
        colors={[t.colors.primary, '#0F4A41', '#062825']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* نقش هندسي ذهبي خفيف */}
        <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} pointerEvents="none">
          <Path
            d="M0 0 L20 20 L0 40 L20 60 L0 80 M40 0 L60 20 L40 40 L60 60 L40 80 M80 0 L100 20 L80 40 L100 60 L80 80"
            stroke="#D4B570" strokeWidth="0.4" fill="none"
          />
        </Svg>

        <View style={styles.heroTop}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            style={styles.heroBackBtn}
          >
            <ArrowRight size={20} color="#FFF" strokeWidth={1.8} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.heroEyebrow}>مكتبة المحتوى</Text>
            <Text style={styles.heroTitle}>المقالات</Text>
          </View>
          <View style={styles.heroIconPlaceholder} />
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(212, 181, 112, 0.4)' }]}>
          <Search size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
          <TextInput
            placeholder="ابحث في المقالات..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Categories chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          <CategoryChip
            label="جميع التصنيفات"
            emoji="✦"
            color={t.colors.accent}
            active={activeCategory === 'all'}
            onPress={() => setActiveCategory('all')}
            t={t}
          />
          {ARTICLE_CATEGORIES.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.nameAr}
              emoji={c.emoji}
              color={c.color}
              active={activeCategory === c.id}
              onPress={() => setActiveCategory(c.id)}
              t={t}
            />
          ))}
        </ScrollView>

        {/* Featured carousel — يظهر فقط لو "all" بدون بحث */}
        {!query && activeCategory === 'all' && featured.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <View style={styles.sectionHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color={t.colors.accent} />
                <Text style={[styles.eyebrow, { color: t.colors.accent }]}>المتميّز</Text>
              </View>
              <Text variant="h3">مختارات الأسبوع</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {featured.map((article) => (
                <FeaturedCard
                  key={article.id}
                  article={article}
                  onPress={() => router.push(`/articles/${article.id}` as any)}
                  isBookmarked={isBookmarked(article.id)}
                  onBookmark={() => toggleBookmark(article.id)}
                  t={t}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Section header */}
        <View style={[styles.sectionHead, { marginTop: 18 }]}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>
            {query ? `نتائج البحث (${filtered.length})` : activeCategory === 'all' ? 'أحدث المقالات' : 'في هذا التصنيف'}
          </Text>
          <Text variant="h3">
            {query ? `«${query}»` : activeCategory === 'all' ? 'جميع المقالات' : ARTICLE_CATEGORIES.find((c) => c.id === activeCategory)?.nameAr}
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <BookOpen size={32} color={t.colors.textTertiary} />
            <Text variant="body" color={t.colors.textTertiary} style={{ marginTop: 12, textAlign: 'center' }}>
              {query ? `لا توجد نتائج لـ "${query}"` : 'لا توجد مقالات في هذا التصنيف بعد.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {filtered.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onPress={() => router.push(`/articles/${article.id}` as any)}
                onShare={() => handleShare(article)}
                onBookmark={() => toggleBookmark(article.id)}
                onLike={() => toggleLike(article.id)}
                isBookmarked={isBookmarked(article.id)}
                isLiked={isLiked(article.id)}
                views={getViews(article.id)}
                formatDate={formatDate}
                t={t}
              />
            ))}
          </View>
        )}

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════ Sub-components ═══════════

const CategoryChip: React.FC<{
  label: string;
  emoji: string;
  color: string;
  active: boolean;
  onPress: () => void;
  t: any;
}> = ({ label, emoji, color, active, onPress, t }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [
      styles.catChip,
      {
        backgroundColor: active ? color : t.colors.surface,
        borderColor: active ? color : t.colors.borderGold,
        opacity: pressed ? 0.8 : 1,
      },
    ]}
  >
    <Text style={{ fontSize: 14 }}>{emoji}</Text>
    <Text style={{ color: active ? '#FFF' : t.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

const FeaturedCard: React.FC<{
  article: Article;
  onPress: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  t: any;
}> = ({ article, onPress, isBookmarked, onBookmark, t }) => {
  const cat = ARTICLE_CATEGORIES.find((c) => c.id === article.category);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.95 : 1 }]}
    >
      <LinearGradient colors={article.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredCover}>
        {/* خلفية بسيطة - emoji كبير في الزاوية */}
        <Text style={styles.featuredEmoji}>{article.coverEmoji}</Text>
        {/* zoom على العنوان فوق الـ gradient */}
        <View style={[styles.featuredOverlay]}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.featuredContent}>
            <View style={[styles.featuredBadge, { backgroundColor: cat?.color ?? t.colors.accent }]}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                {cat?.nameAr ?? ''}
              </Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>{article.title}</Text>
            <View style={styles.featuredMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={11} color="rgba(255,255,255,0.85)" />
                <Text style={styles.featuredMetaText}>{article.readMinutes} د قراءة</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
      <Pressable
        onPress={(e) => { e.stopPropagation?.(); onBookmark(); }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
        style={[styles.featuredBookmark, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
      >
        <Bookmark size={14} color={isBookmarked ? t.colors.accent : '#FFF'} fill={isBookmarked ? t.colors.accent : 'transparent'} />
      </Pressable>
    </Pressable>
  );
};

const ArticleCard: React.FC<{
  article: Article;
  onPress: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onLike: () => void;
  isBookmarked: boolean;
  isLiked: boolean;
  views: number;
  formatDate: (ts: number) => string;
  t: any;
}> = ({ article, onPress, onShare, onBookmark, onLike, isBookmarked, isLiked, views, formatDate, t }) => {
  const cat = ARTICLE_CATEGORIES.find((c) => c.id === article.category);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [
        styles.articleCard,
        { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, opacity: pressed ? 0.96 : 1, shadowColor: t.colors.shadowColor },
      ]}
    >
      {/* Cover band */}
      <LinearGradient colors={article.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardCover}>
        <Text style={styles.cardCoverEmoji}>{article.coverEmoji}</Text>
        <View style={[styles.cardBadge, { backgroundColor: cat?.color ?? t.colors.accent }]}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
            {cat?.nameAr ?? ''}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        {/* meta row */}
        <View style={styles.cardMetaRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{formatDate(article.publishedAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Eye size={11} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{views}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{article.readMinutes} د</Text>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: t.colors.textPrimary }]} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={[styles.cardExcerpt, { color: t.colors.textSecondary }]} numberOfLines={2}>
          {article.excerpt}
        </Text>

        {/* actions */}
        <View style={styles.cardActions}>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onShare(); }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="مشاركة"
            style={({ pressed }) => [styles.actionPill, { backgroundColor: t.colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Share2 size={12} color={t.colors.accent} />
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>نشر</Text>
          </Pressable>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onBookmark(); }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ'}
            style={({ pressed }) => [styles.actionIconBtn, { borderColor: t.colors.borderGold, opacity: pressed ? 0.7 : 1 }]}
          >
            <Bookmark size={14} color={isBookmarked ? t.colors.accent : t.colors.textTertiary} fill={isBookmarked ? t.colors.accent : 'transparent'} />
          </Pressable>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onLike(); }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
            style={({ pressed }) => [styles.actionIconBtn, { borderColor: t.colors.borderGold, opacity: pressed ? 0.7 : 1 }]}
          >
            <Heart size={14} color={isLiked ? t.colors.error : t.colors.textTertiary} fill={isLiked ? t.colors.error : 'transparent'} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <ChevronLeft size={16} color={t.colors.accent} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  heroBackBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.3)',
  },
  heroIconPlaceholder: { width: 38, height: 38 },
  heroEyebrow: {
    fontSize: 10,
    color: '#D4B570',
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '800',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    textAlign: 'right',
  },
  // ── Categories ──
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  // ── Section ──
  sectionHead: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '800' },
  // ── Featured ──
  featuredRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featuredCard: {
    width: 280,
    height: 180,
    borderRadius: 18,
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
    fontSize: 120,
    opacity: 0.25,
  },
  featuredOverlay: {
    minHeight: 100,
    justifyContent: 'flex-end',
    padding: 14,
  },
  featuredContent: {
    gap: 6,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBookmark: {
    position: 'absolute',
    top: 10, start: 10,
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  // ── Article cards ──
  articleCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCover: {
    height: 100,
    justifyContent: 'flex-end',
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCoverEmoji: {
    position: 'absolute',
    top: -16, end: -10,
    fontSize: 110,
    opacity: 0.22,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
  },
  cardExcerpt: {
    fontSize: 13,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actionIconBtn: {
    width: 30, height: 30,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
