/**
 * شاشة البحث الشامل - يبحث عبر السور، القراء، دروس التجويد، الأذكار.
 * تصميم محدّث: بحث pill بأيقونة ذهبية + filter pills بأيقونات + بطاقات نتائج بـ hover.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search, X, BookOpen, Headphones, Sparkles, Clock,
  TrendingUp, ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card, AppHeader } from '@components/ui';
import { SURAHS, arabicNumber } from '@data/surahs';
import { RECITERS } from '@data/reciters';
import { TAJWEED_LESSONS } from '@data/tajweedBook';
import { ADHKAR } from '@data/adhkar';
import { searchQuran, SearchResult } from '@services/quranSearch';

type Scope = 'all' | 'verses' | 'surah' | 'reciter' | 'lesson' | 'dhikr';

const RECENT = ['الفاتحة', 'الكهف', 'يس', 'الرحمن', 'الملك'];
const SUGGESTIONS = ['آية الكرسي', 'سورة الرحمن', 'مشاري العفاسي', 'أحكام النون الساكنة', 'أذكار الصباح'];

const SCOPES: { id: Scope; label: string; emoji: string; color: string }[] = [
  { id: 'all',     label: 'الكل',     emoji: '✦', color: '#B8923B' },
  { id: 'verses',  label: 'في الآيات', emoji: '﴿﴾', color: '#0A3D38' },
  { id: 'surah',   label: 'السور',    emoji: '📖', color: '#0F4A41' },
  { id: 'reciter', label: 'القرّاء',  emoji: '🎧', color: '#2F5A8C' },
  { id: 'lesson',  label: 'الدروس',   emoji: '🎓', color: '#5E7F4F' },
  { id: 'dhikr',   label: 'الأذكار',  emoji: '📿', color: '#A2384B' },
];

export default function SearchScreen() {
  const t = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [verseResults, setVerseResults] = useState<SearchResult[]>([]);
  const [searchingVerses, setSearchingVerses] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    const surahs = (scope === 'all' || scope === 'surah')
      ? SURAHS.filter((s) => s.nameAr.includes(query) || s.nameEn.toLowerCase().includes(q)).slice(0, 8) : [];
    const reciters = (scope === 'all' || scope === 'reciter')
      ? RECITERS.filter((r) => r.nameAr.includes(query) || r.nameEn.toLowerCase().includes(q)).slice(0, 6) : [];
    const lessons = (scope === 'all' || scope === 'lesson')
      ? TAJWEED_LESSONS.filter((l) => l.title.includes(query) || l.category.includes(query)).slice(0, 6) : [];
    const adhkar = (scope === 'all' || scope === 'dhikr')
      ? ADHKAR.filter((d) => d.title.includes(query) || d.body.includes(query)).slice(0, 6) : [];
    return { surahs, reciters, lessons, adhkar };
  }, [query, scope]);

  // البحث في الآيات (async)
  useEffect(() => {
    if (!query.trim() || (scope !== 'all' && scope !== 'verses')) {
      setVerseResults([]);
      return;
    }
    if (query.trim().length < 2) {
      setVerseResults([]);
      return;
    }
    setSearchingVerses(true);
    const timer = setTimeout(() => {
      searchQuran(query, 20)
        .then(setVerseResults)
        .catch(() => setVerseResults([]))
        .finally(() => setSearchingVerses(false));
    }, 350); // debounce
    return () => clearTimeout(timer);
  }, [query, scope]);

  const totalResults = (results
    ? results.surahs.length + results.reciters.length + results.lessons.length + results.adhkar.length
    : 0) + verseResults.length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* ترويسة */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/(tabs)');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <X size={18} color={t.colors.textPrimary} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>بحث شامل</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>اعثر على ما تحب</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }}>
        {/* بحث pill بأيقونة ذهبية */}
        <View style={[styles.search, { backgroundColor: t.colors.surface, borderColor: t.colors.border, ...t.shadows.sm, shadowColor: t.colors.shadowColor }]}>
          <View style={[styles.searchIconWrap, { backgroundColor: t.colors.accent + '14' }]}>
            <Search size={16} color={t.colors.accent} strokeWidth={2} />
          </View>
          <TextInput
            placeholder="ابحث في القرآن، القرّاء، الدروس، الأذكار..."
            placeholderTextColor={t.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15, fontWeight: '500' }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={{ padding: 6 }}>
              <X size={16} color={t.colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {/* فلاتر بأيقونات */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {SCOPES.map((s) => (
            <ScopePill
              key={s.id}
              {...s}
              active={scope === s.id}
              onPress={() => setScope(s.id)}
            />
          ))}
        </View>

        {/* محتوى - حالة فارغة أو نتائج */}
        {!query.trim() ? (
          <>
            {/* آخر بحث */}
            <View style={[styles.sectionHead, { marginTop: 28 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color={t.colors.accent} />
                <Text style={[styles.sectionLabel, { color: t.colors.accent }]}>آخر بحث</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RECENT.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setQuery(r)}
                  style={({ pressed }) => [
                    styles.recentChip,
                    {
                      backgroundColor: t.colors.surfaceAlt,
                      borderColor: t.colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Clock size={12} color={t.colors.textTertiary} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.colors.textPrimary }}>{r}</Text>
                </Pressable>
              ))}
            </View>

            {/* اقتراحات */}
            <View style={[styles.sectionHead, { marginTop: 24 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} color={t.colors.accent} />
                <Text style={[styles.sectionLabel, { color: t.colors.accent }]}>اقتراحات شائعة</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setQuery(s)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: t.colors.accent + '10',
                      borderColor: t.colors.accent + '30',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Sparkles size={11} color={t.colors.accent} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.accentDeep }}>{s}</Text>
                </Pressable>
              ))}
            </View>

            {/* نصيحة */}
            <View style={[styles.hint, { backgroundColor: t.colors.primary + '08', borderColor: t.colors.primary + '20' }]}>
              <Text style={{ fontSize: 22 }}>💡</Text>
              <Text style={{ flex: 1, fontSize: 12, color: t.colors.textSecondary, marginStart: 10, lineHeight: 18 }}>
                يمكنك البحث بأسماء السور، القرّاء، أحكام التجويد، أو نصوص الأذكار.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* عداد النتائج */}
            <View style={[styles.resultsCount, { backgroundColor: t.colors.surfaceAlt }]}>
              <Text style={{ fontSize: 12, color: t.colors.textSecondary, fontWeight: '600' }}>
                {totalResults > 0 ? `${arabicNumber(totalResults)} نتيجة لـ "${query}"` : `لا توجد نتائج لـ "${query}"`}
              </Text>
            </View>

            {/* المجموعات */}
            <View style={{ marginTop: 16, gap: 22 }}>
              {/* نتائج الآيات (الجديدة - بحث في النص القرآني) */}
              {verseResults.length > 0 ? (
                <ResultGroup title="في الآيات" icon={<BookOpen size={14} color="#0A3D38" />} color="#0A3D38">
                  {verseResults.slice(0, 10).map((r) => (
                    <Pressable
                      key={`${r.surahId}-${r.ayahNumber}`}
                      onPress={() => router.replace(`/surah/${r.surahId}`)}
                      style={({ pressed }) => [
                        styles.verseCard,
                        {
                          backgroundColor: t.colors.surface,
                          borderColor: pressed ? t.colors.accent + '50' : t.colors.borderGold,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: t.fontFamilies.arabicQuran,
                          fontSize: 17,
                          lineHeight: 32,
                          color: t.colors.textPrimary,
                          textAlign: 'right',
                          fontWeight: '500',
                        }}
                        numberOfLines={3}
                      >
                        {r.text}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#0A3D38' }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0A3D38', letterSpacing: 0.5 }}>
                          سورة {r.surahName} · الآية {arabicNumber(r.ayahNumber)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ResultGroup>
              ) : null}

              {searchingVerses ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text variant="caption" color={t.colors.textTertiary}>جاري البحث في الآيات...</Text>
                </View>
              ) : null}

              {results?.surahs.length ? (
                <ResultGroup title="السور" icon={<BookOpen size={14} color={t.colors.primary} />} color={t.colors.primary}>
                  {results.surahs.map((s) => (
                    <ResultCard
                      key={s.id}
                      title={s.nameAr}
                      sub={`${arabicNumber(s.versesCount)} آية · صفحة ${arabicNumber(s.pageStart)}`}
                      onPress={() => router.replace(`/surah/${s.id}`)}
                      titleFontFamily={t.fontFamilies.arabicQuran}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {results?.reciters.length ? (
                <ResultGroup title="القرّاء" icon={<Headphones size={14} color="#2F5A8C" />} color="#2F5A8C">
                  {results.reciters.map((r) => (
                    <ResultCard
                      key={r.id}
                      title={r.nameAr}
                      sub={`${r.countryAr} · ${r.style}`}
                      onPress={() => router.replace(`/reciter/${r.id}`)}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {results?.lessons.length ? (
                <ResultGroup title="دروس التجويد" icon={<Sparkles size={14} color="#5E7F4F" />} color="#5E7F4F">
                  {results.lessons.map((l) => (
                    <ResultCard
                      key={l.id}
                      title={l.title}
                      sub={l.category}
                      onPress={() => router.replace(`/tajweed/${l.id}`)}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {results?.adhkar.length ? (
                <ResultGroup title="الأذكار" icon={<Sparkles size={14} color="#A2384B" />} color="#A2384B">
                  {results.adhkar.map((d) => (
                    <ResultCard
                      key={d.id}
                      title={d.title}
                      sub={d.body}
                      onPress={() => router.replace(`/adhkar/${d.category}`)}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {totalResults === 0 ? (
                <View style={styles.emptyResults}>
                  <Text style={{ fontSize: 48 }}>🔍</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.textPrimary, marginTop: 14 }}>
                    لا توجد نتائج
                  </Text>
                  <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                    جرّب كلمة مفتاحية أخرى أو غيّر التصنيف
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────── شارة فلتر ───────────────
const ScopePill: React.FC<{
  id: Scope; label: string; emoji: string; color: string; active: boolean; onPress: () => void;
}> = ({ label, emoji, color, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 8,
          borderRadius: 999, borderWidth: 1.5,
          borderColor: active ? color : t.colors.border,
          backgroundColor: active ? color : t.colors.surface,
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? color : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: active ? 0.2 : 0,
          shadowRadius: 8,
          elevation: active ? 3 : 0,
        },
      ]}
    >
      <Text style={{ fontSize: 12 }}>{emoji}</Text>
      <Text style={{
        fontSize: 12, fontWeight: '700',
        color: active ? '#fff' : t.colors.textSecondary,
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─────────────── مجموعة نتائج ───────────────
const ResultGroup: React.FC<{
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}> = ({ title, icon, color, children }) => {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + '14', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color }}>{title}</Text>
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
};

// ─────────────── بطاقة نتيجة ───────────────
const ResultCard: React.FC<{
  title: string; sub: string; onPress: () => void; titleFontFamily?: string;
}> = ({ title, sub, onPress, titleFontFamily }) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.resultCard,
        {
          backgroundColor: t.colors.surface,
          borderColor: hovered ? t.colors.accent + '40' : t.colors.border,
          transform: [
            { scale: pressed ? 0.985 : 1 },
            { translateX: hovered && Platform.OS === 'web' ? -2 : 0 },
          ],
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15, fontWeight: '700', color: t.colors.textPrimary,
          fontFamily: titleFontFamily,
        }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 3 }} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <ArrowLeft size={16} color={t.colors.textTertiary} />
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

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 8, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHead: { marginBottom: 12 },
  sectionLabel: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },

  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
  },

  hint: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },

  resultsCount: {
    marginTop: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  emptyResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  verseCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
});
