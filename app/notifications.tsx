/**
 * شاشة الإشعارات والتذكيرات - مربوطة بـ expo-notifications.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, BellRing, BookOpen, Brain, Sunrise, Moon, AlertCircle, Check, Volume2, ChevronLeft, Repeat } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  isNotificationsSupported, requestPermission,
  scheduleDaily, cancelReminder, DEFAULT_REMINDERS,
} from '@services/notifications';
import { useT } from '@store/languageStore';
import { useSettingsStore } from '@store/index';
import { scheduleDhikrReminders, cancelDhikrReminders } from '@services/dhikrReminders';

interface NotificationItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  color: string;
  /** المسار الذي يفتح عند الضغط على الإشعار. */
  route: string;
}

interface SettingItem {
  key: string;
  icon: React.ReactNode;
  labelKey: 'notif.wirdLabel' | 'notif.memoLabel' | 'notif.reviewLabel' | 'notif.adhkarLabel';
  descKey:  'notif.wirdDesc'  | 'notif.memoDesc'  | 'notif.reviewDesc'  | 'notif.adhkarDesc';
  defaultOn: boolean;
}

const SETTINGS: SettingItem[] = [
  { key: 'wird',    icon: <Sunrise size={16} />,  labelKey: 'notif.wirdLabel',   descKey: 'notif.wirdDesc',   defaultOn: true  },
  { key: 'memo',    icon: <Brain size={16} />,    labelKey: 'notif.memoLabel',   descKey: 'notif.memoDesc',   defaultOn: true  },
  { key: 'review',  icon: <BellRing size={16} />, labelKey: 'notif.reviewLabel', descKey: 'notif.reviewDesc', defaultOn: true  },
  { key: 'adhkar',  icon: <Moon size={16} />,     labelKey: 'notif.adhkarLabel', descKey: 'notif.adhkarDesc', defaultOn: false },
];

const REMINDER_MAP: Record<string, typeof DEFAULT_REMINDERS[number] | undefined> = {
  wird:   DEFAULT_REMINDERS.find((r) => r.identifier === 'wird-morning'),
  memo:   DEFAULT_REMINDERS.find((r) => r.identifier === 'memo-evening'),
  adhkar: DEFAULT_REMINDERS.find((r) => r.identifier === 'adhkar-evening'),
};

