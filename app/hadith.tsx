/**
 * 📜 شاشة الأحاديث النبوية — تصميم فاخر بهوية Nafahat.
 *
 * البنية:
 *  - Hero أخضر premium: "من هدي النبي ﷺ" + 📖 icon + subtitle
 *  - Search bar ذهبي خفيف
 *  - تصنيف مزدوج: المصدر (Bukhari/Muslim/Nawawi...) + الموضوع (إيمان/أخلاق...)
 *  - عداد "X حديث" تحت الـ chips
 *  - كروت أحاديث:
 *    - السند المختصر فوق
 *    - متن الحديث في الوسط
 *    - زخرفة عثمانية (نقطة + خطوط) فاصلة
 *    - شارة المصدر + الدرجة أسفل
 *    - أيقونات نسخ ومشاركة في الجانب
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowRight, Search, BookOpen, Copy, Share2, Check, Bookmark, Award,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import {
  HADITHS, HADITH_CATEGORIES, HADITH_COLLECTIONS,
  type HadithCategory, type HadithCollection, type Hadith,
  searchHadiths, getCollectionMeta, getCollectionCounts,
} from '@data/hadith';
import { copyToClipboard, shareText } from '@utils/clipboard';
import { arabicNumber } from '@data/surahs';

type FilterTab = 'collection' | 'category';

export default function HadithScreen() {
  const t = useTheme();
  const router = useRouter();

  const [filterTab, setFilterTab] = useState<FilterTab>('collection');
  const [collection, setCollection] = useState<HadithCollection | 'all'>('all');
  const [category, setCategory] = useState<HadithCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(() => getCollectionCounts(), []);

  const filtered = useMemo(() => {
    let list: Hadith[];
    if (query.trim()) {
      list = searchHadiths(query);
    } else {
      list = HADITHS;
      if (collection !== 'all') list = list.filter((h) => h.collection === collection);
      if (category !== 'all') list = list.filter((h) => h.category === category);
    }
    // sort: Nawawi-40 by number, then by collection priority (sahih first)
    return list.sort((a, b) => {
      if (a.collection === b.collection) {
        return (a.number ?? 0) - (b.number ?? 0);
      }
      return 0;
    });
  }, [collection, category, query]);

  const handleCopy = async (h: Hadith) => {
    const text = `${h.narrator}\n\n${h.text}\n\n${getCollectionMeta(h.collection)?.nameAr ?? ''}${h.reference ? ` · ${h.reference}` : ''}\n\nمن تطبيق نَفَحات`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(h.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleShare = (h: Hadith) => {
    shareText(
      `${h.narrator}\n\n${h.text}\n\n${getCollectionMeta(h.collection)?.nameAr ?? ''}${h.reference ? ` · ${h.reference}` : ''}`,
      'حديث نبوي - نَفَحات',
    ).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ════ Top bar ════ */}
        <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            style={[styles.iconBtn, { borderColor: t.colors.border }]}
          >
            <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>السنة المطهّرة</Text>
            <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>الأحاديث النبوية</Text>
          </View>
          <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
        </View>

        {/* ════ Hero — green premium banner ════ */}
        <LinearGradient
          colors={[t.colors.primary, '#0F4A41', '#062825']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* نقش هندسي ذهبي خفيف */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.10 }]} pointerEvents="none">
            <Path
              d="M0 30 L20 10 L40 30 L60 10 L80 30 L100 10 M0 70 L20 50 L40 70 L60 50 L80 70 L100 50"
              stroke="#D4B570" strokeWidth="0.4" fill="none"
            />
          </Svg>

          {/* heroes ornaments على الـ corners */}
          <View pointerEvents="none" style={[styles.cornerOrnament, { top: 6, start: 6 }]}>
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M 2 2 L 8 2 M 2 2 L 2 8" stroke="#D4B570" strokeWidth="0.8" />
              <Circle cx="2" cy="2" r="1.5" fill="#D4B570" opacity={0.7} />
            </Svg>
          </View>
          <View pointerEvents="none" style={[styles.cornerOrnament, { top: 6, end: 6, transform: [{ scaleX: -1 }] }]}>
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M 2 2 L 8 2 M 2 2 L 2 8" stroke="#D4B570" strokeWidth="0.8" />
              <Circle cx="2" cy="2" r="1.5" fill="#D4B570" opacity={0.7} />
            </Svg>
          </View>

          <View style={[styles.heroIconBox, { borderColor: '#D4B570', backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <BookOpen size={28} color="#D4B570" strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>من هدي النبي ﷺ</Text>
          <Text style={styles.heroSubtitle}>مختارات من الأربعين النووية والكتب التسعة</Text>

          {/* ornamental dots */}
          <View style={styles.heroDots}>
            <View style={styles.heroDotLine} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4B570' }} />
            <View style={styles.heroDotLine} />
          </View>
        </LinearGradient>

        {/* ════ Search bar ════ */}
        <View style={{ paddingHorizontal: 16, marginTop: -6 }}>
          <View style={[styles.searchBox, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <Search size={16} color={t.colors.textTertiary} strokeWidth={1.8} />
            <TextInput
              placeholder="ابحث في الأحاديث..."
              placeholderTextColor={t.colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={[styles.searchInput, { color: t.colors.textPrimary }]}
            />
          </View>
        </View>

        {/* ════ Filter tabs (collection vs category) ════ */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <View style={[styles.tabsContainer, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <Pressable
              onPress={() => setFilterTab('collection')}
              accessibilityRole="button"
              accessibilityLabel="فلتر حسب الكتاب"
              style={[
                styles.filterTab,
                filterTab === 'collection' && { backgroundColor: t.colors.primary },
              ]}
            >
              <Text style={{
                color: filterTab === 'collection' ? '#FFF' : t.colors.textPrimary,
                fontWeight: '700',
                fontSize: 12,
              }}>
                حسب الكتاب
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterTab('category')}
              accessibilityRole="button"
              accessibilityLabel="فلتر حسب الموضوع"
              style={[
                styles.filterTab,
                filterTab === 'category' && { backgroundColor: t.colors.primary },
              ]}
            >
              <Text style={{
                color: filterTab === 'category' ? '#FFF' : t.colors.textPrimary,
                fontWeight: '700',
                fontSize: 12,
              }}>
                حسب الموضوع
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ════ Chips row (depends on filterTab) ════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {filterTab === 'collection' ? (
            <>
              <FilterChip
                label="الكل"
                count={HADITHS.length}
                active={collection === 'all'}
                color={t.colors.accent}
                onPress={() => { setCollection('all'); setCategory('all'); }}
                t={t}
              />
              {HADITH_COLLECTIONS.filter((c) => (counts[c.id] ?? 0) > 0).map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.nameAr}
                  count={counts[c.id] ?? 0}
                  active={collection === c.id}
                  color={c.color}
                  onPress={() => { setCollection(c.id); setCategory('all'); }}
                  t={t}
                />
              ))}
            </>
          ) : (
            <>
              <FilterChip
                label="الكل"
                count={HADITHS.length}
                active={category === 'all'}
                color={t.colors.accent}
                onPress={() => { setCategory('all'); setCollection('all'); }}
                t={t}
              />
              {HADITH_CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat}
                  count={HADITHS.filter((h) => h.category === cat).length}
                  active={category === cat}
                  color={t.colors.primary}
                  onPress={() => { setCategory(cat); setCollection('all'); }}
                  t={t}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* ════ Counter ════ */}
        <View style={{ alignItems: 'flex-start', paddingHorizontal: 22, marginBottom: 6 }}>
          <Text style={{ color: t.colors.accent, fontSize: 13, fontWeight: '800' }}>
            {arabicNumber(filtered.length)} حديث
          </Text>
        </View>

        {/* ════ Hadith list ════ */}
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Award size={32} color={t.colors.textTertiary} />
            <Text variant="body" color={t.colors.textTertiary} style={{ marginTop: 12, textAlign: 'center' }}>
              {query ? `لا توجد نتائج لـ "${query}"` : 'لا توجد أحاديث في هذا التصنيف.'}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {filtered.map((h) => (
              <HadithCard
                key={h.id}
                hadith={h}
                isCopied={copiedId === h.id}
                onCopy={() => handleCopy(h)}
                onShare={() => handleShare(h)}
                t={t}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ═══════ Components ═══════

const FilterChip: React.FC<{
  label: string;
  count: number;
  active: boolean;
  color: string;
  onPress: () => void;
  t: any;
}> = ({ label, count, active, color, onPress, t }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label}، ${count} حديث`}
    style={({ pressed }) => [
      styles.filterChip,
      {
        backgroundColor: active ? color : t.colors.surface,
        borderColor: active ? color : t.colors.borderGold,
        opacity: pressed ? 0.8 : 1,
      },
    ]}
  >
    <Text style={{ color: active ? '#FFF' : t.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
      {label}
    </Text>
    <View style={[styles.chipBadge, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : t.colors.surfaceAlt }]}>
      <Text style={{ color: active ? '#FFF' : t.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
        {arabicNumber(count)}
      </Text>
    </View>
  </Pressable>
);

const HadithCard: React.FC<{
  hadith: Hadith;
  isCopied: boolean;
  onCopy: () => void;
  onShare: () => void;
  t: any;
}> = ({ hadith, isCopied, onCopy, onShare, t }) => {
  const collMeta = getCollectionMeta(hadith.collection);
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, shadowColor: t.colors.shadowColor }]}>
      {/* رقم الحديث (لأحاديث النووي) */}
      {hadith.number ? (
        <View style={[styles.numberBadge, { backgroundColor: collMeta?.color ?? t.colors.primary }]}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
            {arabicNumber(hadith.number)}
          </Text>
        </View>
      ) : null}

      {/* السند */}
      <Text style={[styles.narrator, { color: t.colors.textPrimary }]}>
        {hadith.narrator}
      </Text>

      {/* متن الحديث */}
      <Text style={[styles.matn, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}>
        {hadith.text}
      </Text>

      {/* زخرفة عثمانية فاصلة (• ━━━━ • ━━━━ •) */}
      <View style={styles.ornamentRow}>
        <View style={[styles.ornamentLine, { backgroundColor: t.colors.borderGold }]} />
        <View style={[styles.ornamentDot, { backgroundColor: t.colors.accent }]} />
        <View style={[styles.ornamentLine, { backgroundColor: t.colors.borderGold }]} />
      </View>

      {/* Footer: المصدر + الدرجة + الأكشن */}
      <View style={styles.cardFooter}>
        <View style={styles.cardActionsRow}>
          <Pressable
            onPress={onShare}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="مشاركة"
            style={({ pressed }) => [styles.actionIcon, { borderColor: t.colors.borderGold, opacity: pressed ? 0.6 : 1 }]}
          >
            <Share2 size={14} color={t.colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onCopy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isCopied ? 'تم النسخ' : 'نسخ'}
            style={({ pressed }) => [
              styles.actionIcon,
              {
                borderColor: isCopied ? t.colors.success : t.colors.borderGold,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            {isCopied ? <Check size={14} color={t.colors.success} /> : <Copy size={14} color={t.colors.textSecondary} />}
          </Pressable>
        </View>

        <View style={styles.sourcePill}>
          <View style={[styles.gradeChip, { backgroundColor: collMeta?.color + '14' ?? t.colors.surfaceAlt, borderColor: collMeta?.color + '40' ?? t.colors.borderGold }]}>
            <Text style={{ color: collMeta?.color ?? t.colors.accent, fontSize: 10, fontWeight: '700' }}>
              {collMeta?.nameAr ?? hadith.collection}
            </Text>
          </View>
          <View style={[styles.gradeChip, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderGold }]}>
            <Bookmark size={9} color={t.colors.accent} fill={t.colors.accent} />
            <Text style={{ color: t.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
              {hadith.grade}
            </Text>
          </View>
        </View>
      </View>
    </View>
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

  // Hero
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cornerOrnament: { position: 'absolute' },
  heroIconBox: {
    width: 60, height: 60,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  heroDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  heroDotLine: {
    width: 28, height: 0.8,
    backgroundColor: 'rgba(212, 181, 112, 0.45)',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    textAlign: 'right',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingStart: 12,
    paddingEnd: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },

  // Card
  card: {
    padding: 16,
    paddingTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    position: 'relative',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  numberBadge: {
    position: 'absolute',
    top: 12,
    end: 12,
    minWidth: 28, height: 22,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrator: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
    paddingEnd: 36,
  },
  matn: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: 'right',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  ornamentLine: {
    flex: 1,
    height: 0.7,
    maxWidth: 70,
  },
  ornamentDot: {
    width: 4, height: 4,
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIcon: {
    width: 30, height: 30,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  sourcePill: {
    flexDirection: 'row',
    gap: 6,
  },
  gradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});
