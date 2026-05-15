/**
 * شاشة الأحاديث النبوية - مجموعة مختارة من الكتب التسعة.
 * تصفّح حسب الفئة + بحث + نسخ ومشاركة.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight, Search, BookOpen, Copy, Share2, Check, Heart, Award,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { HADITHS, HADITH_CATEGORIES, HadithCategory } from '@data/hadith';
import { copyToClipboard, shareText } from '@utils/clipboard';

export default function HadithScreen() {
  const t = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState<HadithCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = HADITHS;
    if (category !== 'all') list = list.filter((h) => h.category === category);
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((h) => h.text.includes(q) || h.narrator.includes(q) || h.source.includes(q));
    }
    return list;
  }, [category, query]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>السنّة المطهّرة</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>الأحاديث النبوية</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* بطاقة هيرو */}
        <View style={[styles.heroCard, { backgroundColor: t.colors.primary, borderColor: t.colors.borderGold }]}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <BookOpen size={28} color="#FBF7EA" />
          </View>
          <Text style={styles.heroTitle}>من هدي النبي ﷺ</Text>
          <Text style={styles.heroSub}>
            مختارات من الأربعين النووية والكتب التسعة
          </Text>
          <View style={{ marginTop: 10 }}>
            <OrnamentalRule width={120} color="#FBF7EA" variant="rosette" />
          </View>
        </View>

        {/* بحث */}
        <View style={[styles.search, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <View style={[styles.searchIconWrap, { backgroundColor: t.colors.accent + '14' }]}>
            <Search size={16} color={t.colors.accent} strokeWidth={2} />
          </View>
          <TextInput
            placeholder="ابحث في الأحاديث..."
            placeholderTextColor={t.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15, fontWeight: '500' }}
          />
        </View>

        {/* فلاتر الفئات */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <CategoryChip label="الكل" active={category === 'all'} onPress={() => setCategory('all')} />
          {HADITH_CATEGORIES.map((c) => (
            <CategoryChip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        {/* العدّاد */}
        <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 6, marginBottom: 14, fontSize: 12, fontWeight: '700' }}>
          {filtered.length} حديث
        </Text>

        {/* قائمة الأحاديث */}
        <View style={{ gap: 14 }}>
          {filtered.map((h) => <HadithCard key={h.id} hadith={h} />)}
          {filtered.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text variant="caption" color={t.colors.textTertiary}>لا توجد نتائج</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────── شارة فئة ───────────────
const CategoryChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: active ? t.colors.accent : t.colors.border,
          backgroundColor: active ? t.colors.accent : t.colors.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={{
        fontSize: 13, fontWeight: '700',
        color: active ? '#FBF7EA' : t.colors.textSecondary,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─────────────── بطاقة حديث ───────────────
const HadithCard: React.FC<{ hadith: typeof HADITHS[number] }> = ({ hadith }) => {
  const t = useTheme();
  const [copied, setCopied] = useState(false);

  const fullText = `${hadith.narrator}: ${hadith.text}\n\n— ${hadith.source}\n\nمن تطبيق نَفَحات`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <Card padding={18} elevation="sm" bordered>
      {/* السند */}
      <Text variant="caption" color={t.colors.accent} style={{ fontWeight: '700', marginBottom: 8 }}>
        {hadith.narrator}
      </Text>

      {/* المتن */}
      <Text style={{
        fontFamily: t.fontFamilies.arabicQuran,
        fontSize: 17,
        lineHeight: 32,
        color: t.colors.textPrimary,
        textAlign: 'right',
        fontWeight: '500',
      }}>
        {hadith.text}
      </Text>

      {/* خط ذهبي */}
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <OrnamentalRule width={80} color={t.colors.accent} variant="simple" />
      </View>

      {/* footer: مصدر + درجة + أزرار */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Award size={12} color={t.colors.accentDeep} />
        <Text variant="caption" color={t.colors.accentDeep} style={{ fontWeight: '700' }}>
          {hadith.source}
        </Text>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 2,
          borderRadius: 999,
          backgroundColor: t.colors.success + '20',
        }}>
          <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>
            {hadith.grade}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleCopy}
          hitSlop={8}
          style={[styles.smallBtn, { backgroundColor: t.colors.surfaceAlt }]}
        >
          {copied ? <Check size={14} color={t.colors.success} /> : <Copy size={14} color={t.colors.textSecondary} />}
        </Pressable>
        <Pressable
          onPress={() => shareText(fullText, hadith.narrator)}
          hitSlop={8}
          style={[styles.smallBtn, { backgroundColor: t.colors.surfaceAlt }]}
        >
          <Share2 size={14} color={t.colors.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
};

const Text: any = RNText;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  heroCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FBF7EA', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(251,247,234,0.85)', marginTop: 4, textAlign: 'center' },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 8, paddingVertical: 8,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
  },
  searchIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 2,
  },

  smallBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
