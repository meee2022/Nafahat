/**
 * شاشة الختمة - خطط ختم القرآن (رمضان، 30/60/90 يوم).
 * تبدأ بحالة فارغة، ويختار المستخدم خطته الأولى.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Calendar, Moon, BookOpen } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar, Button, EmptyState } from '@components/ui';
import { useStatsStore, useKhatmaStore } from '@store/index';
import { Alert } from 'react-native';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';

const EMERALD = '#0A3D38';
const GOLD    = '#B8923B';

type PlanDef = {
  id: string;
  titleKey: 'khatma.plan30' | 'khatma.planRamadan' | 'khatma.plan60' | 'khatma.plan90' | 'khatma.planLast10';
  days: number;
  pages: number;
  accent: string;
  badgeKey?: 'khatma.mostPopular' | 'khatma.intensive';
};

const PLANS: PlanDef[] = [
  { id: '30',  titleKey: 'khatma.plan30',      days: 30,  pages: 21, accent: EMERALD },
  { id: 'r',   titleKey: 'khatma.planRamadan', days: 29,  pages: 21, accent: GOLD, badgeKey: 'khatma.mostPopular' },
  { id: '60',  titleKey: 'khatma.plan60',      days: 60,  pages: 11, accent: '#2D6A4F' },
  { id: '90',  titleKey: 'khatma.plan90',      days: 90,  pages: 7,  accent: '#74C69D' },
  { id: '10',  titleKey: 'khatma.planLast10',  days: 10,  pages: 60, accent: '#E11D48', badgeKey: 'khatma.intensive' },
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
          colors={[EMERALD, '#062623']}
          style={[styles.activeCard, {
            borderRadius: t.radius.xl,
            borderWidth: 1.5,
            borderColor: GOLD,
            overflow: 'hidden',
            position: 'relative'
          }]}
        >
          {/* Decorative radial ambient gold glow in background */}
          <View pointerEvents="none" style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: 'rgba(184, 146, 59, 0.15)',
          }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                {tr('khatma.activeKhatma')}
              </Text>
              <Text variant="h2" style={{ color: '#fff', marginTop: 4, fontWeight: '800' }}>
                {completedKhatmas > 0 ? `${tr('khatma.khatmaNumber')} ${arabicNumber(completedKhatmas + 1)}` : tr('khatma.firstKhatma')}
              </Text>
              
              {activePlan && (
                <Text style={{ fontSize: 13, color: GOLD, marginTop: 4, fontWeight: '700' }}>
                  {tr(activePlan.titleKey as any)}
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <BookOpen size={13} color="rgba(255,255,255,0.7)" />
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
                  {arabicNumber(currentPages)} / {arabicNumber(604)} {tr('common.page')}
                </Text>
              </View>
            </View>

            {/* Concentric Progress Ring */}
            <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={90} height={90}>
                <Circle
                  cx={45}
                  cy={45}
                  r={38}
                  stroke="rgba(184, 146, 59, 0.15)"
                  strokeWidth={6}
                  fill="transparent"
                />
                <Circle
                  cx={45}
                  cy={45}
                  r={38}
                  stroke={GOLD}
                  strokeWidth={6}
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 - (Math.min(604, currentPages) / 604) * (2 * Math.PI * 38)}
                  strokeLinecap="round"
                  fill="transparent"
                  transform="rotate(-90 45 45)"
                />
              </Svg>
              <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: GOLD }}>
                  {Math.round((currentPages / 604) * 100)}%
                </Text>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: -2, fontWeight: '700' }}>
                  مكتمل
                </Text>
              </View>
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
