/**
 * 📄 شاشة قراءة مقال — Article detail.
 *
 * Hero:
 *  - cover gradient + emoji كبير
 *  - شارة التصنيف (لون feature)
 *  - عنوان فاخر
 *  - meta row (تاريخ، قراءة، مشاهدات)
 *
 * Body:
 *  - النص الكامل بـ paragraph spacing مريح
 *  - دعم headers (لو في #/##) و bullets
 *  - زر "ابحث في نَفَحات" لو في reference
 *
 * Footer:
 *  - tags
 *  - أزرار: حفظ / إعجاب / مشاركة / نسخ
 *  - مقالات مقترحة (نفس التصنيف)
 *
 * Identity: أخضر primary + ذهبي accent + Ottoman ornaments بين الـ sections.
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Bookmark, Heart, Share2, Copy, Eye, Clock, Calendar,
  ChevronLeft, AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useArticlesStore } from '@store/index';
import { copyToClipboard } from '@utils/clipboard';
import {
  getArticleById,
  ARTICLE_CATEGORIES,
  getArticlesByCategory,
  type Article,
} from '@data/articles';

export default function ArticleDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = useMemo(() => (id ? getArticleById(String(id)) : undefined), [id]);

  const isBookmarked = useArticlesStore((s) => s.isBookmarked);
  const isLiked = useArticlesStore((s) => s.isLiked);
  const toggleBookmark = useArticlesStore((s) => s.toggleBookmark);
  const toggleLike = useArticlesStore((s) => s.toggleLike);
  const markAsViewed = useArticlesStore((s) => s.markAsViewed);
  const getViews = useArticlesStore((s) => s.getViews);

  const [copied, setCopied] = React.useState(false);

  // 👁️ سجّل المشاهدة عند فتح الصفحة
  useEffect(() => {
    if (article) markAsViewed(article.id);
  }, [article?.id, markAsViewed]);

  if (!article) {
    return (
      <View style={[styles.errorWrap, { backgroundColor: t.colors.background }]}>
        <AlertCircle size={36} color={t.colors.error} />
        <Text variant="body" color={t.colors.textSecondary} style={{ marginTop: 14, textAlign: 'center' }}>
          المقال غير موجود
        </Text>
        <Pressable
          onPress={() => router.replace('/articles' as any)}
          style={({ pressed }) => [
            styles.errorBtn,
            { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={{ color: '#FFF', fontWeight: '800' }}>عودة للمكتبة</Text>
        </Pressable>
      </View>
    );
  }

  const cat = ARTICLE_CATEGORIES.find((c) => c.id === article.category);
  const related = useMemo(
    () => getArticlesByCategory(article.category).filter((a) => a.id !== article.id).slice(0, 3),
    [article],
  );

  const handleShare = () => {
    Share.share({
      title: article.title,
      message: `${article.title}\n\n${article.excerpt}\n\nاقرأ المزيد في تطبيق نَفَحات.`,
    }).catch(() => {});
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(`${article.title}\n\n${article.body}\n\nمن تطبيق نَفَحات`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const formatDate = (ts: number) => {
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleDateString();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* HERO COVER */}
        <LinearGradient colors={article.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {/* خلفية نقش هندسي خفيف */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} pointerEvents="none">
            <Path
              d="M0 40 L20 20 L40 40 L60 20 L80 40 L100 20 M0 80 L20 60 L40 80 L60 60 L80 80 L100 60"
              stroke="#D4B570" strokeWidth="0.5" fill="none"
            />
          </Svg>

          {/* Top bar */}
          <View style={styles.heroTop}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="رجوع"
              style={styles.iconBtn}
            >
              <ArrowRight size={20} color="#FFF" strokeWidth={1.8} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => toggleBookmark(article.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked(article.id) ? 'إزالة من المحفوظات' : 'حفظ'}
              style={styles.iconBtn}
            >
              <Bookmark
                size={20}
                color={isBookmarked(article.id) ? '#D4B570' : '#FFF'}
                fill={isBookmarked(article.id) ? '#D4B570' : 'transparent'}
                strokeWidth={1.8}
              />
            </Pressable>
          </View>

          {/* Cover content */}
          <View style={styles.heroCenter}>
            <Text style={styles.heroEmoji}>{article.coverEmoji}</Text>
            <View style={[styles.heroBadge, { backgroundColor: cat?.color ?? '#D4B570' }]}>
              <Text style={styles.heroBadgeText}>{cat?.nameAr ?? ''}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {article.title}
            </Text>
          </View>

          {/* meta strip */}
          <View style={styles.heroMeta}>
            <MetaItem icon={<Clock size={11} color="rgba(255,255,255,0.85)" />} text={`${article.readMinutes} دقيقة قراءة`} />
            <View style={styles.metaDot} />
            <MetaItem icon={<Eye size={11} color="rgba(255,255,255,0.85)" />} text={`${getViews(article.id)} مشاهدة`} />
            <View style={styles.metaDot} />
            <MetaItem icon={<Calendar size={11} color="rgba(255,255,255,0.85)" />} text={formatDate(article.publishedAt)} />
          </View>
        </LinearGradient>

        {/* Excerpt with ornamental quote */}
        <View style={styles.excerptWrap}>
          <View style={[styles.excerptQuote, { borderColor: t.colors.accent }]}>
            <Text style={[styles.excerptText, { color: t.colors.textSecondary }]}>
              {article.excerpt}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
        </View>

        {/* BODY — render paragraphs with proper spacing */}
        <View style={{ paddingHorizontal: 22 }}>
          {article.body.split('\n').map((paragraph, idx) => {
            if (!paragraph.trim()) return <View key={idx} style={{ height: 8 }} />;
            // bold heading: lines starting with **
            const isHeading = /^\*\*[^*]+\*\*$/.test(paragraph.trim());
            const isBulletDot = paragraph.trim().startsWith('•');
            const isNumberItem = /^\d+[.)] /.test(paragraph.trim()) || /^\d+\. /.test(paragraph.trim());

            if (isHeading) {
              const text = paragraph.trim().replace(/\*\*/g, '');
              return (
                <Text
                  key={idx}
                  style={[styles.bodyHeading, { color: t.colors.accent }]}
                >
                  {text}
                </Text>
              );
            }
            if (isBulletDot) {
              return (
                <View key={idx} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: t.colors.accent }]} />
                  <Text style={[styles.bodyText, { color: t.colors.textPrimary, flex: 1 }]}>
                    {paragraph.trim().slice(1).trim()}
                  </Text>
                </View>
              );
            }
            return (
              <Text
                key={idx}
                style={[styles.bodyText, { color: t.colors.textPrimary, marginBottom: isNumberItem ? 8 : 14 }]}
              >
                {paragraph.trim()}
              </Text>
            );
          })}
        </View>

        {/* Tags */}
        {article.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {article.tags.map((tag) => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderGold }]}>
                <Text style={{ color: t.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Actions bar */}
        <View style={styles.actionsBar}>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="مشاركة"
            style={({ pressed }) => [
              styles.actionBigBtn,
              { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Share2 size={16} color={t.colors.accent} />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>مشاركة</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleLike(article.id)}
            accessibilityRole="button"
            accessibilityLabel="إعجاب"
            style={({ pressed }) => [
              styles.actionSmallBtn,
              { borderColor: t.colors.borderGold, backgroundColor: t.colors.surface, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Heart
              size={16}
              color={isLiked(article.id) ? t.colors.error : t.colors.textTertiary}
              fill={isLiked(article.id) ? t.colors.error : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel="نسخ"
            style={({ pressed }) => [
              styles.actionSmallBtn,
              { borderColor: copied ? t.colors.success : t.colors.borderGold, backgroundColor: t.colors.surface, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Copy size={16} color={copied ? t.colors.success : t.colors.textTertiary} />
          </Pressable>
        </View>

        {/* Related */}
        {related.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <OrnamentalRule width={100} color={t.colors.accent} variant="rosette" />
            </View>
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اقرأ أيضاً</Text>
              <Text variant="h3">من نفس التصنيف</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {related.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.replace(`/articles/${r.id}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel={r.title}
                  style={({ pressed }) => [
                    styles.relatedCard,
                    { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, opacity: pressed ? 0.93 : 1 },
                  ]}
                >
                  <LinearGradient colors={r.coverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.relatedCover}>
                    <Text style={styles.relatedEmoji}>{r.coverEmoji}</Text>
                  </LinearGradient>
                  <View style={{ padding: 10 }}>
                    <Text style={{ color: t.colors.textPrimary, fontWeight: '800', fontSize: 13 }} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>
                      {r.readMinutes} د قراءة
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
        </View>
      </ScrollView>
    </View>
  );
}

const MetaItem: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    {icon}
    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 18,
  },

  // Hero
  hero: {
    paddingTop: TOP_BAR_PAD,
    paddingBottom: 26,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    minHeight: 320,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.3)',
  },
  heroCenter: {
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  heroEmoji: {
    fontSize: 72,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    paddingHorizontal: 14,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  metaDot: {
    width: 3, height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(212, 181, 112, 0.7)',
  },

  // Excerpt
  excerptWrap: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  excerptQuote: {
    borderStartWidth: 3,
    paddingStart: 14,
    paddingVertical: 4,
  },
  excerptText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // Body
  bodyHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 28,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingStart: 8,
  },
  bulletDot: {
    width: 6, height: 6,
    borderRadius: 3,
    marginTop: 12,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 22,
    marginTop: 18,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Actions bar
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    marginTop: 22,
  },
  actionBigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionSmallBtn: {
    width: 46, height: 46,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  // Related
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '800' },
  relatedCard: {
    width: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  relatedCover: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  relatedEmoji: {
    fontSize: 44,
    opacity: 0.85,
  },
});
