/**
 * 📿 شاشة قائمة الأذكار - تصميم حصن المسلم الكامل.
 *
 * - شبكة 4 أعمدة (على ويب) أو 3 (على موبايل) من البطاقات
 * - كل تصنيف بأيقونة دائرية (Lucide) + اسم + عدد الأذكار
 * - ألوان هوية التطبيق (ذهبي/كريمي/أخضر زمردي)
 * - بحث بسيط في الأعلى
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sunrise, Moon, Bed, Heart, Home, Coffee, Landmark, Droplets, Wind,
  Shield, Plane, Utensils, Activity, Users, CloudRain, Sunset, MapPin,
  Wallet, Sparkles, BookOpen, Shirt, Star, Search,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, AppHeader } from '@components/ui';
import { DHIKR_CATEGORIES, getAdhkarCountForCategory } from '@data/adhkar';
import { arabicNumber } from '@data/surahs';
import { useSafeBack } from '@/utils/navigation';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sunrise, Moon, Bed, Heart, Home, Coffee, Landmark, Droplets, Wind,
  Shield, Plane, Utensils, Activity, Users, CloudRain, Sunset, MapPin,
  Wallet, Sparkles, BookOpen, Shirt, Star,
};

export default function AdhkarListScreen() {
  const t = useTheme();
  const router = useRouter();
  const goBack = useSafeBack('/');
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');

  // عدد الأعمدة - 4 على ويب/تابلت، 3 على هاتف
  const numColumns = width > 700 ? 4 : 3;
  const cardWidth = `${100 / numColumns}%` as `${number}%`;

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return DHIKR_CATEGORIES;
    return DHIKR_CATEGORIES.filter((c) => c.titleAr.includes(q));
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader
          onBack={goBack}
          title="حصن المسلم"
          subtitle="من أذكار الكتاب والسنّة"
        />

        {/* بطاقة هيرو - ورد الأذكار اليومي */}
        <View style={[styles.hero, { backgroundColor: t.colors.primary + '12', borderColor: t.colors.primary + '30' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: t.colors.textPrimary }]}>ورد الأذكار اليومي</Text>
            <Text style={[styles.heroSub, { color: t.colors.textSecondary }]}>
              تحصّن بكلمات الله وذكر رسوله ﷺ
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: t.colors.primary }]}>
            <Sparkles size={22} color={t.colors.background} strokeWidth={2} />
          </View>
        </View>

        {/* شريط البحث */}
        <View style={[styles.searchBar, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}>
          <Search size={18} color={t.colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث في تصنيفات الأذكار..."
            placeholderTextColor={t.colors.textTertiary}
            style={[styles.searchInput, { color: t.colors.textPrimary }]}
          />
        </View>

        {/* شبكة الفئات */}
        <View style={styles.grid}>
          {filtered.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? BookOpen;
            const count = getAdhkarCountForCategory(cat.id);
            if (count === 0) return null;
            return (
              <View key={cat.id} style={[styles.cardWrap, { width: cardWidth }]}>
                <Pressable
                  onPress={() => router.push(`/adhkar/${cat.id}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.titleAr}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.borderGold,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  {/* الأيقونة الدائرية الذهبية */}
                  <View style={[styles.iconCircle, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40' }]}>
                    <Icon size={26} color={t.colors.accent} strokeWidth={1.6} />
                  </View>

                  <Text
                    style={[styles.cardTitle, { color: t.colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {cat.titleAr}
                  </Text>

                  <View style={[styles.countPill, { backgroundColor: t.colors.accent + '12' }]}>
                    <Text style={[styles.cardCount, { color: t.colors.accentDeep }]}>
                      {arabicNumber(count)} ذكر
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* تذييل تحفيزي */}
        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: t.colors.accent }]} />
          <Text style={[styles.footerText, { color: t.colors.accent }]}>
            ◇  ذكرك لله طُمأنينة قلبك  ◇
          </Text>
          <View style={[styles.footerDot, { backgroundColor: t.colors.accent }]} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  heroSub:   { fontSize: 12, marginTop: 4 },
  heroIcon:  {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {}),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cardWrap: {
    padding: 5,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 6,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  footerDot: {
    width: 5, height: 5,
    transform: [{ rotate: '45deg' }],
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
});
