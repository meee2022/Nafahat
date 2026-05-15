/**
 * شاشة الختمة - خطط ختم القرآن (رمضان، 30/60/90 يوم).
 * تبدأ بحالة فارغة، ويختار المستخدم خطته الأولى.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Calendar, Moon, BookOpen } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar, Button, EmptyState } from '@components/ui';
import { useStatsStore, useKhatmaStore } from '@store/index';
import { Alert } from 'react-native';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';

type PlanDef = {
  id: string;
  titleKey: 'khatma.plan30' | 'khatma.planRamadan' | 'khatma.plan60' | 'khatma.plan90' | 'khatma.planLast10';
  days: number;
  pages: number;
  accent: string;
  badgeKey?: 'khatma.mostPopular' | 'khatma.intensive';
};

const PLANS: PlanDef[] = [
  { id: '30',  titleKey: 'khatma.plan30',      days: 30,  pages: 21, accent: '#14746F' },
  { id: 'r',   titleKey: 'khatma.planRamadan', days: 29,  pages: 21, accent: '#7C3AED', badgeKey: 'khatma.mostPopular' },
  { id: '60',  titleKey: 'khatma.plan60',      days: 60,  pages: 11, accent: '#0284C7' },
  { id: '90',  titleKey: 'khatma.plan90',      days: 90,  pages: 7,  accent: '#10A37F' },
  { id: '10',  titleKey: 'khatma.planLast10',  days: 10,  pages: 60, accent: '#D97706', badgeKey: 'khatma.intensive' },
];

export default function KhatmaScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const stats = useStatsStore((s) => s.stats);
  const { activePlan, history, startPlan, cancelPlan } = useKhatmaStore();

  // ختمة المستخدم النشطة من المتجر، وإلا تُحسب من الصفحات المقروءة الإجمالية كـ fallback
  const completedKhatmas = history.filter((p) => p.completed).length || Math.floor(stats.pagesRead / 604);
  const currentPages = activePlan?.pagesRead ?? (stats.pagesRead % 604);
  const hasActive = !!activePlan || currentPages > 0;

  const handleStartPlan = () => {
    if (!selectedPlan) return;
    const tmpl = PLANS.find((p) => p.id === selectedPlan);
    if (!tmpl) return;

    // لو في خطة نشطة، نطلب تأكيد قبل الاستبدال
    if (activePlan && !activePlan.completed) {
      Alert.alert(
        'يوجد خطة نشطة',
        `لديك خطة "${activePlan.titleKey ? tr(activePlan.titleKey as any) : 'سابقة'}". هل تريد استبدالها؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'استبدل',
            style: 'destructive',
            onPress: () => {
              cancelPlan();
              startPlan({
                planType: tmpl.id as any,
                titleKey: tmpl.titleKey,
                totalDays: tmpl.days,
                pagesPerDay: tmpl.pages,
              });
              setSelectedPlan(null);
              router.push('/wird');
            },
          },
        ],
      );
      return;
    }

    startPlan({
      planType: tmpl.id as any,
      titleKey: tmpl.titleKey,
      totalDays: tmpl.days,
      pagesPerDay: tmpl.pages,
    });
    setSelectedPlan(null);
    // ننتقل لشاشة الورد لبدء القراءة فوراً
    router.push('/wird');
  };

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={tr('khatma.title')} subtitle={tr('khatma.subtitle')} />

      {/* الختمة النشطة - تظهر فقط إذا قرأ المستخدم صفحات فعلًا */}
      {hasActive ? (
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={[styles.activeCard, { borderRadius: t.radius.xl }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="caption" color="rgba(255,255,255,0.7)">{tr('khatma.activeKhatma')}</Text>
              <Text variant="h2" color="#fff" style={{ marginTop: 2 }}>
                {completedKhatmas > 0 ? `${tr('khatma.khatmaNumber')} ${arabicNumber(completedKhatmas + 1)}` : tr('khatma.firstKhatma')}
              </Text>
            </View>
            <Moon size={36} color="rgba(255,255,255,0.9)" />
          </View>

          <View style={{ marginTop: 18 }}>
            <ProgressBar value={currentPages / 604} color="#fff" trackColor="rgba(255,255,255,0.18)" height={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text variant="caption" color="rgba(255,255,255,0.85)">
                {arabicNumber(currentPages)} / {arabicNumber(604)} {tr('common.page')}
              </Text>
              <Text variant="caption" color="#fff">{Math.round((currentPages / 604) * 100)}%</Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <Card padding={t.spacing.xl} elevation="sm" background={t.colors.primarySoft}>
          <EmptyState
            icon={<BookOpen size={36} color={t.colors.primary} />}
            title={tr('khatma.noActive')}
            description={tr('khatma.noActiveDesc')}
          />
        </Card>
      )}

      {/* اختر خطة جديدة */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('khatma.activePlans')}</Text>

      <View style={{ gap: t.spacing.md }}>
        {PLANS.map((p) => {
          const active = selectedPlan === p.id;
          return (
            <Pressable key={p.id} onPress={() => setSelectedPlan(p.id)}>
              <Card padding={t.spacing.lg} elevation={active ? 'md' : 'xs'} bordered background={active ? p.accent + '0F' : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.planIcon, { backgroundColor: p.accent + '22' }]}>
                    <Calendar size={22} color={p.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text variant="subtitle">{tr(p.titleKey)}</Text>
                      {p.badgeKey ? (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: p.accent + '20' }}>
                          <Text variant="caption" color={p.accent}>{tr(p.badgeKey)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 4 }}>
                      {arabicNumber(p.pages)} {tr('khatma.pagesDaily')} · {arabicNumber(p.days)} {tr('khatma.daysPattern')}
                    </Text>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? p.accent : t.colors.borderStrong }]}>
                    {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.accent }} /> : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Button label={tr('khatma.startPlan')} variant="primary" fullWidth disabled={!selectedPlan} onPress={handleStartPlan} style={{ marginTop: t.spacing.lg }} />

      {/* ختمات سابقة */}
      {completedKhatmas > 0 ? (
        <>
          <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>{tr('khatma.previousKhatmas')}</Text>
          <Card padding={t.spacing.lg} elevation="xs">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Award size={28} color={t.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="subtitle">{arabicNumber(completedKhatmas)} {tr('khatma.khatmaCount')}</Text>
                <Text variant="caption" color={t.colors.textSecondary}>{tr('khatma.completedSuffix')}</Text>
              </View>
              <Text variant="caption" color={t.colors.success}>{tr('khatma.completed')}</Text>
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeCard: { padding: 22 },
  planIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
