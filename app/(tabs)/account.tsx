/**
 * شاشة حسابي - الملف + الإحصائيات + الإعدادات + الإنجازات.
 */
import React from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award, BookOpen, Brain, Headphones, Heart, Flame, Calendar,
  Moon, Sun, Type, Bell, Globe, Download, Info, ChevronLeft,
  LogIn, FileText, Mic, Sparkles, Edit3, Shield,
} from 'lucide-react-native';
import { useIsAdmin } from '@store/appConfigStore';
import { computeUserLevel } from '@utils/userLevel';
import { useTheme, useThemeMode } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar, Chip } from '@components/ui';
import { StatCard } from '@components/common';
import { useUserStore, useStatsStore, useSettingsStore } from '@store/index';
import { arabicNumber } from '@data/surahs';
import { useCloudSync } from '@hooks/useCloudSync';
import { useLanguageStore, useT } from '@store/languageStore';
import { LANGUAGES } from '@/i18n/index';
import { useAuthStore } from '@store/authStore';
import { LogOut } from 'lucide-react-native';

export default function AccountScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { mode, setMode, fontScale, setFontScale } = useThemeMode();
  const profile = useUserStore((s) => s.profile);
  const stats = useStatsStore((s) => s.stats);
  const sync = useCloudSync();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const langMeta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // إعدادات التطبيق
  const {
    notificationsEnabled, autoSaveTasmee,
    estimatedDownloadsMB,
    setNotifications, setAutoSaveTasmee,
  } = useSettingsStore();

  // المصادقة
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const isAuthenticated = authStatus === 'authenticated';
  const displayName = isAuthenticated && authUser ? authUser.name : profile.name;
  const displayInitial = (isAuthenticated && authUser ? authUser.name : profile.name).charAt(0);
  const isAdminEmail = useIsAdmin(authUser?.email);
  const isAdmin = isAuthenticated && isAdminEmail;

  // ⭐ حساب المستوى الفعلي من نشاط المستخدم
  const userLevel = React.useMemo(() => computeUserLevel(stats), [stats]);

  return (
    <Screen>
      <AppHeader title={tr('account.title')} />

      {/* بطاقة الملف */}
      <LinearGradient
        colors={[t.colors.primary, t.colors.primaryDark]}
        style={[styles.profileCard, { borderRadius: t.radius.xl }]}
      >
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text variant="h1" color="#fff">{displayInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="h2" color="#fff">{displayName}</Text>
            <Pressable hitSlop={t.hitSlop}>
              <Edit3 size={16} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
          {isAuthenticated && authUser ? (
            <Text variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
              {authUser.email}
            </Text>
          ) : null}
          <Text variant="bodySm" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            {isAuthenticated ? tr('account.memberRole') : tr('account.guestRole')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <View style={[styles.miniPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Flame size={12} color="#fff" />
              <Text variant="caption" color="#fff">{arabicNumber(stats.streakDays)} {tr('account.streakSuffix')}</Text>
            </View>
            <View style={[styles.miniPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Award size={12} color="#fff" />
              <Text variant="caption" color="#fff">
                {userLevel.emoji} {userLevel.title} · {tr('account.level')} {arabicNumber(userLevel.level)}
              </Text>
            </View>
          </View>

          {/* شريط تقدّم المستوى */}
          <View style={{ marginTop: 10 }}>
            <View style={styles.levelBarTrack}>
              <View
                style={[
                  styles.levelBarFill,
                  { width: `${Math.round(userLevel.progress * 100)}%` },
                ]}
              />
            </View>
            <Text variant="caption" color="rgba(255,255,255,0.75)" style={{ marginTop: 4, fontSize: 10 }}>
              {userLevel.nextMin === -1
                ? `وصلت لأعلى مستوى 🏆 (${arabicNumber(userLevel.points)} نقطة)`
                : `${arabicNumber(userLevel.points)} / ${arabicNumber(userLevel.nextMin)} نقطة · باقي ${arabicNumber(userLevel.pointsToNext)} للمستوى التالي`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* الإحصائيات */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('account.myStats')}</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <StatCard icon={<BookOpen size={16} color={t.colors.primary} />}    label={tr('account.statsRead')} value={arabicNumber(stats.pagesRead)} color={t.colors.primary} />
        <StatCard icon={<Brain size={16} color={t.colors.accent} />}        label={tr('account.statsMemorized')}  value={arabicNumber(stats.versesMemorized)} color={t.colors.accent} />
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.md }}>
        <StatCard icon={<Headphones size={16} color="#5390BA" />}            label={tr('account.statsListen')} value={arabicNumber(stats.listenedMinutes)} color="#5390BA" />
        <StatCard icon={<Heart size={16} color="#C9647A" />}                 label={tr('account.statsTasbeeh')}      value={arabicNumber(stats.tasbeehCount)} color="#C9647A" />
      </View>

      {/* رسم بياني أسبوعي */}
      <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="subtitle">{tr('account.weeklyActivity')}</Text>
          <Calendar size={16} color={t.colors.textTertiary} />
        </View>
        <View style={[styles.chart, { marginTop: t.spacing.md }]}>
          {stats.weeklyMinutes.map((m, i) => {
            const max = Math.max(...stats.weeklyMinutes, 1);
            const h = (m / max) * 80;
            return (
              <View key={i} style={{ alignItems: 'center', flex: 1, gap: 6 }}>
                <View style={{ height: 80, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <View style={{ width: 18, height: h, borderRadius: 6, backgroundColor: i === 6 ? t.colors.primary : t.colors.primarySoft }} />
                </View>
                <Text variant="caption" color={t.colors.textTertiary}>
                  {['س', 'أ', 'ث', 'ر', 'خ', 'ج', 'سب'][i]}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* اختصارات */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('account.shortcuts')}</Text>
      <View style={{ gap: t.spacing.sm }}>
        <Row icon={<Award size={18} color={t.colors.accent} />}    label={tr('account.achievements')} onPress={() => router.push('/achievements')} />
        <Row icon={<BookOpen size={18} color={t.colors.primary} />} label={tr('account.bookmarks')} onPress={() => router.push('/favorites')} />
        <Row icon={<FileText size={18} color={t.colors.info} />}    label={tr('account.notes')} onPress={() => router.push('/notes')} />
        <Row icon={<Mic size={18} color={t.colors.featureCarmine} />} label={tr('account.tasmeeSessions')} onPress={() => router.push('/tasmee')} />
        <Row icon={<Calendar size={18} color={t.colors.featureLapis} />} label={tr('account.khatmas')} onPress={() => router.push('/khatma')} />
      </View>

      {/* الإعدادات */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('settings.title')}</Text>

      <Card padding={t.spacing.lg} elevation="xs">
        <Text variant="label" color={t.colors.textSecondary} style={{ marginBottom: 8 }}>{tr('settings.appearance')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip iconLeft={<Sun size={14} color={mode === 'light' ? '#fff' : t.colors.textPrimary} />} label={tr('settings.light')} active={mode === 'light'} onPress={() => setMode('light')} />
          <Chip iconLeft={<Moon size={14} color={mode === 'dark' ? '#fff' : t.colors.textPrimary} />} label={tr('settings.dark')}  active={mode === 'dark'} onPress={() => setMode('dark')} />
          <Chip label={tr('settings.system')} active={mode === 'system'} onPress={() => setMode('system')} />
        </View>

        <Text variant="label" color={t.colors.textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>{tr('settings.fontSize')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
            <Chip key={s} label={tr(`settings.font${s.charAt(0).toUpperCase()}${s.slice(1)}` as any)} active={fontScale === s} onPress={() => setFontScale(s)} />
          ))}
        </View>

        {/* اختيار اللغة */}
        <Text variant="label" color={t.colors.textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>{tr('settings.language')} / Language</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.code}
              label={`${l.flag} ${l.nameNative}`}
              active={lang === l.code}
              onPress={() => setLang(l.code)}
            />
          ))}
        </View>
      </Card>

      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.md }}>
        <SettingToggle
          icon={<Bell size={18} color={t.colors.primary} />}
          label={tr('settings.notifications')}
          value={notificationsEnabled}
          onChange={setNotifications}
        />
        <SettingToggle
          icon={<Mic size={18} color={t.colors.featureCarmine} />}
          label={tr('settings.notificationsAutoSave')}
          value={autoSaveTasmee}
          onChange={setAutoSaveTasmee}
        />
        <Row
          icon={<Globe size={18} color={t.colors.info} />}
          label={tr('settings.language')}
          trailing={`${langMeta.flag} ${langMeta.nameNative}`}
          onPress={() => router.push('/languages')}
        />
        <Row
          icon={<Download size={18} color={t.colors.success} />}
          label={tr('settings.downloadManager')}
          trailing={`${estimatedDownloadsMB || '0'} MB`}
          onPress={() => router.push('/downloads')}
        />
        <Row
          icon={<Info size={18} color={t.colors.textSecondary} />}
          label={tr('settings.about')}
          onPress={() => router.push('/about')}
        />
      </View>

      {/* لوحة تحكم الأدمن — نُقلت لـ web admin، مش موجودة في الـ client بعد V2 */}
      {false && isAdmin ? (
        <View style={{ marginTop: t.spacing.lg }}>
          <Pressable
            onPress={() => router.push('/about')}
            style={({ pressed }) => [
              styles.adminBtn,
              {
                backgroundColor: t.colors.accent + '14',
                borderColor: t.colors.accent + '60',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.adminIcon, { backgroundColor: t.colors.accent }]}>
              <Shield size={18} color={t.colors.onAccent} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subtitle" color={t.colors.accent}>لوحة تحكم الأدمن</Text>
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                إدارة بيانات التطبيق والإهداء والروابط
              </Text>
            </View>
            <ChevronLeft size={18} color={t.colors.accent} />
          </Pressable>
        </View>
      ) : null}

      {/* بطاقة المصادقة */}
      {isAuthenticated ? (
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.lg }}>
          <Pressable
            onPress={handleSignOut}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={[styles.signOutIcon, { backgroundColor: t.colors.error + '14', borderColor: t.colors.error + '50' }]}>
              <LogOut size={18} color={t.colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subtitle" color={t.colors.error}>{tr('account.signOut')}</Text>
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                {tr('account.signOutHint')}
              </Text>
            </View>
          </Pressable>
        </Card>
      ) : (
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.lg, alignItems: 'center' }} background={t.colors.accentSoft}>
          <Sparkles size={28} color={t.colors.accent} />
          <Text variant="subtitle" style={{ marginTop: 8 }}>{tr('account.createForSync')}</Text>
          <Text variant="bodySm" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }}>
            {tr('account.createForSyncDesc')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Pressable
              onPress={() => router.push('/login')}
              style={[styles.signIn, { backgroundColor: t.colors.accent }]}
            >
              <LogIn size={16} color="#fff" />
              <Text variant="button" color="#fff">{tr('account.signIn')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/register')}
              style={[styles.signIn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.accent }]}
            >
              <Text variant="button" color={t.colors.accent}>{tr('account.signUp')}</Text>
            </Pressable>
          </View>
        </Card>
      )}

      <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ marginTop: t.spacing.xxl }}>
        {tr('app.name')} v1.0.0 · {tr('settings.signedTagline')}
      </Text>
    </Screen>
  );
}

