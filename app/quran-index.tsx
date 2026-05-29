/**
 * شاشة المصحف - فهرس بثلاثة تبويبات: السور، الأجزاء، الأحزاب.
 * تصميم مخطوطي - بطاقات بنقش هندسي + رصائع ذهبية للأرقام.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Search } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, AppHeader } from '@components/ui';
import { SurahListItem } from '@components/common';
import { useResponsive } from '@hooks/useResponsive';
import { OrnamentalRule } from '@components/ornaments';
import { SURAHS, JUZ_LIST, HIZB_LIST, arabicNumber, JUZ_PAGE_STARTS, getSurahForPage } from '@data/surahs';
import { useT } from '@store/languageStore';

type Tab = 'surah' | 'juz' | 'hizb';

export default function MushafScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('surah');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'meccan' | 'medinan'>('all');

  const filteredSurahs = useMemo(() => {
    return SURAHS.filter((s) => {
      if (filter !== 'all' && s.revelationType !== filter) return false;
      if (!query.trim()) return true;
      return s.nameAr.includes(query.trim()) || s.nameEn.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [query, filter]);

  return (
    <Screen scrollable={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          title={tr('mushaf.title')}
          subtitle={tr('mushaf.subtitle')}
          onBack={() => {
            // رجوع لتبويب المصحف لو فيه history، وإلا فتحه مباشرة
            if (router.canGoBack?.()) router.back();
            else router.replace('/');
          }}
        />

        {/* شريط بحث ناعم — حدّ رفيع بدون أيقونة بارزة */}
        <View style={[styles.search, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Search size={16} color={t.colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            placeholder={tr('mushaf.searchPh')}
            placeholderTextColor={t.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 14, fontWeight: '500' }}
          />
        </View>

        {/* تبويبات pill ممتلئ — segmented control واضح */}
        <View style={[styles.tabsContainer, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}>
          {(['surah', 'juz', 'hizb'] as Tab[]).map((id) => {
            const active = tab === id;
            const label = id === 'surah' ? tr('mushaf.tabSurahs') : id === 'juz' ? tr('mushaf.tabJuz') : tr('mushaf.tabHizb');
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={({ pressed }) => [
                  styles.tab,
                  active && {
                    backgroundColor: t.colors.primary,
                    shadowColor: t.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.28,
                    shadowRadius: 10,
                    elevation: 4,
                  },
                  pressed && !active && { opacity: 0.65 },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    letterSpacing: 0.5,
                    fontWeight: active ? '800' : '600',
                    color: active ? t.colors.onPrimary : t.colors.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* فلتر السور — شارات ممتلئة عند النشاط */}
        {tab === 'surah' ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <FilterPill label={tr('mushaf.filterAll')}     active={filter === 'all'}     onPress={() => setFilter('all')}     tint={t.colors.accent} />
            <FilterPill label={tr('mushaf.filterMeccan')}  active={filter === 'meccan'}  onPress={() => setFilter('meccan')}  tint={t.colors.featureSaffron} />
            <FilterPill label={tr('mushaf.filterMedinan')} active={filter === 'medinan'} onPress={() => setFilter('medinan')} tint={t.colors.primary} />
          </View>
        ) : null}
      </View>

      {/*
        القائمة - نستخدم 3 مكوّنات مستقلة لتجنّب أن يعيد React Native Web استخدام
        نفس instance من FlatList (والذي يسبب خطأ "Changing numColumns on the fly").
        كل لائحة تُركَّب وتُفكَّك بالكامل عند تبديل التبويب.
      */}
      <View style={{ flex: 1, marginTop: 14 }}>
        {tab === 'surah' && (
          <SurahFlatList
            data={filteredSurahs}
            onItemPress={(id) => router.push(`/surah/${id}`)}
            dividerColor={t.colors.divider}
            emptyTextColor={t.colors.textTertiary}
          />
        )}
        {tab === 'juz' && (
          <JuzFlatList
            onItemPress={(juzId) => {
              const targetPage = JUZ_PAGE_STARTS[juzId - 1] || 1;
              const surah = getSurahForPage(targetPage);
              router.push(`/surah/${surah.id}?page=${targetPage}`);
            }}
          />
        )}
        {tab === 'hizb' && (
          <HizbFlatList
            onItemPress={(hizbId) => {
              const firstSurah = SURAHS.find((s) => s.hizbStart === hizbId);
              if (firstSurah) router.push(`/surah/${firstSurah.id}`);
            }}
          />
        )}
      </View>
    </Screen>
  );
}

// ----- مكوّنات قائمة مستقلة (تتجنّب خطأ تغيير numColumns في React Native Web) -----

const SurahFlatList: React.FC<{
  data: typeof SURAHS;
  onItemPress: (id: number) => void;
  dividerColor: string;
  emptyTextColor: string;
}> = ({ data, onItemPress, emptyTextColor }) => {
  const r = useResponsive();
  return (
  <FlatList
    data={data}
    keyExtractor={(item) => String(item.id)}
    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4, maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }}
    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    removeClippedSubviews={Platform.OS !== 'web'}
    initialNumToRender={12}
    maxToRenderPerBatch={10}
    windowSize={5}
    renderItem={({ item }) => <SurahListItem surah={item} onPress={() => onItemPress(item.id)} />}
    ListEmptyComponent={
      <View style={{ paddingTop: 60, alignItems: 'center' }}>
        <Text color={emptyTextColor}>لا توجد نتائج</Text>
      </View>
    }
  />
  );
};

const JuzFlatList: React.FC<{ onItemPress: (juzId: number) => void }> = ({ onItemPress }) => {
  const r = useResponsive();
  const cols = r.gridColumns(2);
  return (
    <FlatList
      // المفتاح يتغيّر مع عدد الأعمدة لإجبار FlatList على إعادة البناء عند الدوران.
      key={`juz-${cols}`}
      data={JUZ_LIST}
      numColumns={cols}
      keyExtractor={(j) => String(j.id)}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }}
      columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
      renderItem={({ item }) => (
        <JuzHizbCard
          number={item.id}
          title={item.nameAr}
          kind="juz"
          onPress={() => onItemPress(item.id)}
        />
      )}
    />
  );
};