export default function NotificationsScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [permission, setPermission] = React.useState<boolean | null>(null);
  // 🔒 الحالة محفوظة دائماً في الـstore (مش useState محلّي) فلا ترجع للوضع
  //    الافتراضي لما المستخدم يطلع من الشاشة ويرجع.
  const settings = useSettingsStore((s) => s.notifToggles);
  const setNotifToggle = useSettingsStore((s) => s.setNotifToggle);

  // 📿 الأذكار الدورية
  const dhikrEnabled = useSettingsStore((s) => s.dhikrEnabled);
  const dhikrIntervalHours = useSettingsStore((s) => s.dhikrIntervalHours);
  const setDhikrEnabled = useSettingsStore((s) => s.setDhikrEnabled);
  const setDhikrIntervalHours = useSettingsStore((s) => s.setDhikrIntervalHours);

  const handleDhikrToggle = async (v: boolean) => {
    setDhikrEnabled(v);
    if (v) {
      if (permission !== true) {
        const granted = await requestPermission();
        setPermission(granted);
        if (!granted) { setDhikrEnabled(false); return; }
      }
      await scheduleDhikrReminders(dhikrIntervalHours);
    } else {
      await cancelDhikrReminders();
    }
  };

  const handleDhikrInterval = async (h: number) => {
    setDhikrIntervalHours(h);
    if (dhikrEnabled) await scheduleDhikrReminders(h);
  };

  const supported = isNotificationsSupported();

  // عناصر الإشعارات (تستخدم tr داخل المكون)
  const ITEMS: NotificationItem[] = [
    { id: '1', icon: <Sunrise size={18} />, color: '#F5A742', title: tr('notif.sample.wirdTitle'),     desc: tr('notif.sample.wirdDesc'),     time: tr('notif.timeAgo.min12'),      read: false, route: '/wird'         },
    { id: '2', icon: <Brain size={18} />,   color: '#A2384B', title: tr('notif.sample.reviewTitle'),   desc: tr('notif.sample.reviewDesc'),   time: tr('notif.timeAgo.hour1'),      read: false, route: '/review'       },
    { id: '3', icon: <Moon size={18} />,    color: '#1B2747', title: tr('notif.sample.adhkarTitle'),   desc: tr('notif.sample.adhkarDesc'),   time: tr('notif.timeAgo.yesterday'),  read: true,  route: '/adhkar'       },
    { id: '4', icon: <BookOpen size={18} />,color: '#0F4A41', title: tr('notif.sample.continueTitle'), desc: tr('notif.sample.continueDesc'), time: tr('notif.timeAgo.twoDaysAgo'), read: true,  route: '/(tabs)/mushaf' },
  ];

  useEffect(() => {
    // طلب الإذن عند فتح الشاشة
    if (supported && permission === null) {
      requestPermission().then(setPermission);
    }
  }, [supported, permission]);

  const handleToggle = async (key: string, value: boolean) => {
    setNotifToggle(key, value);

    const reminder = REMINDER_MAP[key];
    if (!reminder) return;

    if (value) {
      // طلب الإذن أولاً إن لم يكن مُمنحاً
      if (permission !== true) {
        const granted = await requestPermission();
        setPermission(granted);
        if (!granted) {
          setNotifToggle(key, false);
          return;
        }
      }
      await scheduleDaily(reminder);
    } else {
      await cancelReminder(reminder.identifier);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('notif.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('notif.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {/* حالة الإذن */}
        {!supported ? (
          <Card padding={14} elevation="none" bordered background={t.colors.warning + '14'} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color={t.colors.warning} />
              <Text variant="bodySm" color={t.colors.warning} style={{ flex: 1 }}>
                {tr('notif.notSupported')}
              </Text>
            </View>
          </Card>
        ) : permission === false ? (
          <Card padding={14} elevation="none" bordered background={t.colors.error + '14'} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color={t.colors.error} />
              <Text variant="bodySm" color={t.colors.error} style={{ flex: 1 }}>
                {tr('notif.denied')}
              </Text>
            </View>
          </Card>
        ) : permission === true ? (
          <Card padding={14} elevation="none" bordered background={t.colors.success + '10'} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Check size={18} color={t.colors.success} />
              <Text variant="bodySm" color={t.colors.success} style={{ flex: 1, fontWeight: '600' }}>
                {tr('notif.enabled')}
              </Text>
            </View>
          </Card>
        ) : null}

        {/* القائمة */}
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('notif.recentEyebrow')}</Text>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>{tr('notif.recent')}</Text>
          </View>
          <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
        </View>

        <View style={{ gap: 10 }}>
          {ITEMS.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => router.push(n.route as any)}
              accessibilityRole="button"
              accessibilityLabel={`${n.title} - ${n.desc}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card padding={14} elevation={n.read ? 'xs' : 'none'} bordered background={n.read ? undefined : t.colors.accent + '06'}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={[styles.notifIcon, { backgroundColor: n.color + '14', borderColor: n.color }]}>
                    {React.cloneElement(n.icon as any, { color: n.color })}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="subtitle">{n.title}</Text>
                      {!n.read ? <View style={[styles.unreadDot, { backgroundColor: t.colors.error }]} /> : null}
                    </View>
                    <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                      {n.desc}
                    </Text>
                    <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>
                      {n.time}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* 🕌 تنبيهات الصلاة والأذان والإقامة */}
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الصلاة</Text>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>الأذان والإقامة</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/prayer-times')}
          accessibilityRole="button"
          accessibilityLabel="إعدادات الأذان وتنبيهات الصلاة والإقامة"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Card padding={14} elevation="none" bordered background={t.colors.accent + '08'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.notifIcon, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent }]}>
                <Volume2 size={18} color={t.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subtitle">تنبيهات الصلاة والأذان</Text>
                <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                  فعّل الأذان التلقائي، اختر صوت الأذان، واضبط تنبيه الإقامة
                </Text>
              </View>
              <ChevronLeft size={20} color={t.colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        {/* 📿 الأذكار الدورية */}
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>ذِكر مستمر</Text>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>الأذكار الدورية</Text>
          </View>
        </View>

        <Card padding={14} elevation="none" bordered>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.notifIcon, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent }]}>
              <Repeat size={18} color={t.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subtitle">تذكير بالأذكار كل فترة</Text>
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                ذِكر متنوّع على مدار اليوم (٨ ص – ١٠ م)
              </Text>
            </View>
            <Switch
              value={dhikrEnabled}
              onValueChange={handleDhikrToggle}
              trackColor={{ false: t.colors.borderStrong, true: t.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {dhikrEnabled ? (
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4].map((h) => {
                const active = dhikrIntervalHours === h;
                const label = h === 1 ? 'كل ساعة' : h === 2 ? 'كل ساعتين' : `كل ${h} ساعات`;
                return (
                  <Pressable
                    key={h}
                    onPress={() => handleDhikrInterval(h)}
                    style={({ pressed }) => [
                      styles.intervalChip,
                      {
                        backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt,
                        borderColor: active ? t.colors.primary : t.colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : t.colors.textSecondary }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Card>

        {/* الإعدادات */}
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('notif.customize')}</Text>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>{tr('notif.types')}</Text>
          </View>
        </View>

        <Card padding={0} elevation="xs" bordered>
          {SETTINGS.map((s, i) => (
            <View key={s.key} style={[styles.settingRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider }]}>
              <View style={[styles.settingIcon, { backgroundColor: t.colors.surfaceAlt }]}>
                {React.cloneElement(s.icon as any, { color: t.colors.textSecondary })}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{tr(s.labelKey)}</Text>
                <Text variant="caption" color={t.colors.textTertiary}>{tr(s.descKey)}</Text>
              </View>
              <Switch
                value={settings[s.key] ?? s.defaultOn}
                onValueChange={(v) => handleToggle(s.key, v)}
                trackColor={{ false: t.colors.borderStrong, true: t.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },

  notifIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5,
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  intervalChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
  },
});
