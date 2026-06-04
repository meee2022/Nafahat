/**
 * شاشة المساجد القريبة — بيانات حيّة حقيقية.
 *
 * تستخدم expo-location لجلب إحداثيات المستخدم الفعلية، ثم تستعلم عن أقرب
 * المساجد من OpenStreetMap عبر Overpass API (مجاني، بدون مفتاح). تُحسب
 * المسافات الحقيقية (Haversine) وتُرتَّب من الأقرب للأبعد. في قطر تظهر
 * مساجد قطر، وفي أي بلد آخر تظهر مساجده — حسب موقعك الفعلي.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowRight, MapPin, Navigation, Clock, ChevronLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button, EmptyState } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { IllMosques } from '@components/illustrations';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

interface Mosque {
  id: string;
  name: string;
  distanceKm: number;
  walkMinutes: number;
  address: string;
  lat: number;
  lon: number;
}

type Status = 'idle' | 'loading' | 'denied' | 'error' | 'empty' | 'ok';

// مسافة Haversine بالكيلومتر بين نقطتين
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MosquesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [mosques, setMosques] = useState<Mosque[]>([]);

  const loadNearby = useCallback(async () => {
    try {
      setStatus('loading');

      // 1) إذن الموقع
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }

      // 2) الإحداثيات الفعلية
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;

      // 3) استعلام Overpass عن دور العبادة الإسلامية ضمن دائرة نصف قطرها ٥ كم
      const radius = 5000;
      const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude}););out center tags;`;

      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
      ];

      let data: any = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(query),
          });
          if (!res.ok) continue;
          data = await res.json();
          break;
        } catch {
          // جرّب المزوّد التالي
        }
      }

      if (!data || !Array.isArray(data.elements)) {
        setStatus('error');
        return;
      }

      // 4) تحويل + حساب المسافة + ترتيب
      const list: Mosque[] = data.elements
        .map((el: any, i: number) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (elLat == null || elLon == null) return null;
          const tags = el.tags ?? {};
          const name: string =
            tags['name:ar'] || tags.name || tags['official_name'] || 'مسجد';
          const street = tags['addr:street'] || '';
          const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:district'] || '';
          const address = [street, city].filter(Boolean).join('، ') || 'بالقرب منك';
          const distanceKm = haversineKm(latitude, longitude, elLat, elLon);
          return {
            id: String(el.id ?? i),
            name,
            address,
            lat: elLat,
            lon: elLon,
            distanceKm: Math.round(distanceKm * 10) / 10,
            walkMinutes: Math.max(1, Math.round(distanceKm * 12)), // ~٥ كم/س
          } as Mosque;
        })
        .filter(Boolean)
        .sort((a: Mosque, b: Mosque) => a.distanceKm - b.distanceKm)
        .slice(0, 20);

      if (list.length === 0) {
        setStatus('empty');
        return;
      }

      setMosques(list);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  const openInMaps = (m: Mosque) => {
    const q = `${m.lat},${m.lon}`;
    const label = encodeURIComponent(m.name);
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${label}&ll=${q}`
        : Platform.OS === 'android'
          ? `geo:${q}?q=${q}(${label})`
          : `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('mosques.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('mosques.title')}</Text>
        </View>
        {status === 'ok' ? (
          <Pressable onPress={loadNearby} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
            <RefreshCw size={16} color={t.colors.textSecondary} strokeWidth={1.6} />
          </Pressable>
        ) : (
          <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
        )}
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {status === 'loading' ? (
          <Card padding={t.spacing.xl} elevation="sm" bordered>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="large" color={t.colors.accent} />
              <Text variant="bodySm" color={t.colors.textSecondary} align="center" style={{ marginTop: 16 }}>
                جارٍ تحديد موقعك والبحث عن أقرب المساجد…
              </Text>
            </View>
          </Card>
        ) : status === 'idle' ? (
          <Card padding={t.spacing.xl} elevation="sm" bordered>
            <View style={{ alignItems: 'center' }}>
              <IllMosques size={84} />
              <Text variant="h3" style={{ marginTop: 16 }}>فعّل الموقع لإيجاد المساجد</Text>
              <Text variant="bodySm" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 280, lineHeight: 22 }}>
                نحتاج للوصول لموقعك الجغرافي لعرض المساجد القريبة منك فعلاً مع المسافة الحقيقية.
              </Text>
              <Button label="السماح بالموقع" iconRight={<Navigation size={14} color={t.colors.onPrimary} />} onPress={loadNearby} style={{ marginTop: 18 }} />
            </View>
          </Card>
        ) : status === 'denied' ? (
          <EmptyState
            title="تم رفض إذن الموقع"
            description="لتفعيل الموقع: افتح إعدادات الجهاز ← التطبيقات ← نَفَحات ← الأذونات ← الموقع، ثم أعد المحاولة."
            actionLabel="إعادة المحاولة"
            onAction={loadNearby}
          />
        ) : status === 'error' ? (
          <EmptyState
            title="تعذّر جلب المساجد"
            description="تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
            actionLabel="إعادة المحاولة"
            onAction={loadNearby}
          />
        ) : status === 'empty' ? (
          <EmptyState
            title="لا توجد مساجد قريبة"
            description="لم نعثر على مساجد ضمن ٥ كم من موقعك في قاعدة بيانات الخرائط."
            actionLabel="إعادة المحاولة"
            onAction={loadNearby}
          />
        ) : (
          <>
            {/* رأس قائمة */}
            <View style={styles.listHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: t.colors.accent }]}>أقرب المساجد</Text>
                <Text style={[styles.listTitle, { color: t.colors.textPrimary }]}>{arabicNumber(mosques.length)} مساجد</Text>
              </View>
              <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
            </View>

            {/* قائمة المساجد */}
            <View style={{ gap: 12, marginTop: 8 }}>
              {mosques.map((m, idx) => (
                <Card key={m.id} padding={t.spacing.lg} elevation="xs" bordered onPress={() => openInMaps(m)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.indexBox, { borderColor: t.colors.accent, backgroundColor: t.colors.accent + '12' }]}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: t.colors.accent, lineHeight: 24 }}>
                        {arabicNumber(idx + 1)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text variant="subtitle">{m.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <MapPin size={11} color={t.colors.textTertiary} />
                        <Text variant="caption" color={t.colors.textSecondary}>{m.address}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Navigation size={11} color={t.colors.accent} />
                          <Text variant="caption" color={t.colors.accent} style={{ fontWeight: '700' }}>
                            {m.distanceKm} كم
                          </Text>
                        </View>
                        <Text variant="caption" color={t.colors.textTertiary}>·</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} color={t.colors.textTertiary} />
                          <Text variant="caption" color={t.colors.textTertiary}>
                            {arabicNumber(m.walkMinutes)} د مشياً
                          </Text>
                        </View>
                      </View>
                    </View>

                    <ChevronLeft size={16} color={t.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>

            <Card padding={t.spacing.md} elevation="xs" style={{ marginTop: 18 }}>
              <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ lineHeight: 18 }}>
                مساجد حقيقية حسب موقعك الحالي من OpenStreetMap. اضغط على المسجد للحصول على الاتجاهات.
              </Text>
            </Card>
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  listHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  listTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },

  indexBox: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  nextPrayer: {
    marginTop: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 4, borderWidth: 0.5,
  },
});