const Row: React.FC<{ icon: React.ReactNode; label: string; onPress?: () => void; trailing?: string }> = ({ icon, label, onPress, trailing }) => {
  const t = useTheme();
  return (
    <Card onPress={onPress} padding={t.spacing.md} elevation="xs">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.rowIcon, { backgroundColor: t.colors.surfaceAlt }]}>{icon}</View>
        <Text variant="body" style={{ flex: 1 }}>{label}</Text>
        {trailing ? <Text variant="caption" color={t.colors.textTertiary}>{trailing}</Text> : null}
        <ChevronLeft size={16} color={t.colors.textTertiary} />
      </View>
    </Card>
  );
};

const SettingToggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: boolean;
  onChange?: (v: boolean) => void;
  /** للتوافق مع الكود القديم. */
  defaultValue?: boolean;
}> = ({ icon, label, value, onChange, defaultValue }) => {
  const t = useTheme();
  // لو value مُرسلة → controlled، وإلا internal state
  const [internalOn, setInternalOn] = React.useState(!!defaultValue);
  const on = value !== undefined ? value : internalOn;
  const handleChange = (v: boolean) => {
    if (onChange) onChange(v);
    else setInternalOn(v);
  };

  return (
    <Card padding={t.spacing.md} elevation="xs">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.rowIcon, { backgroundColor: t.colors.surfaceAlt }]}>{icon}</View>
        <Text variant="body" style={{ flex: 1 }}>{label}</Text>
        <Switch
          value={on}
          onValueChange={handleChange}
          trackColor={{ false: t.colors.borderStrong, true: t.colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  profileCard: { padding: 22, flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatar: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  miniPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  signIn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  signOutIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: '#D4B570',
    borderRadius: 3,
  },
});
