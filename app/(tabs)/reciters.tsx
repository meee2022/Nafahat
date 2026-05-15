/**
 * شاشة الاستماع - تصميم محدّث:
 *  - بحث pill بأيقونة ذهبية
 *  - carousel أفقي للقرّاء المميّزين بأفاتارات مزخرفة
 *  - filter pills بأيقونات (الكل / مرتل / مجود / معلم)
 *  - قائمة قرّاء بـ ReciterAvatar + زر تشغيل عائم
 *  - مؤشر "يُشغّل الآن" أخضر نابض على القارئ الحالي
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Play, Pause, Star, Globe, Headphones } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader } from '@components/ui';
import { RECITERS } from '@data/reciters';
import { useT } from '@store/languageStore';
import { useAudioStore } from '@store/index';
import { ReciterAvatar } from '@components/reciter/ReciterAvatar';

type StyleFilter = 'all' | 'مرتل' | 'مجود' | 'معلم';

const STYLE_FILTERS: { id: StyleFilter; labelKey: string; emoji: string; color: string }[] = [
  { id: 'all',  labelKey: 'audio.styleAll',      emoji: '✦', color: '#B8923B' },
  { id: 'مرتل', labelKey: 'audio.styleMurattal', emoji: '◇', color: '#0F4A41' },
  { id: 'مجود', labelKey: 'audio.styleMujawwad', emoji: '◆', color: '#A2384B' },
  { id: 'معلم', labelKey: 'audio.styleMuallim',  emoji: '★', color: '#2F5A8C' },
];

export default function RecitersScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { current, isPlaying } = useAudioStore();
  const [query, setQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');

  const list = useMemo(() => {
    return RECITERS.filter((r) => {
      if (styleFilter !== 'all' && r.style !== styleFilter) return false;
      if (!query.trim()) return true;
      return r.nameAr.includes(query) || r.nameEn.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, styleFilter]);

  const popular = useMemo(() => RECITERS.filter((r) => r.popular).slice(0, 6), []);
  const currentReciterId = current?.reciter.id;

  return (
    <Screen>
      <AppHeader title={tr('audio.title')} subtitle={tr('audio.subtitle')} />

      {/* بحث pill بأيقونة ذهبية مدوّرة */}
      <View style={[styles.search, { backgroundColor: t.colors.surface, borderColor: t.colors.border, ...t.shadows.xs, shadowColor: t.colors.shadowColor }]}>
        <View style={[styles.searchIconWrap, { backgroundColor: t.colors.accent + '14' }]}>
          <Search size={16} color={t.colors.accent} strokeWidth={2} />
        </View>
        <TextInput
          placeholder={tr('audio.searchPh')}
          placeholderTextColor={t.colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15, fontWeight: '500' }}
        />
      </View>

      {/* القراء المميزون - أفقي بأفاتارات فاخرة */}
      <View style={styles.sectionHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.diamond, { backgroundColor: t.colors.accent }]} />
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الأكثر استماعاً</Text>
          <View style={[styles.diamond, { backgroundColor: t.colors.accent }]} />
        </View>
        <Text variant="h3" style={{ marginTop: 6 }}>{tr('audio.popular')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularRow}
      >
        {popular.map((r) => {
          const isCurrent = currentReciterId === r.id;
          const isReciterPlaying = isCurrent && isPlaying;
          return (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/reciter/${r.id}`)}
              style={({ pressed }) => [
                styles.popularCard,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <ReciterAvatar
                letter={r.nameAr.charAt(0)}
                size={88}
                isPlaying={isReciterPlaying}
                isPopular
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: t.colors.textPrimary,
                  textAlign: 'center',
                  marginTop: 10,
                  maxWidth: 96,
                }}
                numberOfLines={2}
              >
                {r.nameAr}
              </Text>
              <View style={[styles.stylePill, { backgroundColor: t.colors.accent + '14' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: t.colors.accentDeep, letterSpacing: 0.5 }}>
                  {r.style}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* فلاتر بأيقونات */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        {STYLE_FILTERS.map((f) => (
          <FilterPill
            key={f.id}
            label={tr(f.labelKey as any)}
            emoji={f.emoji}
            color={f.color}
            active={styleFilter === f.id}
            onPress={() => setStyleFilter(f.id)}
          />
        ))}
      </View>

      {/* القائمة الكاملة */}
      <View style={[styles.sectionHead, { marginTop: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h3">{tr('audio.allReciters')}</Text>
          <View style={[styles.countPill, { backgroundColor: t.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.textSecondary }}>
              {list.length}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {list.map((r) => {
          const isCurrent = currentReciterId === r.id;
          const isReciterPlaying = isCurrent && isPlaying;
          return (
            <ReciterListCard
              key={r.id}
              reciter={r}
              isPlaying={isReciterPlaying}
              onPress={() => router.push(`/reciter/${r.id}`)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

// ─────────────── شارة فلتر ───────────────
const FilterPill: React.FC<{
  label: string; emoji: string; color: string; active: boolean; onPress: () => void;
}> = ({ label, emoji, color, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: active ? color : t.colors.border,
          backgroundColor: active ? color : t.colors.surface,
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? color : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: active ? 0.22 : 0,
          shadowRadius: 8,
          elevation: active ? 3 : 0,
        },
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : color }}>
        {emoji}
      </Text>
      <Text style={{
        fontSize: 13, fontWeight: '700',
        color: active ? '#fff' : t.colors.textSecondary,
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─────────────── بطاقة قارئ في القائمة ───────────────
interface CardProps {
  reciter: typeof RECITERS[number];
  isPlaying: boolean;
  onPress: () => void;
}

const ReciterListCard: React.FC<CardProps> = ({ reciter, isPlaying, onPress }) => {
  const t = useTheme();
  const [hovered, setHovered] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.listCard,
        {
          backgroundColor: hovered ? t.colors.surface : t.colors.surface,
          borderColor: isPlaying ? t.colors.success + '60' : (hovered ? t.colors.accent + '40' : t.colors.border),
          transform: [
            { scale: pressed ? 0.985 : 1 },
            { translateX: hovered && Platform.OS === 'web' ? -3 : 0 },
          ],
          shadowColor: isPlaying ? t.colors.success : t.colors.shadowColor,
          shadowOffset: { width: 0, height: hovered || isPlaying ? 6 : 1 },
          shadowOpacity: isPlaying ? 0.18 : (hovered ? 0.10 : 0.04),
          shadowRadius: isPlaying ? 14 : (hovered ? 12 : 4),
          elevation: hovered || isPlaying ? 4 : 1,
        },
      ]}
    >
      {/* أفاتار */}
      <ReciterAvatar
        letter={reciter.nameAr.charAt(0)}
        size={54}
        isPlaying={isPlaying}
      />

      {/* النص */}
      <View style={{ flex: 1, marginStart: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="subtitle" style={{ fontFamily: t.fontFamilies.arabicQuran }}>
            {reciter.nameAr}
          </Text>
          {reciter.popular ? <Star size={12} color={t.colors.accent} fill={t.colors.accent} /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Globe size={10} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{reciter.countryAr}</Text>
          </View>
          <Text variant="caption" color={t.colors.textTertiary}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Headphones size={10} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{reciter.style}</Text>
          </View>
        </View>
      </View>

      {/* زر تشغيل */}
      <View style={[
        styles.playBtn,
        {
          backgroundColor: isPlaying ? t.colors.success : t.colors.primary,
          shadowColor: isPlaying ? t.colors.success : t.colors.primary,
        },
      ]}>
        {isPlaying ? (
          <Pause size={16} color="#fff" fill="#fff" />
        ) : (
          <Play size={16} color="#fff" fill="#fff" style={{ marginStart: 2 }} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHead: {
    marginTop: 22,
    marginBottom: 14,
  },
  diamond: {
    width: 5, height: 5,
    transform: [{ rotate: '45deg' }],
  },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },

  popularRow: {
    gap: 14,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  popularCard: {
    alignItems: 'center',
    width: 104,
  },
  stylePill: {
    marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
  },

  countPill: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999,
  },

  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  playBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