const HizbFlatList: React.FC<{ onItemPress: (hizbId: number) => void }> = ({ onItemPress }) => {
  const r = useResponsive();
  const cols = r.gridColumns(3);
  return (
    <FlatList
      key={`hizb-${cols}`}
      data={HIZB_LIST}
      numColumns={cols}
      keyExtractor={(h) => String(h.id)}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }}
      columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
      renderItem={({ item }) => (
        <JuzHizbCard
          number={item.id}
          title={item.nameAr}
          kind="hizb"
          onPress={() => onItemPress(item.id)}
        />
      )}
    />
  );
};

/**
 * بطاقة جزء/حزب مع رصيعة ذهبية بداخلها الرقم.
 */
const JuzHizbCard: React.FC<{ number: number; title: string; kind: 'juz' | 'hizb'; onPress: () => void }> = ({
  number, title, kind, onPress,
}) => {
  const t = useTheme();
  const isJuz = kind === 'juz';
  const [hovered, setHovered] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: hovered ? t.colors.accent + '10' : t.colors.surface,
          borderWidth: 1.5,
          borderColor: hovered ? t.colors.primaryDark : 'rgba(212, 181, 112, 0.4)',
          borderRadius: 16,
          paddingVertical: isJuz ? 28 : 20,
          alignItems: 'center',
          opacity: pressed ? 0.92 : 1,
          transform: [
            { scale: pressed ? 0.97 : (hovered && Platform.OS === 'web' ? 1.02 : 1) },
            { translateY: hovered && !pressed && Platform.OS === 'web' ? -2 : 0 },
          ],
          shadowColor: hovered ? t.colors.accent : t.colors.shadowColor,
          shadowOffset: { width: 0, height: hovered ? 8 : 2 },
          shadowOpacity: hovered ? 0.15 : 0.05,
          shadowRadius: hovered ? 16 : 8,
          elevation: hovered ? 4 : 1,
        },
      ]}
    >
      {/* رصيعة ذهبية وزمردية محيطة بالرقم */}
      <View style={{ width: isJuz ? 68 : 54, height: isJuz ? 68 : 54, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={isJuz ? 68 : 54} height={isJuz ? 68 : 54} viewBox="0 0 64 64" style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id={`jh-grad-${kind}-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={t.colors.accent} stopOpacity={hovered ? "0.3" : "0.15"} />
              <Stop offset="100%" stopColor={t.colors.accent} stopOpacity="0.05" />
            </SvgGradient>
          </Defs>
          {/* نجمة 8 بتلات */}
          <Path
            d="M32,4 L36,20 L52,12 L44,28 L60,32 L44,36 L52,52 L36,44 L32,60 L28,44 L12,52 L20,36 L4,32 L20,28 L12,12 L28,20 Z"
            fill={`url(#jh-grad-${kind}-${number})`}
            stroke={t.colors.primaryDark}
            strokeWidth={1}
            strokeOpacity={0.8}
          />
          {/* دائرة مركزية مزدوجة */}
          <Circle cx="32" cy="32" r="20" fill={t.colors.surface} stroke={t.colors.primaryDark} strokeWidth="1.2" strokeOpacity="0.8" />
          <Circle cx="32" cy="32" r="16" fill="none" stroke={t.colors.primaryDark} strokeWidth="0.5" opacity="0.6" />
          {/* نقطة مركزية صغيرة */}
          <Circle cx="32" cy="32" r="1.5" fill={t.colors.primaryDark} opacity="0.5" />
        </Svg>
        <Text
          style={{
            fontSize: isJuz ? 24 : 18,
            fontWeight: '800',
            color: t.colors.primaryDark,
            letterSpacing: -0.5,
          }}
        >
          {arabicNumber(number)}
        </Text>
      </View>

      {isJuz ? (
        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <OrnamentalRule width={60} color={t.colors.accent} variant="simple" />
          <Text style={{
            marginTop: 8,
            fontSize: 20,
            color: t.colors.primaryDark,
            fontFamily: t.fontFamilies.arabicQuran,
          }}>
            {title}
          </Text>
        </View>
      ) : (
        <Text style={{
          marginTop: 10,
          fontSize: 14,
          fontWeight: '700',
          color: t.colors.textSecondary,
          letterSpacing: 0.5,
        }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

/** شارة فلتر — ممتلئة عند النشاط بلون مميّز، أنيقة في الراحة. */
const FilterPill: React.FC<{ label: string; active: boolean; onPress: () => void; tint: string }> = ({
  label, active, onPress, tint,
}) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: active ? tint : t.colors.border,
          backgroundColor: active ? tint : t.colors.surface,
          shadowColor: active ? tint : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: active ? 0.25 : 0,
          shadowRadius: 10,
          elevation: active ? 3 : 0,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: active ? '#FFFFFF' : tint,
      }} />
      <Text style={{
        fontSize: 13,
        fontWeight: '800',
        color: active ? '#FFFFFF' : t.colors.textSecondary,
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1, paddingVertical: 11,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 999,
  },
});
