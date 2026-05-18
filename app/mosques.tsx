/**
 * شاشة المساجد القريبة - تتطلّب الموقع الجغرافي.
 * النسخة الحالية تعرض حالة "تفعيل الموقع" + بيانات نموذجية لبعض المساجد.
 *
 * للنسخة الحية: نحتاج expo-location لجلب الإحداثيات + Google Places API أو OSM
 * للحصول على المساجد القريبة.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, MapPin, Navigation, Clock, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button, EmptyState } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { IllMosques } from '@components/illustrations';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';

interface Mosque {
  id: string;
  name: string;
  distanceKm: number;
  walkMinutes: number;
  address: string;
  nextPrayer?: string;
  nextPrayerTime?: string;
}

const SAMPLE: Mosque[] = [
  { id: 'm1', name: 'الجامع الكبير',   distanceKm: 0.3, walkMinutes: 4,  address: 'شارع الملك فيصل',     nextPrayer: 'العصر',   nextPrayerTime: '٣:٤٨' },
  { id: 'm2', name: 'مسجد النور',      distanceKm: 0.6, walkMinutes: 8,  address: 'حيّ السلام',          nextPrayer: 'المغرب',  nextPrayerTime: '٦:١٢' },
  { id: 'm3', name: 'مسجد الفتح',      distanceKm: 1.2, walkMinutes: 15, address: 'شارع الجمهورية',     nextPrayer: 'العشاء',  nextPrayerTime: '٧:٤٠' },
  { id: 'm4', name: 'مسجد الإمام علي', distanceKm: 1.8, walkMinutes: 22, address: 'حيّ الزهور' },
];

export default function MosquesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [locationEnabled, setLocationEnabled] = useState(false);

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
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {!locationEnabled ? (
          <Card padding={t.spacing.xl} elevation="sm" bordered>
            <View style={{ alignItems: 'center' }}>
              <IllMosques size={84} />
              <Text variant="h3" style={{ marginTop: 16 }}>فعّل الموقع لإيجاد المساجد</Text>
              <Text variant="bodySm" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 280, lineHeight: 22 }}>
                نحتاج للوصول لموقعك الجغرافي لعرض المساجد القريبة منك مع المسافة وأوقات الصلاة.
              </Text>
              <Button label="السماح بالموقع" iconRight={<Navigation size={14} color={t.colors.onPrimary} />} onPress={() => setLocationEnabled(true)} style={{ marginTop: 18 }} />
            </View>
          </Card>
        ) : (
          <>
            {/* رأس قائمة */}
            <View style={styles.listHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: t.colors.accent }]}>أقرب المساجد</Text>
                <Text style={[styles.listTitle, { color: t.colors.textPrimary }]}>{arabicNumber(SAMPLE.length)} مساجد</Text>
              </View>
              <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
            </View>

            {/* قائمة المساجد */}
            <View style={{ gap: 12, marginTop: 8 }}>
              {SAMPLE.map((m, idx) => (
                <Card
                  key={m.id}
                  padding={t.spacing.lg}
                  elevation="xs"
                  bordered
                  onPress={() => {
                    // فتح خرائط (Google Maps - web أو deeplink على Native)
                    const q = encodeURIComponent(`${m.name}, ${m.address}`);
                    const url = Platform.OS === 'ios'
                      ? `maps://?q=${q}`
                      : Platform.OS === 'android'
                        ? `geo:0,0?q=${q}`
                        : `https://www.google.com/maps/search/?api=1&query=${q}`;
                    Linking.openURL(url).catch(() => {
                      // fallback لـ Google Maps web دائماً
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
                    });
                  }}
                >
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

                      {m.nextPrayer ? (
                        <View style={[styles.nextPrayer, { backgroundColor: t.colors.success + '14', borderColor: t.colors.success + '50' }]}>
                          <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>
                            {m.nextPrayer}
                          </Text>
                          <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>
                            {m.nextPrayerTime}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <ChevronLeft size={16} color={t.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>

            <Card padding={t.spacing.md} elevation="xs" style={{ marginTop: 18 }}>
              <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ lineHeight: 18 }}>
                تظهر المسافات حسب موقعك الحالي. اضغط على المسجد للحصول على الاتجاهات.
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
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
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
