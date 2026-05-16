/**
 * شاشة مواقيت الصلاة - 6 أوقات + الصلاة القادمة + اختيار الطريقة.
 * تستخدم calculatePrayerTimes (محلية، بدون API).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, MapPin, Settings2, Clock, Sun, Sunrise, Sunset, Moon, Star,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card, Button } from '@components/ui';
import {
  calculatePrayerTimes, nextPrayer, PRAYER_NAMES_AR, PrayerName, CalculationMethod,
} from '@services/prayerTimes';
import { schedulePrayerNotifications, cancelAllPrayerNotifications, isAvailable as notifAvailable } from '@services/prayerNotifications';
import { playAdhan, stopAdhan } from '@services/adhan';
import { startAdhanScheduler, stopAdhanScheduler, updateAdhanTimes } from '@services/adhanScheduler';
import { useSettingsStore } from '@store/index';
import { Bell, BellOff, Volume2 } from 'lucide-react-native';

// إحداثيات افتراضية - مكة المكرّمة
const DEFAULT_LOCATION = {
  latitude: 21.4225,
  longitude: 39.8262,
  timezone: 3,
  cityNameAr: 'مكة المكرّمة',
  cityNameEn: 'Makkah',
};

const PRAYER_ICONS: Record<PrayerName, React.ReactNode> = {
  fajr:    <Sunrise size={18} color="#6B4FBB" />,
  sunrise: <Sun size={18} color="#F5A742" />,
  dhuhr:   <Sun size={18} color="#FBB040" />,
  asr:     <Sun size={18} color="#E89B5E" />,
  maghrib: <Sunset size={18} color="#C77B2F" />,
  isha:    <Moon size={18} color="#2F5A8C" />,
};

const METHODS: { id: CalculationMethod; nameAr: string }[] = [
  { id: 'Makkah',  nameAr: 'أم القرى - السعودية' },
  { id: 'Egypt',   nameAr: 'الهيئة المصرية' },
  { id: 'ISNA',    nameAr: 'أمريكا الشمالية' },
  { id: 'MWL',     nameAr: 'رابطة العالم الإسلامي' },
  { id: 'Karachi', nameAr: 'باكستان - كراتشي' },
  { id: 'Tehran',  nameAr: 'إيران - طهران' },
  { id: 'Jafari',  nameAr: 'الجعفري' },
];

export default function PrayerTimesScreen() {
  const t = useTheme();
  const router = useRouter();
  const [method, setMethod] = useState<CalculationMethod>('Makkah');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [now, setNow] = useState(new Date());
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [adhanPlaying, setAdhanPlaying] = useState(false);

  // تحديث الوقت كل دقيقة (لإعادة حساب الـ countdown)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const times = useMemo(() => calculatePrayerTimes({
    date: now,
    latitude:  DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    timezone:  DEFAULT_LOCATION.timezone,
    method,
  }), [now, method]);

  const next = useMemo(() => nextPrayer(times, now), [times, now]);

  // 🕌 الأذان التلقائي - يبدأ المُجدول لو مفعّل في الإعدادات
  const autoAdhanEnabled = useSettingsStore((s) => s.autoAdhanEnabled);
  const adhanVoice = useSettingsStore((s) => s.adhanVoice);
  useEffect(() => {
    if (autoAdhanEnabled) {
      startAdhanScheduler(times, adhanVoice);
    } else {
      stopAdhanScheduler();
    }
    return () => stopAdhanScheduler();
  }, [autoAdhanEnabled, adhanVoice]);

  // حدّث المواقيت في المُجدول عند تغيير المنطقة أو الطريقة
  useEffect(() => {
    if (autoAdhanEnabled) updateAdhanTimes(times);
  }, [times, autoAdhanEnabled]);

  const formatCountdown = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} دقيقة`;
    return `${h} س${m > 0 ? ` و ${m} د` : ''}`;
  };

  const todayDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const handleLocationChange = () => {
    Alert.alert(
      'الموقع الجغرافي',
      `الموقع الحالي: ${DEFAULT_LOCATION.cityNameAr}\n\nستتم إضافة كشف الموقع التلقائي عبر GPS قريباً.`,
      [{ text: 'حسناً' }],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/(tabs)');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اليوم</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>مواقيت الصلاة</Text>
        </View>
        <Pressable
          onPress={() => setShowMethodPicker((v) => !v)}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <Settings2 size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }}>
        {/* صفّ التنبيهات + الأذان */}
        {notifAvailable() ? (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={async () => {
                if (notifEnabled) {
                  await cancelAllPrayerNotifications();
                  setNotifEnabled(false);
                  Alert.alert('✓ تم', 'تم إيقاف التذكيرات.');
                } else {
                  await schedulePrayerNotifications(times);
                  setNotifEnabled(true);
                  Alert.alert('✓ تم', '٥ صلوات + ٣ أذكار جُدْوِلَت يومياً.');
                }
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: notifEnabled ? t.colors.success + '14' : t.colors.surface,
                  borderColor: notifEnabled ? t.colors.success : t.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {notifEnabled ? <Bell size={18} color={t.colors.success} /> : <BellOff size={18} color={t.colors.textSecondary} />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: notifEnabled ? t.colors.success : t.colors.textPrimary, marginStart: 8 }}>
                {notifEnabled ? 'التنبيهات مُفعّلة' : 'فعّل تنبيهات الصلاة'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={async () => {
            if (adhanPlaying) {
              await stopAdhan();
              setAdhanPlaying(false);
            } else {
              const ok = await playAdhan('makkah');
              setAdhanPlaying(ok);
              if (!ok) Alert.alert('عذراً', 'تعذّر تشغيل صوت الأذان.');
            }
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: adhanPlaying ? t.colors.accent + '14' : t.colors.surface,
              borderColor: adhanPlaying ? t.colors.accent : t.colors.border,
              opacity: pressed ? 0.85 : 1,
              marginBottom: 16,
            },
          ]}
        >
          <Volume2 size={18} color={adhanPlaying ? t.colors.accent : t.colors.textSecondary} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: adhanPlaying ? t.colors.accentDeep : t.colors.textPrimary, marginStart: 8 }}>
            {adhanPlaying ? 'إيقاف الأذان' : 'استمع للأذان'}
          </Text>
        </Pressable>

        {/* الصلاة القادمة - hero */}
        <LinearGradient
          colors={[t.colors.primary, t.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ position: 'absolute', top: -10, end: -20, opacity: 0.18 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff' }} />
          </View>

          <Text style={[styles.heroEyebrow, { color: 'rgba(251,247,234,0.8)' }]}>الصلاة القادمة</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
            <Text style={[styles.heroPrayerName, { color: '#FBF7EA' }]}>
              {PRAYER_NAMES_AR[next.name]}
            </Text>
            <Text style={[styles.heroPrayerTime, { color: '#FBF7EA' }]}>
              {next.time}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Clock size={14} color="rgba(251,247,234,0.85)" />
            <Text style={{ fontSize: 13, color: 'rgba(251,247,234,0.85)', fontWeight: '600' }}>
              متبقّي: {formatCountdown(next.minutesUntil)}
            </Text>
          </View>

          {/* الموقع + التاريخ */}
          <View style={[styles.heroFooter, { borderTopColor: 'rgba(251,247,234,0.18)' }]}>
            <Pressable
              onPress={handleLocationChange}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
            >
              <MapPin size={13} color="rgba(251,247,234,0.85)" />
              <Text style={{ fontSize: 12, color: 'rgba(251,247,234,0.85)', fontWeight: '600' }}>
                {DEFAULT_LOCATION.cityNameAr}
              </Text>
            </Pressable>
            <Text style={{ fontSize: 11, color: 'rgba(251,247,234,0.75)' }}>{todayDate}</Text>
          </View>
        </LinearGradient>

        {/* قائمة الـ 6 أوقات */}
        <Card padding={0} elevation="xs" bordered style={{ marginTop: 16 }}>
          {(Object.keys(PRAYER_NAMES_AR) as PrayerName[]).map((name, i) => {
            const isNext = name === next.name;
            return (
              <View
                key={name}
                style={[
                  styles.prayerRow,
                  {
                    borderBottomColor: t.colors.divider,
                    borderBottomWidth: i < 5 ? StyleSheet.hairlineWidth : 0,
                    backgroundColor: isNext ? t.colors.accent + '14' : 'transparent',
                  },
                ]}
              >
                <View style={[styles.prayerIcon, { backgroundColor: t.colors.surfaceAlt }]}>
                  {PRAYER_ICONS[name]}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.textPrimary }}>
                    {PRAYER_NAMES_AR[name]}
                  </Text>
                  {isNext ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.accent, marginTop: 2 }}>
                      ◇ القادمة
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.textPrimary, letterSpacing: 0.5 }}>
                  {times[name]}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* اختيار الطريقة */}
        {showMethodPicker ? (
          <Card padding={0} elevation="xs" bordered style={{ marginTop: 16 }}>
            <View style={{ padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.textPrimary }}>طريقة الحساب</Text>
              <Text style={{ fontSize: 11, color: t.colors.textTertiary, marginTop: 2 }}>
                اختر الطريقة الفقهية المعتمدة في بلدك
              </Text>
            </View>
            {METHODS.map((m, i) => {
              const active = method === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => { setMethod(m.id); setShowMethodPicker(false); }}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row', alignItems: 'center',
                      padding: 14,
                      backgroundColor: active ? t.colors.primary + '10' : (pressed ? t.colors.surfaceAlt : 'transparent'),
                      borderBottomWidth: i < METHODS.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: t.colors.divider,
                    },
                  ]}
                >
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: active ? '700' : '500', color: t.colors.textPrimary }}>
                    {m.nameAr}
                  </Text>
                  {active ? (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {/* ملاحظة */}
        <View style={[styles.noteCard, { backgroundColor: t.colors.accent + '08', borderColor: t.colors.accent + '30' }]}>
          <Star size={14} color={t.colors.accent} />
          <Text style={{ flex: 1, fontSize: 11, color: t.colors.textSecondary, marginStart: 8, lineHeight: 18 }}>
            المواقيت محسوبة بطريقة <Text style={{ fontWeight: '700', color: t.colors.accentDeep }}>{METHODS.find((m) => m.id === method)?.nameAr}</Text>.
            ستتم إضافة كشف موقعك التلقائي قريباً.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// مكوّن Text محلي
const Text: React.FC<any> = ({ style, ...rest }) => {
  return <RNText style={style} {...rest} />;
};
import { Text as RNText } from 'react-native';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  actionsRow: {
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  heroCard: {
    padding: 22,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroEyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  heroPrayerName: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  heroPrayerTime: { fontSize: 38, fontWeight: '300', letterSpacing: -1 },
  heroFooter: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  prayerIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, marginTop: 18,
    borderRadius: 12, borderWidth: 1,
  },
});
