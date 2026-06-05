/**
 * 🌍 شاشة اختيار الموقع — لتحديد دولة/مدينة المستخدم.
 *
 * الفائدة: يغيّر مواقيت الصلاة + الأذان + اتجاه القبلة + إعدادات المساجد
 * تلقائياً بناءً على المدينة المختارة.
 *
 * البنية:
 *  - بحث نصّي
 *  - بطاقة المدينة المختارة حالياً (إن وُجدت)
 *  - chips الدول الشعبية
 *  - قائمة كاملة بكل المدن (مجموعة حسب الدولة)
 *
 * Identity: أخضر primary + ذهبي accent (هوية Nafahat الرسمية).
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Search, Check, ChevronLeft, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '@theme/index';
import { Screen, AppHeader, Text } from '@components/ui';
import { useSettingsStore } from '@store/index';
import { CITIES, COUNTRIES, type City } from '@data/cities';

export default function LocationScreen() {
  const t = useTheme();
  const router = useRouter();
  const currentLocation = useSettingsStore((s) => s.location);
  const setLocation = useSettingsStore((s) => s.setLocation);

  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  // 📍 اكتشاف الموقع تلقائياً عبر GPS
  const handleDetect = async () => {
    if (detecting) return;
    try {
      setDetecting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('الإذن مرفوض', 'لاكتشاف مدينتك تلقائياً، فعّل إذن الموقع من الإعدادات.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      let cityAr = 'موقعي الحالي';
      let cityEn = 'My Location';
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        const name = geo[0]?.city || geo[0]?.region || geo[0]?.subregion;
        if (name) { cityAr = name; cityEn = name; }
      } catch {}
      // توقيت الجهاز الحالي بالساعات (مثلاً قطر = +3)
      const timezone = -new Date().getTimezoneOffset() / 60;
      setLocation({ cityAr, cityEn, latitude, longitude, timezone });
      router.back();
    } catch {
      Alert.alert('تعذّر تحديد الموقع', 'تأكّد من تفعيل خدمة الموقع (GPS)، أو اختر مدينتك يدوياً.');
    } finally {
      setDetecting(false);
    }
  };

  // 🔍 الفلترة: بحث نصّي + filter بالدولة
  const filteredCities = useMemo(() => {
    let list = CITIES;
    if (countryFilter) list = list.filter((c) => c.countryCode === countryFilter);
    const q = query.trim();
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.cityAr.includes(q) ||
          c.cityEn.toLowerCase().includes(ql) ||
          c.countryAr.includes(q) ||
          c.countryEn.toLowerCase().includes(ql),
      );
    }
    return list;
  }, [query, countryFilter]);

  // 🔥 المدن الشعبية (للـ quick access)
  const popularCities = useMemo(() => CITIES.filter((c) => c.popular), []);

  const handleSelect = (city: City) => {
    setLocation({
      cityAr: city.cityAr,
      cityEn: city.cityEn,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
    });
    router.back();
  };

  const isSelected = (city: City) =>
    Math.abs(currentLocation.latitude - city.latitude) < 0.001 &&
    Math.abs(currentLocation.longitude - city.longitude) < 0.001;

  return (
    <Screen scrollable={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader title="الموقع" subtitle="اختر دولتك ومدينتك لمواقيت الصلاة" onBack={() => router.back()} />

        {/* 📍 المدينة الحالية */}
        <View style={[styles.currentCard, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold }]}>
          <View style={[styles.currentIcon, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}>
            <MapPin size={18} color={t.colors.accent} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ color: t.colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>المدينة الحالية</Text>
            <Text style={{ color: t.colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{currentLocation.cityAr}</Text>
          </View>
          <Text style={{ color: t.colors.textTertiary, fontSize: 11 }}>UTC{currentLocation.timezone >= 0 ? '+' : ''}{currentLocation.timezone}</Text>
        </View>

        {/* 📍 زر اكتشاف الموقع تلقائياً (GPS) */}
        <Pressable
          onPress={handleDetect}
          disabled={detecting}
          style={({ pressed }) => [
            styles.detectBtn,
            { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed || detecting ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="اكتشف موقعي تلقائياً"
        >
          {detecting ? (
            <ActivityIndicator size="small" color={t.colors.accent} />
          ) : (
            <Navigation size={18} color={t.colors.accent} />
          )}
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', marginHorizontal: 8 }}>
            {detecting ? 'جاري تحديد موقعك...' : 'اكتشف موقعي تلقائياً'}
          </Text>
        </Pressable>

        {/* 🔍 شريط البحث */}
        <View style={[styles.searchBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Search size={16} color={t.colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            placeholder="ابحث عن مدينة أو دولة..."
            placeholderTextColor={t.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            style={[styles.searchInput, { color: t.colors.textPrimary }]}
          />
        </View>
      </View>

      {/* 🏳️ chips الدول — صفّ يلتفّ (wrap) بدل ScrollView أفقي لضمان ظهور المحتوى في RTL */}
      <View style={styles.countriesRow}>
        <CountryChip flag="🌐" label="الكل" active={countryFilter === null} onPress={() => setCountryFilter(null)} t={t} />
        {COUNTRIES.map((c) => (
          <CountryChip
            key={c.code}
            flag={c.flag}
            label={c.nameAr}
            active={countryFilter === c.code}
            onPress={() => setCountryFilter((cur) => (cur === c.code ? null : c.code))}
            t={t}
          />
        ))}
      </View>

      {/* 🔥 الشعبية - تظهر فقط لو مفيش search ومفيش filter */}
      {!query && !countryFilter ? (
        <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 4 }}>
          <Text style={{ color: t.colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>الأكثر اختياراً</Text>
        </View>
      ) : null}
      {!query && !countryFilter ? (
        <View style={styles.popularRow}>
          {popularCities.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => handleSelect(c)}
              style={({ pressed }) => [
                styles.popularChip,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: isSelected(c) ? t.colors.accent : t.colors.borderGold,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{c.flag}</Text>
              <Text style={{ color: t.colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{c.cityAr}</Text>
              {isSelected(c) ? <Check size={12} color={t.colors.accent} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* 📋 قائمة المدن */}
      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            accessibilityLabel={`${item.cityAr}، ${item.countryAr}`}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: isSelected(item) ? t.colors.primarySoft : t.colors.surface,
                borderColor: isSelected(item) ? t.colors.accent : t.colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>{item.flag}</Text>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={{ color: t.colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{item.cityAr}</Text>
              <Text style={{ color: t.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
                {item.countryAr} · UTC{item.timezone >= 0 ? '+' : ''}{item.timezone}
              </Text>
            </View>
            {isSelected(item) ? (
              <View style={[styles.checkBadge, { backgroundColor: t.colors.accent + '20', borderColor: t.colors.accent }]}>
                <Check size={14} color={t.colors.accent} />
              </View>
            ) : (
              <ChevronLeft size={18} color={t.colors.textTertiary} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ color: t.colors.textTertiary }}>لا توجد نتائج لـ "{query}"</Text>
          </View>
        }
      />
    </Screen>
  );
}

const CountryChip: React.FC<{
  flag: string;
  label: string;
  active: boolean;
  onPress: () => void;
  t: any;
}> = ({ flag, label, active, onPress, t }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.countryChip,
      {
        backgroundColor: active ? t.colors.primary : t.colors.surface,
        borderColor: active ? t.colors.accent : t.colors.borderGold,
        opacity: pressed ? 0.85 : 1,
      },
    ]}
  >
    <Text style={{ fontSize: 14 }}>{flag}</Text>
    <Text style={{ color: active ? '#FFF' : t.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  currentIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    textAlign: 'right',
  },
  countriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  popularRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  popularChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 90,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkBadge: {
    width: 26, height: 26,
    borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
