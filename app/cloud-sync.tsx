/**
 * شاشة النسخ الاحتياطي السحابي - تفعيل/تعطيل المزامنة + عرض الحالة.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Cloud, CloudOff, CheckCircle2, RefreshCw, Shield, AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card, Button } from '@components/ui';
import { useSettingsStore } from '@store/index';
import { useAuthStore } from '@store/authStore';

export default function CloudSyncScreen() {
  const t = useTheme();
  const router = useRouter();
  const { cloudSyncEnabled, lastCloudSyncAt, setCloudSync, markCloudSynced } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [syncing, setSyncing] = useState(false);

  const handleToggle = (v: boolean) => {
    if (v && !isAuthenticated) {
      Alert.alert(
        'يلزم تسجيل الدخول',
        'لتفعيل المزامنة السحابية، يجب إنشاء حساب أو تسجيل الدخول أولاً.',
        [
          { text: 'لاحقاً', style: 'cancel' },
          { text: 'تسجيل دخول', onPress: () => router.push('/login') },
        ],
      );
      return;
    }
    setCloudSync(v);
    if (v) {
      // محاكاة مزامنة أولى
      setSyncing(true);
      setTimeout(() => {
        markCloudSynced();
        setSyncing(false);
      }, 1200);
    }
  };

  const handleManualSync = () => {
    if (!isAuthenticated) return;
    setSyncing(true);
    setTimeout(() => {
      markCloudSynced();
      setSyncing(false);
    }, 1500);
  };

  const formatLastSync = (ts: number | null): string => {
    if (!ts) return 'لم تتم المزامنة بعد';
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'الآن';
    if (min < 60) return `قبل ${min} دقيقة`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `قبل ${days} يوم`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>المزامنة</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>النسخ الاحتياطي السحابي</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 }}>
        {/* بطاقة الحالة الكبيرة */}
        <Card padding={t.spacing.xl} elevation="sm" bordered style={{ alignItems: 'center' }}>
          <View style={[
            styles.bigIcon,
            { backgroundColor: cloudSyncEnabled ? t.colors.success + '14' : t.colors.surfaceAlt },
          ]}>
            {cloudSyncEnabled ? (
              <Cloud size={42} color={t.colors.success} />
            ) : (
              <CloudOff size={42} color={t.colors.textTertiary} />
            )}
          </View>

          <Text style={[styles.bigTitle, { color: t.colors.textPrimary }]}>
            {cloudSyncEnabled ? 'المزامنة مُفعّلة' : 'المزامنة معطّلة'}
          </Text>

          {cloudSyncEnabled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <CheckCircle2 size={14} color={t.colors.success} />
              <Text style={{ fontSize: 13, color: t.colors.textSecondary }}>
                {syncing ? 'جارٍ المزامنة...' : `آخر مزامنة: ${formatLastSync(lastCloudSyncAt)}`}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: t.colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
              فعّل المزامنة لحفظ تقدّمك على كل أجهزتك
            </Text>
          )}

          {/* المفتاح */}
          <View style={[styles.toggleRow, { backgroundColor: t.colors.surfaceAlt, marginTop: 18 }]}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.textPrimary, flex: 1 }}>
              تفعيل المزامنة
            </Text>
            <Switch
              value={cloudSyncEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: t.colors.borderStrong, true: t.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {cloudSyncEnabled && isAuthenticated ? (
            <Button
              label={syncing ? 'جارٍ المزامنة...' : 'مزامنة الآن'}
              iconLeft={<RefreshCw size={16} color={t.colors.onPrimary} />}
              onPress={handleManualSync}
              loading={syncing}
              fullWidth
              style={{ marginTop: 14 }}
            />
          ) : null}
        </Card>

        {/* تنبيه عدم تسجيل الدخول */}
        {!isAuthenticated ? (
          <Card padding={t.spacing.lg} elevation="xs" bordered background={t.colors.warningSurface} style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={18} color={t.colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.warning }}>أنت تستخدم التطبيق كزائر</Text>
                <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 4 }}>
                  للمزامنة بين أجهزتك، يجب إنشاء حساب أولاً.
                </Text>
                <Pressable onPress={() => router.push('/register')} style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.warning }}>
                    إنشاء حساب الآن  ←
                  </Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ) : null}

        {/* ما الذي تتم مزامنته */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>ما الذي يُحفَظ سحابياً</Text>
        <Card padding={0} elevation="xs" bordered>
          <SyncItem icon="📖" label="تقدّم القراءة والختمات" />
          <SyncItem icon="🧠" label="خطط الحفظ ومراجعاتك" />
          <SyncItem icon="⭐" label="الآيات المفضّلة والمرجعية" />
          <SyncItem icon="📝" label="ملاحظاتك وتدبّراتك" />
          <SyncItem icon="🏆" label="الإنجازات والشارات" />
          <SyncItem icon="🎯" label="نقاط الاختبارات" last />
        </Card>

        {/* ضمان الخصوصية */}
        <Card padding={t.spacing.lg} elevation="xs" bordered style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={[styles.shieldIcon, { backgroundColor: t.colors.success + '14' }]}>
              <Shield size={20} color={t.colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.textPrimary }}>خصوصيتك أمانة</Text>
              <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                بياناتك مشفّرة بالكامل أثناء النقل والتخزين. لا نشارك معلوماتك مع أي طرف ثالث.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const SyncItem: React.FC<{ icon: string; label: string; last?: boolean }> = ({ icon, label, last }) => {
  const t = useTheme();
  return (
    <View style={[
      styles.syncRow,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider },
    ]}>
      <Text style={{ fontSize: 20, marginEnd: 14 }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.colors.textPrimary }}>{label}</Text>
      <CheckCircle2 size={16} color={t.colors.success} />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  bigIcon: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  bigTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  shieldIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
