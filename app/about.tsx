/**
 * شاشة "عن نَفَحات" - معلومات التطبيق، الإصدار، الفريق، الروابط.
 * 📝 لتعديل البريد/الموقع/GitHub/الشروط - عدّل ملف src/config/appInfo.ts
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Heart, Star, Share2, Mail, Globe, Github, Shield, FileText, Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui';
import { useT } from '@store/languageStore';
import { useAppInfo, getCopyrightYearFromInfo } from '@store/appConfigStore';

export default function AboutScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const APP_INFO = useAppInfo();
  const getCopyrightYear = () => getCopyrightYearFromInfo(APP_INFO);

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
          <Text style={[styles.topTitle, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran, fontWeight: '500' }]}>{APP_INFO.name}</Text>
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

        {/* قانوني - يستخدم الصفحات الداخلية لو الرابط فاضي، خارجي لو محدّد */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>الشروط والخصوصية</Text>
        <Card padding={0} elevation="xs" bordered>
          <ActionRow
            icon={<FileText size={18} color={t.colors.textSecondary} />}
            label="شروط الاستخدام"
            onPress={() => {
              if (APP_INFO.termsUrl) openLink(APP_INFO.termsUrl);
              else router.push('/terms');
            }}
            divider
          />
          <ActionRow
            icon={<Shield size={18} color={t.colors.textSecondary} />}
            label="سياسة الخصوصية"
            onPress={() => {
              if (APP_INFO.privacyUrl) openLink(APP_INFO.privacyUrl);
              else router.push('/privacy');
            }}
          />
        </Card>

        {/* بصمة */}
        <View style={styles.footer}>
          {/* بطاقة إهداء الصدقة الجارية - مع الوالدين والدعاء العام */}
          {APP_INFO.charityDedication ? (
            <View style={[styles.charityCard, { borderColor: t.colors.accent + '55', backgroundColor: t.colors.accent + '0E' }]}>
              {/* إطار داخلي مزدوج */}
              <View pointerEvents="none" style={[styles.charityInnerFrame, { borderColor: t.colors.accent + '30' }]} />

              {/* معيّن علوي مع خطوط جانبية */}
              <View style={styles.crownRow}>
                <View style={[styles.crownLine, { backgroundColor: t.colors.accent + '50' }]} />
                <View style={[styles.charityDiamond, { borderColor: t.colors.accent, backgroundColor: t.colors.accent + '20' }]} />
                <View style={[styles.crownLine, { backgroundColor: t.colors.accent + '50' }]} />
              </View>

              {/* العنوان الرئيسي */}
              <Text style={[styles.charityTitle, { color: t.colors.accent }]}>
                {APP_INFO.charityDedication.title}
              </Text>

              {/* خط فاصل ذهبي بنقطة وسط */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: t.colors.accent }]} />
                <View style={[styles.dividerDot, { backgroundColor: t.colors.accent }]} />
                <View style={[styles.dividerLine, { backgroundColor: t.colors.accent }]} />
              </View>

              {/* قسم الوالدين */}
              <View style={styles.dedicSection}>
                <View style={styles.dedicHeader}>
                  <Text style={[styles.dedicLabel, { color: t.colors.textPrimary }]}>
                    <Text style={{ color: t.colors.accent, fontWeight: '900' }}>◂ </Text>
                    {APP_INFO.charityDedication.parents.label}: <Text style={{ color: t.colors.accent }}>{APP_INFO.charityDedication.parents.names}</Text>
                  </Text>
                </View>
                <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                  {APP_INFO.charityDedication.parents.prayer}
                </Text>
              </View>

              {/* قسم المتوفّين بالاسم */}
              {APP_INFO.charityDedication.deceased ? (
                <View style={styles.dedicSection}>
                  <View style={styles.dedicHeader}>
                    <Text style={[styles.dedicLabel, { color: t.colors.textPrimary }]}>
                      <Text style={{ color: t.colors.accent, fontWeight: '900' }}>◂ </Text>
                      {APP_INFO.charityDedication.deceased.label}: <Text style={{ color: t.colors.accent }}>{APP_INFO.charityDedication.deceased.names}</Text>
                    </Text>
                  </View>
                  <Text style={[styles.dedicPrayer, { color: t.colors.textSecondary }]}>
                    {APP_INFO.charityDedication.deceased.prayer}
                  </Text>
                </View>
              ) : null}

              {/* قسم العموم */}
              <View style={styles.dedicSection}>
                <View style={styles.dedicHeader}>
                  <Text style={[styles.dedicLabel, { color: t.colors.textPrimary }]}>
                    <Text style={{ color: t.colors.accent, fontWeight: '900' }}>◂ </Text>
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
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: t.colors.accent + '70' }]} />
                <View style={[styles.dividerDot, { backgroundColor: t.colors.accent + '70' }]} />
                <View style={[styles.dividerLine, { backgroundColor: t.colors.accent + '70' }]} />
              </View>

              {/* الحديث الشريف */}
              <Text style={[styles.charityHadith, { color: t.colors.textSecondary }]}>
                «إذا مات الإنسان انقطع عمله إلا من ثلاث: صدقة جارية، أو علم يُنتفع به، أو ولد صالح يدعو له»
              </Text>

              {/* معيّن سفلي */}
              <View style={styles.crownRow}>
                <View style={[styles.crownLine, { backgroundColor: t.colors.accent + '50' }]} />
                <View style={[styles.charityDiamond, { borderColor: t.colors.accent, backgroundColor: t.colors.accent + '20' }]} />
                <View style={[styles.crownLine, { backgroundColor: t.colors.accent + '50' }]} />
              </View>
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
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: 28,
    paddingVertical: 30,
    marginBottom: 22,
    borderWidth: 1.5,
    borderRadius: 8,
    gap: 18,
    alignItems: 'center',
    position: 'relative',
  },
  charityInnerFrame: {
    position: 'absolute',
    top: 8, bottom: 8, left: 8, right: 8,
    borderWidth: 0.5,
    borderRadius: 4,
  },
  crownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '70%',
    justifyContent: 'center',
  },
  crownLine: {
    flex: 1,
    height: 1,
  },
  charityDiamond: {
    width: 10,
    height: 10,
    borderWidth: 1.2,
    transform: [{ rotate: '45deg' }],
  },
  charityTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dedicSection: {
    width: '100%',
    gap: 6,
    paddingHorizontal: 6,
  },
  dedicHeader: {
    width: '100%',
  },
  dedicLabel: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dedicPrayer: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingRight: 18,
    width: '100%',
  },
  charityHadith: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    paddingHorizontal: 10,
    writingDirection: 'rtl',
  },
});
