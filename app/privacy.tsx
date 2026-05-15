/**
 * شاشة سياسة الخصوصية - شفافة وودودة، تشرح ماذا نجمع وماذا لا.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Shield, Lock, Eye, EyeOff, Database, Cloud, Bell } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card } from '@components/ui';
import { useAppInfo, getCopyrightYearFromInfo } from '@store/appConfigStore';

export default function PrivacyScreen() {
  const t = useTheme();
  const router = useRouter();
  const APP_INFO = useAppInfo();
  const year = getCopyrightYearFromInfo(APP_INFO);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/about');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>قانوني</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>سياسة الخصوصية</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 }}>

        {/* أيقونة رئيسية */}
        <View style={styles.heroIconWrap}>
          <View style={[styles.heroIcon, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40' }]}>
            <Shield size={28} color={t.colors.accent} strokeWidth={1.6} />
          </View>
          <Text style={[styles.lastUpdate, { color: t.colors.textTertiary }]}>
            آخر تحديث: مايو {year}
          </Text>
        </View>

        {/* مقدمة - وعد الخصوصية */}
        <Card padding={18} elevation="xs" bordered style={{ marginBottom: 18 }}>
          <Text style={[styles.intro, { color: t.colors.textPrimary }]}>
            خصوصيتك أمانة. تطبيق <Text style={{ color: t.colors.accent, fontWeight: '800' }}>{APP_INFO.name}</Text> صدقة
            جارية بُنيت لخدمتك في علاقتك بكتاب الله - لا نبيع بياناتك، لا نتتبّعك، ولا نعرض عليك إعلانات.
          </Text>
        </Card>

        {/* بطاقات سريعة - وعود الخصوصية */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          <PromiseCard
            icon={<EyeOff size={18} color={t.colors.success} />}
            title="بدون تتبّع"
            desc="لا نسجّل سلوكك للإعلانات"
            color={t.colors.success}
          />
          <PromiseCard
            icon={<Lock size={18} color={t.colors.info} />}
            title="بياناتك محليّة"
            desc="مخزّنة على جهازك أولاً"
            color={t.colors.info}
          />
          <PromiseCard
            icon={<Shield size={18} color={t.colors.accent} />}
            title="بدون بيع"
            desc="لا نبيع أي معلومة عنك"
            color={t.colors.accent}
          />
          <PromiseCard
            icon={<Database size={18} color={t.colors.featureLapis} />}
            title="شفافيّة كاملة"
            desc="الكود مفتوح المصدر"
            color={t.colors.featureLapis}
          />
        </View>

        {/* الأقسام التفصيلية */}
        <Section icon={<Database size={18} color={t.colors.accent} />} title="ما الذي نحفظه؟">
          <Bullet>
            <Text style={{ fontWeight: '800' }}>الإعدادات والتفضيلات:</Text> لغتك، خط القرآن المفضّل، الوضع الليلي،
            الإشعارات. كل ده محلياً على جهازك.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>تقدّمك:</Text> آخر آية قرأتها، مفضّلاتك، ملاحظاتك، خطّة الحفظ.
            تُحفظ في الجهاز.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>الحساب (اختياري):</Text> الاسم والبريد لتسجيل الدخول. لا نطلب
            رقم هاتف أو معلومات بنكية أبداً.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>الموقع الجغرافي (اختياري):</Text> لحساب أوقات الصلاة والقبلة فقط -
            مايخرجش من جهازك.
          </Bullet>
        </Section>

        <Section icon={<EyeOff size={18} color={t.colors.error} />} title="ما الذي لا نحفظه؟">
          <Bullet>سجلّ التصفّح أو الصفحات اللي قرأتها بشكل تفصيلي.</Bullet>
          <Bullet>قائمة جهات الاتصال أو الرسائل في جهازك.</Bullet>
          <Bullet>أي بصمة جهاز (fingerprint) أو معرّف إعلاني.</Bullet>
          <Bullet>الصور أو الميديا من معرضك.</Bullet>
          <Bullet>أرقام البطاقات أو معلومات الدفع - مش بنحتاجها أصلاً.</Bullet>
        </Section>

        <Section icon={<Cloud size={18} color={t.colors.info} />} title="المزامنة السحابية (Convex)">
          <Bullet>
            المزامنة <Text style={{ fontWeight: '800' }}>اختيارية تماماً</Text>. لو ما فعّلتهاش، بياناتك مايخرجوش
            من جهازك أبداً.
          </Bullet>
          <Bullet>
            لو فعّلتها: نُرسل المفضّلات، الملاحظات، وتقدّم الحفظ بشكل مشفّر إلى خادم Convex لربط حسابك بين أجهزتك.
          </Bullet>
          <Bullet>تقدر تعطّل المزامنة في أي وقت من <Text style={{ fontWeight: '800' }}>حسابي ← الإعدادات</Text>.</Bullet>
        </Section>

        <Section icon={<Database size={18} color={t.colors.featureLapis} />} title="مصادر طرف ثالث">
          <Bullet>
            <Text style={{ fontWeight: '800' }}>AlQuran.cloud / Quran.com:</Text> نجلب نصّ القرآن والتفاسير منها.
            ما نُرسل لها أي بيانات شخصية.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>mp3quran.net:</Text> مصدر تلاوات القرّاء. الاتصال مباشر منك للسيرفر،
            ما يعرف منك إلا الـ IP العام (زي أي موقع بتفتحه).
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>Aladhan API:</Text> لحساب التقويم الهجري بدقّة.
          </Bullet>
        </Section>

        <Section icon={<Bell size={18} color={t.colors.warning} />} title="الإشعارات">
          <Bullet>الإشعارات اختياريّة - تقدر تفعّل/تعطّل أي نوع.</Bullet>
          <Bullet>تتضمّن: أوقات الصلاة، تذكير الأذكار، تذكير الورد اليومي.</Bullet>
          <Bullet>كل المعالجة محلياً على جهازك - مفيش push notifications من سيرفر يعرف موقعك.</Bullet>
        </Section>

        <Section icon={<Lock size={18} color={t.colors.success} />} title="حقوقك">
          <Bullet>
            <Text style={{ fontWeight: '800' }}>الوصول:</Text> كل بياناتك ظاهرة في حسابك.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>التعديل:</Text> تقدر تعدّل أي حاجة في "حسابي ← الملف".
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>الحذف:</Text> حذف حسابك يمحو بياناتك من السحابة كمان.
          </Bullet>
          <Bullet>
            <Text style={{ fontWeight: '800' }}>التصدير:</Text> ابعتلنا بريد ونرسل لك نسخة كاملة من بياناتك.
          </Bullet>
        </Section>

        <Section icon={<Eye size={18} color={t.colors.textSecondary} />} title="الأطفال">
          <Bullet>التطبيق مناسب لكل الأعمار - أطفال وكبار.</Bullet>
          <Bullet>لا نجمع أي بيانات إضافية من الأطفال.</Bullet>
          <Bullet>ننصح بمراقبة الوالدين عند استخدام الأطفال للحساب.</Bullet>
        </Section>

        <Section icon={<Shield size={18} color={t.colors.accent} />} title="تعديل السياسة">
          <Bullet>قد نُحدّث هذه السياسة لتوضيح أو إضافة معلومات - ولن نقلّل أبداً من حماية خصوصيتك.</Bullet>
          <Bullet>التحديثات الكبيرة نُعلِم بها داخل التطبيق.</Bullet>
        </Section>

        {/* بطاقة التواصل */}
        {(APP_INFO.supportEmail || APP_INFO.website) ? (
          <Card padding={18} elevation="xs" bordered background={t.colors.accent + '08'} style={{ marginTop: 6 }}>
            <Text style={[styles.contactTitle, { color: t.colors.textPrimary }]}>عندك سؤال؟</Text>
            <Text style={[styles.contactBody, { color: t.colors.textSecondary }]}>
              {APP_INFO.supportEmail ? `راسلنا: ${APP_INFO.supportEmail}\n` : ''}
              {APP_INFO.website ? `موقعنا: ${APP_INFO.website}` : ''}
            </Text>
          </Card>
        ) : null}

        {/* خاتمة - دعاء */}
        <View style={[styles.duaCard, { borderColor: t.colors.accent + '40', backgroundColor: t.colors.accent + '08' }]}>
          <View style={[styles.duaDiamond, { borderColor: t.colors.accent }]} />
          <Text style={[styles.duaText, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}>
            «إِنَّ ٱللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا»
          </Text>
          <Text style={[styles.duaRef, { color: t.colors.textSecondary }]}>سورة النساء - الآية ١</Text>
          <View style={[styles.duaDiamond, { borderColor: t.colors.accent }]} />
        </View>

        <Text style={[styles.footer, { color: t.colors.textTertiary }]}>
          © {year} {APP_INFO.name}. خصوصيتك أمانة.
        </Text>
      </ScrollView>
    </View>
  );
}

const PromiseCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string }> = ({ icon, title, desc, color }) => {
  const t = useTheme();
  return (
    <View
      style={[
        styles.promiseCard,
        { backgroundColor: color + '0E', borderColor: color + '30' },
      ]}
    >
      <View style={[styles.promiseIcon, { backgroundColor: color + '18' }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.promiseTitle, { color }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.promiseDesc, { color: t.colors.textSecondary }]} numberOfLines={2}>{desc}</Text>
      </View>
    </View>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: t.colors.accent + '14' }]}>
          {icon}
        </View>
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>{title}</Text>
      </View>
      <View style={styles.bulletsWrap}>
        {children}
      </View>
    </View>
  );
};

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: t.colors.accent }]} />
      <Text style={[styles.bulletText, { color: t.colors.textSecondary }]}>
        {children}
      </Text>
    </View>
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

  heroIconWrap: { alignItems: 'center', marginBottom: 20 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  lastUpdate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.3,
  },

  intro: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // بطاقات الوعود
  promiseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
  },
  promiseIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  promiseDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
    lineHeight: 15,
  },

  // الأقسام
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bulletsWrap: {
    paddingRight: 46,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // بطاقة التواصل
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  contactBody: {
    fontSize: 12,
    lineHeight: 20,
  },

  // الدعاء
  duaCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 6,
    borderWidth: 1,
  },
  duaDiamond: {
    width: 8, height: 8,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  duaText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  duaRef: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  footer: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 10,
  },
});
