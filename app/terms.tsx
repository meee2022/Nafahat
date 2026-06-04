/**
 * شاشة شروط الاستخدام - صفحة قانونية لتطبيق نَفَحات.
 * المحتوى مكتوب باللغة العربية ومُهيّأ لسياق التطبيق (مصحف ذكي مجاني).
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, FileText } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card } from '@components/ui';
import { useAppInfo, getCopyrightYearFromInfo } from '@store/appConfigStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function TermsScreen() {
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
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>شروط الاستخدام</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 }}>

        {/* أيقونة رئيسية */}
        <View style={styles.heroIconWrap}>
          <View style={[styles.heroIcon, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40' }]}>
            <FileText size={28} color={t.colors.accent} strokeWidth={1.6} />
          </View>
          <Text style={[styles.lastUpdate, { color: t.colors.textTertiary }]}>
            آخر تحديث: مايو {year}
          </Text>
        </View>

        {/* مقدمة */}
        <Card padding={18} elevation="xs" bordered style={{ marginBottom: 18 }}>
          <Text style={[styles.intro, { color: t.colors.textPrimary }]}>
            أهلاً بك في تطبيق <Text style={{ color: t.colors.accent, fontWeight: '800' }}>{APP_INFO.name}</Text> -
            صحبة دائمة مع القرآن الكريم. باستخدامك لهذا التطبيق فأنت توافق على الشروط التالية.
          </Text>
        </Card>

        {/* الأقسام */}
        <Section index="1" title="قبول الشروط">
          باستخدامك لتطبيق {APP_INFO.name} - سواء تصفّحت محتواه أو سجّلت حساباً - فأنت تقرّ بأنك قرأت
          هذه الشروط وفهمتها ووافقت على الالتزام بها. إذا كنت غير موافق على أيٍّ منها، يُرجى عدم استخدام التطبيق.
        </Section>

        <Section index="2" title="طبيعة التطبيق">
          • التطبيق <Text style={{ fontWeight: '800' }}>مجاني بالكامل</Text> ومُقدَّم كصدقة جارية يبتغي بها صانعه وجه الله الكريم.{'\n'}
          • محتواه يشمل: المصحف الشريف، أوقات الصلاة، الأذكار، الأدعية، التجويد، الحفظ، ومكتبة قرّاء.{'\n'}
          • نص القرآن مصدره مفتوح من مصادر موثوقة (AlQuran.cloud / Quran.com).{'\n'}
          • تلاوات القرّاء من موقع mp3quran.net المفتوح للاستخدام الديني.
        </Section>

        <Section index="3" title="الاستخدام المسموح">
          • القراءة، الاستماع، الحفظ، والمراجعة الشخصية للقرآن الكريم.{'\n'}
          • مشاركة التطبيق مع الأقارب والأصدقاء بقصد الخير.{'\n'}
          • النسخ من النص القرآني للاستخدام الشخصي أو الإفادة العلمية.{'\n'}
          • استخدام الميزات التفاعلية (الاختبارات، التسميع، تتبّع الحفظ) لتطوير علاقتك بكتاب الله.
        </Section>

        <Section index="4" title="الاستخدام غير المسموح">
          • أيّ تحريف أو تعديل لنص القرآن الكريم.{'\n'}
          • استخدام التطبيق لأغراض تجارية دون إذن.{'\n'}
          • محاولة اختراق التطبيق أو سرقة بيانات المستخدمين.{'\n'}
          • نشر محتوى مسيء أو مخالف لتعاليم الإسلام في الميزات الاجتماعية إن وُجدت.
        </Section>

        <Section index="5" title="الحساب والبيانات">
          • تسجيل الحساب اختياري - يمكنك الاستخدام كزائر.{'\n'}
          • مسؤولية الحفاظ على كلمة السر تقع عليك.{'\n'}
          • بياناتك (المفضّلات، التقدّم، الملاحظات) تُحفظ محلياً على جهازك.{'\n'}
          • إذا فعّلت المزامنة السحابية، تُنقل بياناتك مشفّرة لخدمة Convex.
        </Section>

        <Section index="6" title="الملكية الفكرية">
          • محتوى القرآن الكريم ليس ملكاً لأحد - هو للأمّة كلّها.{'\n'}
          • تصميم التطبيق، الواجهة، الكود البرمجي، والرسومات الأصلية محمية بحقوق الصانع.{'\n'}
          • التطبيق <Text style={{ fontWeight: '800' }}>مفتوح المصدر</Text> - يمكنك الاطلاع على الكود والمساهمة على GitHub.
        </Section>

        <Section index="7" title="حدود المسؤولية">
          • نسعى للدقّة في كل ما يُعرض من نصوص قرآنية وأدعية وأحاديث.{'\n'}
          • في حال اكتشاف أي خطأ، يُرجى التواصل معنا فوراً وسنُصلحه.{'\n'}
          • التطبيق لا يقدّم فتاوى شرعية - راجع أهل العلم في المسائل الدينية.{'\n'}
          • لا نتحمّل أي ضرر ناتج عن انقطاع الخدمة أو فقدان بيانات نتيجة استخدام غير صحيح.
        </Section>

        <Section index="8" title="تعديل الشروط">
          نحتفظ بحقّ تعديل هذه الشروط في أي وقت لمصلحة المستخدمين. التعديلات تسري فور نشرها في هذه الصفحة،
          وستظهر السنة المحدّثة في أعلى الصفحة.
        </Section>

        <Section index="9" title="التواصل">
          إذا كان لديك أي سؤال أو ملاحظة بخصوص هذه الشروط، يمكنك التواصل عبر:{'\n'}
          {APP_INFO.supportEmail ? `• البريد: ${APP_INFO.supportEmail}\n` : ''}
          {APP_INFO.website ? `• الموقع: ${APP_INFO.website}\n` : ''}
          {APP_INFO.githubUrl ? `• GitHub: ${APP_INFO.githubUrl}` : ''}
        </Section>

        {/* خاتمة - دعاء */}
        <View style={[styles.duaCard, { borderColor: t.colors.accent + '40', backgroundColor: t.colors.accent + '08' }]}>
          <View style={[styles.duaDiamond, { borderColor: t.colors.accent }]} />
          <Text style={[styles.duaText, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}>
            «وَقُل رَّبِّ زِدْنِي عِلْمًا»
          </Text>
          <Text style={[styles.duaRef, { color: t.colors.textSecondary }]}>سورة طه - الآية ١١٤</Text>
          <View style={[styles.duaDiamond, { borderColor: t.colors.accent }]} />
        </View>

        {/* الفوتر */}
        <Text style={[styles.footer, { color: t.colors.textTertiary }]}>
          © {year} {APP_INFO.name}. صدقة جارية يبتغى بها وجه الله.
        </Text>
      </ScrollView>
    </View>
  );
}

const Section: React.FC<{ index: string; title: string; children: React.ReactNode }> = ({ index, title, children }) => {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionNum, { backgroundColor: t.colors.accent }]}>
          <Text style={[styles.sectionNumText, { color: t.colors.onAccent }]}>{index}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[styles.sectionBody, { color: t.colors.textSecondary }]}>
        {children}
      </Text>
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

  section: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionBody: {
    fontSize: 13.5,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingRight: 38,
  },

  duaCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginTop: 12,
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
