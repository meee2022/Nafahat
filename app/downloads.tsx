/**
 * شاشة إدارة التحميلات - نصوص القرآن المخزّنة + تسجيلات + حذف الكاش.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  ArrowRight, HardDrive, BookOpen, Mic, RefreshCw, Trash2, Database, CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card, Button, ProgressBar } from '@components/ui';
import { useSettingsStore } from '@store/index';
import { SURAHS } from '@data/surahs';
import { arabicNumber } from '@data/surahs';

interface CacheStats {
  surahsCached: number;
  surahsBytes: number;
  otherBytes: number;
  total: number;
}

export default function DownloadsScreen() {
  const t = useTheme();
  const router = useRouter();
  const hydrate = useSettingsStore((s) => s.hydrate);

  const [stats, setStats] = useState<CacheStats>({ surahsCached: 0, surahsBytes: 0, otherBytes: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const computeStats = async () => {
    try {
      setLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      let surahsCached = 0;
      let surahsBytes = 0;
      let otherBytes = 0;
      for (const [k, v] of stores) {
        const size = v?.length ?? 0;
        if (k.startsWith('@nafahat/quran/')) {
          surahsCached++;
          surahsBytes += size;
        } else {
          otherBytes += size;
        }
      }
      setStats({ surahsCached, surahsBytes, otherBytes, total: surahsBytes + otherBytes });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { computeStats(); }, []);

  const mb = (bytes: number) => +(bytes / 1024 / 1024).toFixed(2);
  const totalCached = SURAHS.length;
  const cacheProgress = totalCached > 0 ? stats.surahsCached / totalCached : 0;

  const handleClearQuranCache = () => {
    Alert.alert(
      'حذف نصوص القرآن المخزّنة',
      'سيُحذف الكاش وستحتاج إعادة تحميل النصوص من الإنترنت عند فتح السور.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'احذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const quranKeys = keys.filter((k) => k.startsWith('@nafahat/quran/'));
              await AsyncStorage.multiRemove(quranKeys);
              computeStats();
              hydrate(); // يُحدّث estimatedDownloadsMB
            } catch {}
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'حذف كل الكاش',
      'تحذير: سيُحذف كل شيء عدا التفضيلات والحساب. هل تريد المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'احذف الكل',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              // احفظ الإعدادات والمستخدم
              const preserveKeys = keys.filter((k) =>
                k.startsWith('@nafahat/settings') ||
                k.startsWith('@nafahat/user') ||
                k.startsWith('@nafahat/auth'),
              );
              const removeKeys = keys.filter((k) => !preserveKeys.includes(k));
              await AsyncStorage.multiRemove(removeKeys);
              computeStats();
              hydrate();
            } catch {}
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>إدارة المساحة</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>التحميلات</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 }}>

        {/* بطاقة الإجمالي */}
        <Card padding={t.spacing.lg} elevation="sm" bordered>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={26} color={t.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: t.colors.textSecondary, fontWeight: '600', letterSpacing: 1 }}>المساحة المستخدمة</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: t.colors.textPrimary, marginTop: 2 }}>
                {mb(stats.total)} MB
              </Text>
            </View>
            <Pressable onPress={computeStats} hitSlop={10} disabled={loading}>
              <RefreshCw size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>
        </Card>

        {/* تفاصيل الفئات */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>التفاصيل</Text>

        <Card padding={0} elevation="xs" bordered>
          {/* السور المخزّنة */}
          <View style={[styles.row, { borderBottomColor: t.colors.divider }]}>
            <View style={[styles.rowIcon, { backgroundColor: t.colors.primary + '14' }]}>
              <BookOpen size={20} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: t.colors.textPrimary }]}>نصوص القرآن</Text>
              <Text style={[styles.rowSub, { color: t.colors.textTertiary }]}>
                {arabicNumber(stats.surahsCached)} / {arabicNumber(totalCached)} سورة محمّلة
              </Text>
              <View style={{ marginTop: 8 }}>
                <ProgressBar value={cacheProgress} color={t.colors.primary} height={4} />
              </View>
            </View>
            <Text style={[styles.rowSize, { color: t.colors.textSecondary }]}>{mb(stats.surahsBytes)} MB</Text>
          </View>

          {/* بيانات أخرى */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.rowIcon, { backgroundColor: t.colors.accent + '14' }]}>
              <Database size={20} color={t.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: t.colors.textPrimary }]}>التفضيلات والبيانات</Text>
              <Text style={[styles.rowSub, { color: t.colors.textTertiary }]}>
                الإعدادات، التقدّم، المفضّلة، الإحصائيات
              </Text>
            </View>
            <Text style={[styles.rowSize, { color: t.colors.textSecondary }]}>{mb(stats.otherBytes)} MB</Text>
          </View>
        </Card>

        {/* تسجيلات التسميع - placeholder */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>التسجيلات</Text>
        <Card padding={t.spacing.lg} elevation="xs" bordered style={{ alignItems: 'center' }}>
          <Mic size={32} color={t.colors.textTertiary} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.textPrimary, marginTop: 10 }}>
            لا توجد تسجيلات محفوظة بعد
          </Text>
          <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
            تسجيلات التسميع التي تحفظها ستظهر هنا
          </Text>
        </Card>

        {/* أزرار الإجراءات */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>تنظيف</Text>
        <View style={{ gap: 10 }}>
          <Button
            label="حذف نصوص القرآن المخزّنة"
            iconLeft={<Trash2 size={16} color={t.colors.warning} />}
            variant="outline"
            onPress={handleClearQuranCache}
            fullWidth
            style={{ borderColor: t.colors.warning }}
          />
          <Button
            label="حذف كل الكاش"
            iconLeft={<Trash2 size={16} color={t.colors.error} />}
            variant="outline"
            onPress={handleClearAll}
            fullWidth
            style={{ borderColor: t.colors.error }}
          />
        </View>

        {/* ملاحظة */}
        <View style={[styles.note, { backgroundColor: t.colors.successSurface, borderColor: t.colors.success + '40' }]}>
          <CheckCircle2 size={16} color={t.colors.success} />
          <Text style={{ flex: 1, fontSize: 12, color: t.colors.success, fontWeight: '600', marginStart: 8 }}>
            تفضيلاتك وحسابك آمنة - لن تُحذف عند تنظيف الكاش
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 2 },
  rowSize: { fontSize: 13, fontWeight: '700' },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
});
