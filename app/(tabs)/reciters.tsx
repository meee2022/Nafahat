/**
 * شاشة الاستماع - تصميم محدّث:
 *  - "Now Playing" banner لو فيه قارئ شغّال
 *  - بحث pill بأيقونة ذهبية
 *  - carousel أفقي بألوان مميّزة حسب نمط التلاوة
 *  - filter pills بأيقونات (الكل / مرتل / مجود / معلم)
 *  - قائمة قرّاء بـ ReciterAvatar + زر تشغيل عائم
 *  - مؤشر "يُشغّل الآن" أخضر نابض على القارئ الحالي
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Search, Play, Pause, Star, Globe, Headphones, MapPin, SkipForward } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader } from '@components/ui';
import { RECITERS } from '@data/reciters';
import { useT } from '@store/languageStore';
import { useAudioStore, useSettingsStore } from '@store/index';
import { Clock } from 'lucide-react-native';
import { ReciterAvatar } from '@components/reciter/ReciterAvatar';

type StyleFilter = 'all' | 'مرتل' | 'مجود' | 'معلم';

const STYLE_FILTERS: { id: StyleFilter; labelKey: string; emoji: string; color: string }[] = [
  { id: 'all',  labelKey: 'audio.styleAll',      emoji: '✦', color: '#D4B570' },
  { id: 'مرتل', labelKey: 'audio.styleMurattal', emoji: '◇', color: '#0F4A41' },
  { id: 'مجود', labelKey: 'audio.styleMujawwad', emoji: '◆', color: '#1A5C4F' },
  { id: 'معلم', labelKey: 'audio.styleMuallim',  emoji: '★', color: '#B8923B' },
];

// لون مميّز لكل نمط تلاوة - زمرد وذهب فقط
const STYLE_COLORS: Record<string, string> = {
  'مرتل': '#0F4A41', // زمرد عميق
  'مجود': '#1A5C4F', // زمرد متوسط
  'معلم': '#B8923B', // ذهبي داكن
};

export default function RecitersScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { current, isPlaying, toggle } = useAudioStore();
  const [query, setQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');

  const currentReciter = current ? RECITERS.find((r) => r.id === current.reciter.id) : null;

  const list = useMemo(() => {
    return RECITERS.filter((r) => {
      if (styleFilter !== 'all' && r.style !== styleFilter) return false;
      if (!query.trim()) return true;
      return r.nameAr.includes(query) || r.nameEn.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, styleFilter]);

  const popular = useMemo(() => RECITERS.filter((r) => r.popular).slice(0, 6), []);
  const currentReciterId = current?.reciter.id;
  // 🆕 آخر القرّاء اللي استمع لهم المستخدم
  const recentIds = useSettingsStore((s) => s.recentReciterIds);
  const recent = useMemo(() => {
    return recentIds
      .map((id) => RECITERS.find((r) => r.id === id))
      .filter((r): r is typeof RECITERS[number] => !!r);
  }, [recentIds]);

  return (
    <Screen>
      <AppHeader title={tr('audio.title')} subtitle={tr('audio.subtitle')} />

      {/* 🎧 Now Playing Banner - يظهر فقط لو فيه قارئ شغّال */}
      {currentReciter ? (
        <View>
          <LinearGradient
            colors={[STYLE_COLORS[currentReciter.style] ?? '#0A3D38', '#062825']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.nowPlayingBanner}
          >
            {/* نقش ذهبي خفيف */}
            <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} pointerEvents="none">
              <Defs>
                <Pattern id="np-bg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <Path
                    d="M16,3 L19,13 L29,16 L19,19 L16,29 L13,19 L3,16 L13,13 Z"
                    fill="none" stroke="#D4B570" strokeWidth={0.5}
                  />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#np-bg)" />
            </Svg>

            <View style={styles.nowPlayingContent}>
              {/* المنطقة اليسرى (avatar + معلومات) Pressable لفتح المشغّل */}
              <Pressable
                onPress={() => router.push('/player')}
                accessibilityRole="button"
                accessibilityLabel="فتح المشغّل الكامل"
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <ReciterAvatar letter={currentReciter.nameAr.charAt(0)} size={56} isPlaying={isPlaying} />
                <View style={{ flex: 1, marginStart: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.nowPlayingDot, { backgroundColor: isPlaying ? '#22C55E' : '#D4B570' }]} />
                    <Text style={styles.nowPlayingLabel}>
                      {isPlaying ? 'يُشغّل الآن' : 'متوقف مؤقتاً'}
                    </Text>
                  </View>
                  <Text style={styles.nowPlayingName} numberOfLines={1}>
                    {currentReciter.nameAr}
                  </Text>
                  <Text style={styles.nowPlayingMeta} numberOfLines={1}>
                    {current?.surahName ?? ''} {current?.surahName && currentReciter.countryAr ? '·' : ''} {currentReciter.countryAr}
                  </Text>
                </View>
              </Pressable>

              {/* زر تشغيل/إيقاف - شقيق منفصل */}
              <Pressable
                onPress={toggle}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'إيقاف' : 'تشغيل'}
                style={({ pressed }) => [
                  styles.nowPlayingPlayBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                hitSlop={10}
              >
                {isPlaying ? (
                  <Pause size={18} color="#0A3D38" fill="#0A3D38" />
                ) : (
                  <Play size={18} color="#0A3D38" fill="#0A3D38" style={{ marginStart: 2 }} />
                )}
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      ) : null}

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
          const styleColor = STYLE_COLORS[r.style] ?? t.colors.primary;
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
                accentColor={styleColor}
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
              <View style={[styles.stylePill, { backgroundColor: styleColor + '15', borderColor: styleColor + '30' }]}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: styleColor, letterSpacing: 0.5 }}>
                  {r.style}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 🆕 آخر القرّاء اللي استمعت لهم - يظهر فقط لو فيه history */}
      {recent.length > 0 ? (
        <>
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color={t.colors.accent} />
              <Text style={[styles.eyebrow, { color: t.colors.accent }]}>آخر استماعك</Text>
            </View>
            <Text variant="h3" style={{ marginTop: 6 }}>قرّاء مؤخّراً</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
            {recent.map((r) => {
              const styleColor = STYLE_COLORS[r.style] ?? t.colors.primary;
              const isCurrent = currentReciterId === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/reciter/${r.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={r.nameAr}
                  style={({ pressed }) => [
                    styles.popularCard,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <ReciterAvatar
                    letter={r.nameAr.charAt(0)}
                    size={72}
                    isPlaying={isCurrent && isPlaying}
                    accentColor={styleColor}
                  />
                  <Text
                    style={{ fontSize: 11, fontWeight: '700', color: t.colors.textPrimary, textAlign: 'center', marginTop: 8, maxWidth: 80 }}
                    numberOfLines={2}
                  >
                    {r.nameAr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

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
  const styleColor = STYLE_COLORS[reciter.style] ?? t.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.listCard,
        {
          backgroundColor: t.colors.surface,
          borderColor: isPlaying ? t.colors.success + '60' : (hovered ? styleColor + '40' : t.colors.border),
          transform: [
            { scale: pressed ? 0.985 : 1 },
            { translateX: hovered && Platform.OS === 'web' ? -3 : 0 },
          ],
          shadowColor: isPlaying ? t.colors.success : (hovered ? styleColor : t.colors.shadowColor),
          shadowOffset: { width: 0, height: hovered || isPlaying ? 6 : 1 },
          shadowOpacity: isPlaying ? 0.18 : (hovered ? 0.12 : 0.04),
          shadowRadius: isPlaying ? 14 : (hovered ? 12 : 4),
          elevation: hovered || isPlaying ? 4 : 1,
        },
      ]}
    >
      {/* شريط جانبي مميز بلون النمط */}
      <View style={[styles.styleSideBar, { backgroundColor: styleColor }]} />

      {/* أفاتار */}
      <ReciterAvatar
        letter={reciter.nameAr.charAt(0)}
        size={54}
        isPlaying={isPlaying}
        accentColor={styleColor}
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
            <MapPin size={10} color={t.colors.textTertiary} />
            <Text variant="caption" color={t.colors.textTertiary}>{reciter.countryAr}</Text>
          </View>
          <Text variant="caption" color={t.colors.textTertiary}>·</Text>
          <View style={[styles.styleBadge, { backgroundColor: styleColor + '14', borderColor: styleColor + '30' }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: styleColor, letterSpacing: 0.3 }}>
              {reciter.style}
            </Text>
          </View>
        </View>
      </View>

      {/* زر تشغيل بلون النمط */}
      <View style={[
        styles.playBtn,
        {
          backgroundColor: isPlaying ? t.colors.success : styleColor,
          shadowColor: isPlaying ? t.colors.success : styleColor,
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
  // Now Playing Banner
  nowPlayingBanner: {
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.35)',
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 4,
  },
  nowPlayingDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  nowPlayingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4B570',
    letterSpacing: 1.5,
  },
  nowPlayingName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBF7EA',
    marginTop: 4,
  },
  nowPlayingMeta: {
    fontSize: 11,
    color: 'rgba(251, 247, 234, 0.7)',
    marginTop: 2,
  },
  nowPlayingPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4B570',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // شريط جانبي بلون النمط في كل قارئ
  styleSideBar: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  styleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },

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
