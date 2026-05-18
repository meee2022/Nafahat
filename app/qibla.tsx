/**
 * 🧭 شاشة القبلة — بوصلة دولية باتجاه القبلة.
 *
 * - الحساب: great-circle bearing من موقع المستخدم إلى الكعبة (يشتغل لأي مكان في العالم).
 * - الموقع: يقرأ من settingsStore.location الموحّد. لتغيير المدينة:
 *     1. زر "تغيير" في بطاقة المدينة → يفتح شاشة /location (60+ مدينة)
 *     2. أو زر اختيار سريع (Globe) من 30 مدينة الـ preset (في qibla service)
 *
 * - عرض المسافة + الجهة + الدرجة، مع رسالة خاصة لو المستخدم في مكة.
 *
 * Identity: أخضر + ذهبي. السهم ذهبي، البوصلة بحدود ذهبية، الكعبة في رأس السهم.
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Dimensions, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, G, Line, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ArrowRight, MapPin, Navigation, Search, X, Globe, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useT } from '@store/languageStore';
import { useSettingsStore } from '@store/index';
import {
  calculateQiblaBearing, distanceToKaaba, describeBearingAr,
  PRESET_CITIES, City,
} from '@services/qibla';

const SIZE = Math.min(Dimensions.get('window').width - 64, 320);

export default function QiblaScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  // 🌍 الموقع الموحّد من settingsStore — يتغيّر من شاشة /location ويتزامن مع
  //   مواقيت الصلاة والأذان. نوفّر picker سريع داخلي كـ shortcut.
  const userLocation = useSettingsStore((s) => s.location);
  const setUserLocation = useSettingsStore((s) => s.setLocation);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  // 🧮 الحسابات تشتغل لأي مكان في العالم (great-circle bearing)
  const bearing = useMemo(
    () => calculateQiblaBearing(userLocation.latitude, userLocation.longitude),
    [userLocation],
  );
  const distance = useMemo(
    () => distanceToKaaba(userLocation.latitude, userLocation.longitude),
    [userLocation],
  );
  const direction = useMemo(() => describeBearingAr(bearing), [bearing]);

  const filteredCities = useMemo(() => {
    if (!query.trim()) return PRESET_CITIES;
    const q = query.trim().toLowerCase();
    return PRESET_CITIES.filter((c) =>
      c.nameAr.includes(query) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.countryAr.includes(query),
    );
  }, [query]);

  // إذا كان المستخدم في مكة (ضمن ~5 كم) نعرض رسالة خاصة
  const isInMakkah = distance < 5;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={t.hitSlop}
          accessible
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('qibla.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('qibla.title')}</Text>
        </View>
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={t.hitSlop}
          accessible
          accessibilityRole="button"
          accessibilityLabel="اختر المدينة"
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <Globe size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
      </View>

      <Screen scrollable={false} contentStyle={{ paddingHorizontal: 16 }}>
        {/* بطاقة المدينة الحالية — مع زرَّين:
            "تغيير سريع" يفتح modal صغير بـ 30 مدينة preset (qibla service)
            "كل المدن" يفتح شاشة /location الكاملة بـ 60+ مدينة */}
        <View style={[styles.cityCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
          <View style={[styles.cityIcon, { backgroundColor: t.colors.accent + '14' }]}>
            <MapPin size={18} color={t.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={t.colors.textSecondary} style={{ letterSpacing: 1, fontWeight: '700' }}>
              موقعك
            </Text>
            <Text variant="subtitle" style={{ marginTop: 2 }}>
              {userLocation.cityAr}
            </Text>
            <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
              {userLocation.cityEn} · UTC{userLocation.timezone >= 0 ? '+' : ''}{userLocation.timezone}
            </Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="تغيير سريع"
              style={({ pressed }) => [
                styles.quickBtn,
                { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text variant="caption" color={t.colors.accent} style={{ fontWeight: '700' }}>سريع</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/location')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="كل المدن من شاشة الموقع"
              style={({ pressed }) => [
                styles.quickBtn,
                { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text variant="caption" color="#FFF" style={{ fontWeight: '700' }}>كل المدن</Text>
            </Pressable>
          </View>
        </View>

        {/* البوصلة */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="qiblaBg" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={t.colors.surface} />
                <Stop offset="100%" stopColor={t.colors.surfaceAlt} />
              </RadialGradient>
            </Defs>

            <Circle cx="50" cy="50" r="48" fill="url(#qiblaBg)" stroke={t.colors.accent} strokeWidth="0.8" />
            <Circle cx="50" cy="50" r="44" fill="none" stroke={t.colors.accent} strokeWidth="0.3" opacity="0.5" />

            {/* علامات الدرجات */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 36;
              const isMain = i % 9 === 0;
              const r1 = isMain ? 38 : 41;
              const x1 = 50 + r1 * Math.cos(angle - Math.PI / 2);
              const y1 = 50 + r1 * Math.sin(angle - Math.PI / 2);
              const x2 = 50 + 44 * Math.cos(angle - Math.PI / 2);
              const y2 = 50 + 44 * Math.sin(angle - Math.PI / 2);
              return (
                <Line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={t.colors.textPrimary}
                  strokeWidth={isMain ? 0.8 : 0.25}
                  opacity={isMain ? 1 : 0.5}
                />
              );
            })}

            {/* السهم الشمالي */}
            <Path d="M50 14 L48 22 L52 22 Z" fill={t.colors.error} />
            <Circle cx="50" cy="50" r="3" fill={t.colors.textPrimary} />

            {/* نقش هندسي داخلي */}
            <Circle cx="50" cy="50" r="30" fill="none" stroke={t.colors.accent} strokeWidth="0.3" opacity="0.4" />

            {/* سهم القبلة (يدور حسب الزاوية المحسوبة) */}
            <G transform={`rotate(${bearing}, 50, 50)`}>
              <Path
                d="M 50 16 L 57 38 L 50 33 L 43 38 Z"
                fill={t.colors.accent}
                stroke={t.colors.accentDeep}
                strokeWidth="0.5"
              />
              {/* الكعبة في رأس السهم */}
              <G transform="translate(50, 12)">
                <Rect x="-5" y="-5" width="10" height="10" fill="#1A1815" rx="0.5" />
                <Path d="M-4,-2 L4,-2" stroke={t.colors.accent} strokeWidth="0.6" />
                <Path d="M-3,1 L3,1" stroke={t.colors.accent} strokeWidth="0.4" opacity="0.7" />
              </G>
            </G>

            {/* درجة في الوسط */}
            <Circle cx="50" cy="50" r="14" fill={t.colors.surface} stroke={t.colors.accent} strokeWidth="0.3" />
          </Svg>

          {/* درجة الزاوية في الوسط */}
          <View style={[styles.centerLabel, { width: SIZE, height: SIZE }]} pointerEvents="none">
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: t.colors.accent, letterSpacing: -0.5, fontFamily: t.fontFamilies.arabicQuran }}>
                {Math.round(bearing)}°
              </Text>
              <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>{direction}</Text>
            </View>
          </View>

          {/* أحرف الجهات */}
          <View pointerEvents="none" style={[styles.compassOverlay, { width: SIZE, height: SIZE }]}>
            <View style={[styles.compassLabel, styles.labelN]}>
              <Text style={[styles.directionText, { color: t.colors.error }]}>ش</Text>
            </View>
            <View style={[styles.compassLabel, styles.labelE]}>
              <Text style={[styles.directionText, { color: t.colors.textSecondary }]}>ش‍ ر</Text>
            </View>
            <View style={[styles.compassLabel, styles.labelS]}>
              <Text style={[styles.directionText, { color: t.colors.textSecondary }]}>ج</Text>
            </View>
            <View style={[styles.compassLabel, styles.labelW]}>
              <Text style={[styles.directionText, { color: t.colors.textSecondary }]}>غ</Text>
            </View>
          </View>
        </View>

        {/* بطاقة المعلومات */}
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: 18 }} bordered>
          {isInMakkah ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 36 }}>🕋</Text>
              <Text variant="subtitle" style={{ marginTop: 8, textAlign: 'center' }}>
                أنت في مكة المكرّمة
              </Text>
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }}>
                البيت الحرام أمامك مباشرة - بارك الله لك في عبادتك
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={t.colors.textSecondary} style={{ letterSpacing: 1, fontWeight: '700' }}>
                    اتجاه القبلة
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: t.colors.textPrimary, marginTop: 4 }}>
                    {direction}
                  </Text>
                  <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                    {Math.round(bearing)}° من الشمال الجغرافي
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', borderStartWidth: 1, borderStartColor: t.colors.divider, paddingStart: 14 }}>
                  <Text variant="caption" color={t.colors.textSecondary} style={{ letterSpacing: 1, fontWeight: '700' }}>
                    المسافة
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: t.colors.textPrimary, marginTop: 4 }}>
                    {distance.toLocaleString('ar-EG')}
                  </Text>
                  <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>كيلومتر</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
        </View>

        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: 16 }} bordered>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Navigation size={16} color={t.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="subtitle">كيف أستخدم البوصلة</Text>
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 6, lineHeight: 22 }}>
                وجّه الجزء العلوي من جهازك ناحية الشمال الجغرافي، ثم اتّبع السهم الذهبي - الكعبة المشرّفة تقع في اتجاهه.
              </Text>
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 8, lineHeight: 18 }}>
                💡 لتجربة تلقائية بالـ GPS واستشعار المغناطيس، فعّل إذن الموقع من إعدادات النظام.
              </Text>
            </View>
          </View>
        </Card>
      </Screen>

      {/* Modal لاختيار المدينة */}
      <Modal visible={pickerOpen} animationType="slide" transparent={false} onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: t.colors.background }}>
          <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold, marginTop: 0 }]}>
            <Pressable
              onPress={() => { setPickerOpen(false); setQuery(''); }}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              style={[styles.iconBtn, { borderColor: t.colors.border }]}
            >
              <X size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اختر</Text>
              <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>مدينتك</Text>
            </View>
            <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={[styles.search, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
              <Search size={16} color={t.colors.accent} />
              <TextInput
                placeholder="ابحث عن مدينة..."
                placeholderTextColor={t.colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15, fontWeight: '500' }}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
            {filteredCities.map((c) => {
              const isActive =
                Math.abs(userLocation.latitude - c.latitude) < 0.01 &&
                Math.abs(userLocation.longitude - c.longitude) < 0.01;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    // 🌍 يحدّث الموقع الموحّد — يؤثر على كل التطبيق (الصلاة + الأذان)
                    setUserLocation({
                      cityAr: c.nameAr,
                      cityEn: c.nameEn,
                      latitude: c.latitude,
                      longitude: c.longitude,
                      // PRESET_CITIES بدون timezone — نخلّيه يحافظ على القديم
                      timezone: userLocation.timezone,
                    });
                    setPickerOpen(false);
                    setQuery('');
                  }}
                  style={({ pressed }) => [
                    styles.cityRow,
                    {
                      borderColor: isActive ? t.colors.accent : t.colors.border,
                      backgroundColor: isActive ? t.colors.accent + '08' : (pressed ? t.colors.surfaceAlt : 'transparent'),
                    },
                  ]}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`${c.nameAr}، ${c.countryAr}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="subtitle">{c.nameAr}</Text>
                    <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                      {c.countryAr} · {c.nameEn}
                    </Text>
                  </View>
                  {isActive ? (
                    <View style={[styles.checkPill, { backgroundColor: t.colors.accent }]}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            {filteredCities.length === 0 ? (
              <Text style={{ textAlign: 'center', color: t.colors.textTertiary, marginTop: 40 }}>
                لا توجد نتائج لـ "{query}"
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// نستورد TextInput بأمان
import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  cityIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  centerLabel: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center' },
  compassOverlay: { position: 'absolute', top: 0 },
  compassLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  labelN: { top: 4, left: 0, right: 0 },
  labelS: { bottom: 4, left: 0, right: 0 },
  labelE: { left: 4, top: 0, bottom: 0, alignItems: 'flex-start', justifyContent: 'center' },
  labelW: { right: 4, top: 0, bottom: 0, alignItems: 'flex-end', justifyContent: 'center' },
  directionText: { fontSize: 12, fontWeight: '800' },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 46,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkPill: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});
