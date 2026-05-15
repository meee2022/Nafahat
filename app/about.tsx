/**
 * شاشة "عن نَفَحات" - معلومات التطبيق، الإصدار، الفريق، الروابط.
 * 📝 لتعديل البريد/الموقع/GitHub/الشروط - عدّل ملف src/config/appInfo.ts
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, Heart, Star, Share2, Mail, Globe, Github, Shield, FileText, Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui';
import { useT } from '@store/languageStore';
import { APP_INFO, getCopyrightYear } from '../src/config/appInfo';

export default function AboutScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  const handleShareApp = async () => {
    try {
      await Share.share({ message: APP_INFO.shareMessage });
    } catch {}
  };

  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>عن التطبيق</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{APP_INFO.name}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>

        {/* بطاقة هوية */}
        <LinearGradient
          colors={[t.colors.primary, t.colors.primaryDark]}
          style={styles.heroCard}
        >
          <View style={[styles.heroLogo, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Sparkles size={36} color="#FBF7EA" />
          </View>
          <Text style={[styles.heroAppName, { fontFamily: t.fontFamilies.arabicQuran }]}>{APP_INFO.name}</Text>
          <Text style={styles.heroTagline}>{APP_INFO.tagline}</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>الإصدار {APP_INFO.version}  ·  build {APP_INFO.build}</Text>
          </View>
        </LinearGradient>

        {/* ميزات */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>ماذا يقدّم {APP_INFO.name}</Text>
        <Card padding={t.spacing.lg} elevation="xs" bordered style={{ gap: 14 }}>
          <FeatureRow icon="📖" title="مصحف كامل" desc="القرآن الكريم برسم عثماني مع تشكيل" />
          <FeatureRow icon="🧠" title="نظام حفظ ذكي" desc="جدولة المراجعة بالتكرار المتباعد (SRS)" />
          <FeatureRow icon="🎙️" title="تسميع وقياس" desc="سجّل تلاوتك واحصل على تقييم" />
          <FeatureRow icon="🎧" title="مكتبة قرّاء" desc="مئات القراء من مختلف المدارس" />
          <FeatureRow icon="🎯" title="اختبارات تفاعلية" desc="بأسلوب Duolingo لتثبيت معلوماتك" />
          <FeatureRow icon="🌙" title="٣ لغات" desc="عربي، إنجليزي، فرنسي + ٧ لغات جزئية" />
        </Card>

        {/* روابط مفيدة */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>اتصل بنا</Text>
        <Card padding={0} elevation="xs" bordered>
          <ActionRow
            icon={<Star size={18} color="#FBB040" />}
            label="قيّم التطبيق"
            sub="ساعدنا بتقييمك على المتجر"
            onPress={() => openLink(APP_INFO.appStoreUrl)}
            divider
          />
          <ActionRow
            icon={<Share2 size={18} color={t.colors.primary} />}
            label="شارك مع أصدقائك"
            sub="انشر الخير بمشاركة التطبيق"
            onPress={handleShareApp}
            divider={!!APP_INFO.supportEmail || !!APP_INFO.website || !!APP_INFO.githubUrl}
          />
          {APP_INFO.supportEmail ? (
            <ActionRow
              icon={<Mail size={18} color={t.colors.info} />}
              label="راسلنا"
              sub={APP_INFO.supportEmail}
              onPress={() => openLink(`mailto:${APP_INFO.supportEmail}`)}
              divider={!!APP_INFO.website || !!APP_INFO.githubUrl}
            />
          ) : null}
          {APP_INFO.website ? (
            <ActionRow
              icon={<Globe size={18} color={t.colors.accent} />}
              label="موقعنا الإلكتروني"
              sub={APP_INFO.website}
              onPress={() => openLink(`https://${APP_INFO.website}`)}
              divider={!!APP_INFO.githubUrl}
            />
          ) : null}
          {APP_INFO.githubUrl ? (
            <ActionRow
              icon={<Github size={18} color={t.colors.textPrimary} />}
              label="مصدر مفتوح على GitHub"
              sub={APP_INFO.githubLabel}
              onPress={() => openLink(APP_INFO.githubUrl)}
            />
          ) : null}
        </Card>

        {/* قانوني */}
        {APP_INFO.termsUrl || APP_INFO.privacyUrl ? (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>الشروط والخصوصية</Text>
            <Card padding={0} elevation="xs" bordered>
              {APP_INFO.termsUrl ? (
                <ActionRow
                  icon={<FileText size={18} color={t.colors.textSecondary} />}
                  label="شروط الاستخدام"
                  onPress={() => openLink(APP_INFO.termsUrl)}
                  divider={!!APP_INFO.privacyUrl}
                />
              ) : null}
              {APP_INFO.privacyUrl ? (
                <ActionRow
                  icon={<Shield size={18} color={t.colors.textSecondary} />}
                  label="سياسة الخصوصية"
                  onPress={() => openLink(APP_INFO.privacyUrl)}
                />
              ) : null}
            </Card>
          </>
        ) : null}

        {/* بصمة */}
        <View style={styles.footer}>
          {/* بطاقة إهداء الصدقة الجارية - مع الوالدين والدعاء العام */}
          {APP_INFO.charityDedication ? (
            <View style={[styles.charityCard, { borderColor: t.colors.borderGold, backgroundColor: t.colors.accent + '0A' }]}>
              {/* معيّن علوي */}
              <View style={[styles.charityDiamond, { borderColor: t.colors.accent }]} />

              {/* العنوان الرئيسي */}
              <Text style={[styles.charityTitle, { color: t.colors.accent }]}>
                {APP_INFO.charityDedication.title}
              </Text>

              {/* خط فاصل */}
              <View style={[styles.charityDivider, { backgroundColor: t.colors.accent + '40' }]} />

              {/* قسم الوالدين */}
              <View style={styles.dedicSection}>
                <View style={styles.dedicRow}>
                  <Text style={[styles.dedicArrow, { color: t.colors.accent }]}>▸</Text>
                  <Text style={[styles.dedicLabel, { color: t.colors.textPrimary }]}>
                    {APP_INFO.charityDedication.parents.label}: {APP_INFO.charityDedication.parents.names}
                  </Text>
                </View>
                <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                  {APP_INFO.charityDedication.parents.prayer}
                </Text>
              </View>

              {/* قسم العموم */}
              <View style={styles.dedicSection}>
                <View style={styles.dedicRow}>
                  <Text style={[styles.dedicArrow, { color: t.colors.accent }]}>▸</Text>
                  <Text style={[styles.dedicLabel, { color: t.colors.textPrimary }]}>
                    {APP_INFO.charityDedication.general.title}
                  </Text>
                </View>
                <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                  {APP_INFO.charityDedication.general.scope}
                </Text>
                <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                  {APP_INFO.charityDedication.general.deceasedPrayer}
                </Text>
                <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                  {APP_INFO.charityDedication.general.livingPrayer}
                </Text>
              </View>

              {/* خط فاصل */}
              <View style={[styles.charityDivider, { backgroundColor: t.colors.accent + '40' }]} />

              {/* الحديث الشريف */}
              <Text style={[styles.charityHadith, { color: t.colors.textSecondary }]}>
                «إذا مات الإنسان انقطع عمله إلا من ثلاث: صدقة جارية، أو علم يُنتفع به، أو ولد صالح يدعو له»
              </Text>

              {/* معيّن سفلي */}
              <View style={[styles.charityDiamond, { borderColor: t.colors.accent }]} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.footerText, { color: t.colors.textTertiary }]}>صُنع بـ</Text>
            <Heart size={12} color="#E11D48" fill="#E11D48" />
            <Text style={[styles.footerText, { color: t.colors.textTertiary }]}>{APP_INFO.madeWithSuffix}</Text>
          </View>
          <Text style={[styles.footerText, { color: t.colors.textTertiary, marginTop: 6 }]}>
            © {getCopyrightYear()} {APP_INFO.name}. جميع الحقوق محفوظة.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const FeatureRow: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 2 }}>{desc}</Text>
      </View>
    </View>
  );
};

const ActionRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onPress?: () => void;
  divider?: boolean;
}> = ({ icon, label, sub, onPress, divider }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent',
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: t.colors.divider,
        },
      ]}
    >
      <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.textPrimary }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 11, color: t.colors.textTertiary, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  heroCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroLogo: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroAppName: { fontSize: 38, fontWeight: '800', color: '#FBF7EA' },
  heroTagline: { fontSize: 13, color: 'rgba(251,247,234,0.85)', marginTop: 6 },
  versionPill: {
    marginTop: 14,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
  },
  versionText: { color: '#FBF7EA', fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  sectionTitle: {
    fontSize: 17, fontWeight: '700',
    marginTop: 28, marginBottom: 12,
  },

  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 11, fontWeight: '500' },
  charityCard: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 6,
    width: '100%',
    gap: 14,
  },
  charityDiamond: {
    width: 8,
    height: 8,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  charityTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  charityDivider: {
    width: 60,
    height: 1,
    opacity: 0.7,
  },
  dedicSection: {
    width: '100%',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
  },
  dedicRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dedicArrow: {
    fontSize: 14,
    fontWeight: '900',
  },
  dedicLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 22,
    flexShrink: 1,
    textAlign: 'right',
  },
  dedicPrayer: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'right',
    paddingRight: 22,
    width: '100%',
  },
  charityHadith: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
});
