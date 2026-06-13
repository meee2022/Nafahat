/**
 * 🛡️ لوحة تحكم الأدمن - تظهر فقط للحسابات في ADMIN_EMAILS.
 *
 * تتيح للأدمن تعديل البيانات اللي بتظهر في:
 *   - شاشة "عن التطبيق" (إيميل، موقع، GitHub، إلخ)
 *   - الفوتر (السنة، نص "صُنع بـ")
 *   - بطاقة الإهداء (الصدقة الجارية)
 *   - رسالة المشاركة
 *
 * كل التعديلات بتُحفظ في AsyncStorage محلياً (useAppConfigStore).
 * لو حد مش أدمن دخل، هيتم تحويله لشاشة الحساب.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Save, RotateCcw, Shield, AlertCircle, UserPlus, X, Lock,
  Mail, Globe, Github, FileText, ShoppingBag, Share2, Heart, Calendar as CalendarIcon, Tag, Users,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { useAppConfigStore, useAppInfo, useIsAdmin, useAdminList, isBootstrapAdmin } from '@store/appConfigStore';

export default function AdminScreen() {
  const t = useTheme();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin(authUser?.email);

  const currentInfo = useAppInfo();
  const setOverrides = useAppConfigStore((s) => s.setOverrides);
  const resetAll = useAppConfigStore((s) => s.resetAll);
  const addAdmin = useAppConfigStore((s) => s.addAdmin);
  const removeAdmin = useAppConfigStore((s) => s.removeAdmin);
  const adminList = useAdminList();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // form state - مُهيّأ بالقيم الحالية (default + overrides)
  const [name, setName] = useState(currentInfo.name);
  const [tagline, setTagline] = useState(currentInfo.tagline);
  const [version, setVersion] = useState(currentInfo.version);
  const [build, setBuild] = useState(currentInfo.build);
  const [copyrightYear, setCopyrightYear] = useState(currentInfo.copyrightYear?.toString() ?? '');
  const [madeWithSuffix, setMadeWithSuffix] = useState(currentInfo.madeWithSuffix);
  const [charityNotice, setCharityNotice] = useState(currentInfo.charityNotice);

  const [supportEmail, setSupportEmail] = useState(currentInfo.supportEmail);
  const [website, setWebsite] = useState(currentInfo.website);
  const [githubUrl, setGithubUrl] = useState(currentInfo.githubUrl);
  const [githubLabel, setGithubLabel] = useState(currentInfo.githubLabel);
  const [appStoreUrl, setAppStoreUrl] = useState(currentInfo.appStoreUrl);
  const [playStoreUrl, setPlayStoreUrl] = useState(currentInfo.playStoreUrl);
  const [termsUrl, setTermsUrl] = useState(currentInfo.termsUrl);
  const [privacyUrl, setPrivacyUrl] = useState(currentInfo.privacyUrl);
  const [shareMessage, setShareMessage] = useState(currentInfo.shareMessage);

  // الإهداء
  const ded = currentInfo.charityDedication;
  const [dedicTitle, setDedicTitle] = useState(ded?.title ?? '');
  const [parentsLabel, setParentsLabel] = useState(ded?.parents.label ?? '');
  const [parentsNames, setParentsNames] = useState(ded?.parents.names ?? '');
  const [parentsPrayer, setParentsPrayer] = useState(ded?.parents.prayer ?? '');
  const [generalTitle, setGeneralTitle] = useState(ded?.general.title ?? '');
  const [generalScope, setGeneralScope] = useState(ded?.general.scope ?? '');
  const [generalDeceasedPrayer, setGeneralDeceasedPrayer] = useState(ded?.general.deceasedPrayer ?? '');
  const [generalLivingPrayer, setGeneralLivingPrayer] = useState(ded?.general.livingPrayer ?? '');

  const [saved, setSaved] = useState(false);

  if (!isAdmin) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: t.colors.background }]}>
        <View style={[styles.deniedIcon, { backgroundColor: t.colors.error + '14', borderColor: t.colors.error }]}>
          <Shield size={32} color={t.colors.error} />
        </View>
        <Text variant="h2" align="center" style={{ marginTop: 18 }}>وصول مرفوض</Text>
        <Text variant="body" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, paddingHorizontal: 30 }}>
          هذه الصفحة مخصّصة لمشرف التطبيق فقط. لو كنت تظن أن هذا خطأ، تحقّق من البريد المسجّل به.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/account')}
          style={[styles.backBtn, { backgroundColor: t.colors.primary, marginTop: 24 }]}
        >
          <Text style={{ color: t.colors.onPrimary, fontWeight: '700' }}>عودة لحسابي</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    await setOverrides({
      name,
      tagline,
      version,
      build,
      copyrightYear: copyrightYear.trim() ? Number(copyrightYear) : null,
      madeWithSuffix,
      charityNotice,
      supportEmail,
      website,
      githubUrl,
      githubLabel,
      appStoreUrl,
      playStoreUrl,
      termsUrl,
      privacyUrl,
      shareMessage,
      charityDedication: {
        title: dedicTitle,
        parents: {
          label: parentsLabel,
          names: parentsNames,
          prayer: parentsPrayer,
        },
        general: {
          title: generalTitle,
          scope: generalScope,
          deceasedPrayer: generalDeceasedPrayer,
          livingPrayer: generalLivingPrayer,
        },
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      setAdminError('أدخل بريداً إلكترونياً');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAdminError('صيغة البريد غير صحيحة');
      return;
    }
    if (adminList.all.includes(email)) {
      setAdminError('هذا البريد أدمن بالفعل');
      return;
    }
    await addAdmin(email);
    setNewAdminEmail('');
    setAdminError(null);
  };

  const handleRemoveAdmin = (email: string) => {
    if (isBootstrapAdmin(email)) {
      Alert.alert('غير مسموح', 'لا يمكن حذف الأدمن الأساسي للتطبيق - هذا الحساب مدمج بالكود.');
      return;
    }
    Alert.alert(
      'حذف صلاحية الأدمن',
      `هل تريد إزالة "${email}" من قائمة الأدمنز؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => removeAdmin(email),
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'إعادة التعيين',
      'هل أنت متأكد من حذف جميع التعديلات والعودة للقيم الافتراضية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد الإعادة',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            // إعادة تحميل الصفحة بقيم default
            router.replace('/admin');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/(tabs)/account');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color={t.colors.accent} />
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الإدارة</Text>
          </View>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>لوحة التحكم</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 }}>

        {saved ? (
          <View style={[styles.savedBanner, { backgroundColor: t.colors.success + '14', borderColor: t.colors.success }]}>
            <Save size={14} color={t.colors.success} />
            <Text style={{ color: t.colors.success, fontWeight: '700', fontSize: 13 }}>تم حفظ التعديلات بنجاح</Text>
          </View>
        ) : null}

        {/* رابط إدارة المستخدمين - بارز فوق */}
        <Pressable
          onPress={() => router.push('/admin/users')}
          style={({ pressed }) => [
            styles.quickLink,
            {
              backgroundColor: t.colors.accent + '12',
              borderColor: t.colors.accent + '50',
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: t.colors.accent }]}>
            <Users size={18} color={t.colors.onAccent} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: t.colors.textPrimary }}>
              👥 إدارة المستخدمين
            </Text>
            <Text style={{ fontSize: 11, color: t.colors.textSecondary, marginTop: 2 }}>
              عرض كل الحسابات في Convex وإدارتها
            </Text>
          </View>
          <ArrowRight size={16} color={t.colors.accent} style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>

        {/* قسم: إدارة المشرفين (الأدمنز) */}
        <Section title="إدارة المشرفين" icon={<Users size={16} color={t.colors.accent} />}>
          <Text style={[styles.adminSectionHint, { color: t.colors.textSecondary }]}>
            أي بريد تضيفه هنا هيقدر يدخل لوحة التحكم ويعدّل كل بيانات التطبيق.
          </Text>

          {/* قائمة الأدمنز الحاليين */}
          <View style={{ gap: 8 }}>
            {adminList.all.map((email) => {
              const isBootstrap = isBootstrapAdmin(email);
              const isCurrentUser = email === (authUser?.email ?? '').toLowerCase().trim();
              return (
                <View
                  key={email}
                  style={[styles.adminRow, { borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt }]}
                >
                  <View style={[styles.adminAvatar, { backgroundColor: isBootstrap ? t.colors.warning + '20' : t.colors.accent + '20' }]}>
                    {isBootstrap ? (
                      <Lock size={14} color={t.colors.warning} />
                    ) : (
                      <Shield size={14} color={t.colors.accent} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.adminEmail, { color: t.colors.textPrimary }]} numberOfLines={1}>
                      {email}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                      {isBootstrap ? (
                        <Text style={[styles.adminTag, { color: t.colors.warning, backgroundColor: t.colors.warning + '14' }]}>
                          أدمن أساسي
                        </Text>
                      ) : (
                        <Text style={[styles.adminTag, { color: t.colors.accent, backgroundColor: t.colors.accent + '14' }]}>
                          أدمن
                        </Text>
                      )}
                      {isCurrentUser ? (
                        <Text style={[styles.adminTag, { color: t.colors.success, backgroundColor: t.colors.success + '14' }]}>
                          أنت
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {!isBootstrap ? (
                    <Pressable
                      onPress={() => handleRemoveAdmin(email)}
                      hitSlop={10}
                      style={[styles.adminRemoveBtn, { backgroundColor: t.colors.error + '14', borderColor: t.colors.error + '50' }]}
                    >
                      <X size={14} color={t.colors.error} />
                    </Pressable>
                  ) : (
                    <View style={{ width: 30 }} />
                  )}
                </View>
              );
            })}
          </View>

          {/* إضافة أدمن جديد */}
          <View style={[styles.addAdminBox, { borderColor: t.colors.borderGold }]}>
            <Text style={[styles.fieldLabel, { color: t.colors.textSecondary, marginBottom: 8 }]}>
              إضافة مشرف جديد
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={newAdminEmail}
                onChangeText={(v) => {
                  setNewAdminEmail(v);
                  if (adminError) setAdminError(null);
                }}
                placeholder="admin@example.com"
                placeholderTextColor={t.colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: t.colors.textPrimary,
                    borderColor: adminError ? t.colors.error : t.colors.border,
                    backgroundColor: t.colors.background,
                    textAlign: 'left',
                    writingDirection: 'ltr',
                  },
                ]}
              />
              <Pressable
                onPress={handleAddAdmin}
                style={({ pressed }) => [
                  styles.addAdminBtn,
                  { backgroundColor: t.colors.accent, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <UserPlus size={16} color={t.colors.onAccent} />
                <Text style={{ color: t.colors.onAccent, fontWeight: '700', fontSize: 13 }}>إضافة</Text>
              </Pressable>
            </View>
            {adminError ? (
              <Text style={{ fontSize: 11, color: t.colors.error, fontWeight: '600', marginTop: 6 }}>
                {adminError}
              </Text>
            ) : null}
          </View>
        </Section>

        {/* قسم: هوية التطبيق */}
        <Section title="هوية التطبيق" icon={<Tag size={16} color={t.colors.accent} />}>
          <Field label="اسم التطبيق (عربي)" value={name} onChange={setName} />
          <Field label="الشعار/الجملة التعريفية" value={tagline} onChange={setTagline} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="الإصدار" value={version} onChange={setVersion} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="رقم البناء" value={build} onChange={setBuild} />
            </View>
          </View>
        </Section>

        {/* قسم: الفوتر */}
        <Section title="الفوتر" icon={<CalendarIcon size={16} color={t.colors.accent} />}>
          <Field
            label="سنة الـ Copyright"
            value={copyrightYear}
            onChange={setCopyrightYear}
            placeholder="اتركه فاضي للسنة الحالية تلقائياً"
            keyboardType="number-pad"
          />
          <Field label='نص "صُنع بـ ❤️ لـ..."' value={madeWithSuffix} onChange={setMadeWithSuffix} />
          <Field
            label="نص الصدقة الجارية المختصر"
            value={charityNotice}
            onChange={setCharityNotice}
            multiline
          />
        </Section>

        {/* قسم: تواصل */}
        <Section title="روابط التواصل" icon={<Mail size={16} color={t.colors.accent} />}>
          <Field label="بريد الدعم" value={supportEmail} onChange={setSupportEmail} keyboardType="email-address" />
          <Field label="الموقع الإلكتروني (بدون https)" value={website} onChange={setWebsite} />
          <Field label="رابط GitHub" value={githubUrl} onChange={setGithubUrl} />
          <Field label='تعليق GitHub (تحت "مصدر مفتوح")' value={githubLabel} onChange={setGithubLabel} />
        </Section>

        {/* قسم: المتاجر */}
        <Section title="متاجر التطبيقات" icon={<ShoppingBag size={16} color={t.colors.accent} />}>
          <Field label="رابط App Store" value={appStoreUrl} onChange={setAppStoreUrl} />
          <Field label="رابط Google Play" value={playStoreUrl} onChange={setPlayStoreUrl} />
        </Section>

        {/* قسم: قانوني */}
        <Section title="الشروط والخصوصية" icon={<FileText size={16} color={t.colors.accent} />}>
          <Field label="رابط شروط الاستخدام" value={termsUrl} onChange={setTermsUrl} />
          <Field label="رابط سياسة الخصوصية" value={privacyUrl} onChange={setPrivacyUrl} />
        </Section>

        {/* قسم: المشاركة */}
        <Section title="رسالة المشاركة" icon={<Share2 size={16} color={t.colors.accent} />}>
          <Field
            label="نص رسالة المشاركة"
            value={shareMessage}
            onChange={setShareMessage}
            multiline
          />
        </Section>

        {/* قسم: الإهداء */}
        <Section title="بطاقة الإهداء (صدقة جارية)" icon={<Heart size={16} color={t.colors.accent} />}>
          <Field label="عنوان البطاقة" value={dedicTitle} onChange={setDedicTitle} />

          <View style={[styles.subSection, { borderColor: t.colors.borderGold }]}>
            <Text style={[styles.subSectionTitle, { color: t.colors.accent }]}>القسم الأول - الوالدين</Text>
            <Field label='التمهيد (مثال: "لوالديّ")' value={parentsLabel} onChange={setParentsLabel} />
            <Field label="الأسماء" value={parentsNames} onChange={setParentsNames} />
            <Field label="الدعاء" value={parentsPrayer} onChange={setParentsPrayer} />
          </View>

          <View style={[styles.subSection, { borderColor: t.colors.borderGold }]}>
            <Text style={[styles.subSectionTitle, { color: t.colors.accent }]}>القسم الثاني - عام</Text>
            <Field label="العنوان الشامل" value={generalTitle} onChange={setGeneralTitle} />
            <Field label="النطاق (مثال: من أحياء وأموات)" value={generalScope} onChange={setGeneralScope} />
            <Field label="دعاء للمتوفّين" value={generalDeceasedPrayer} onChange={setGeneralDeceasedPrayer} />
            <Field label="دعاء للأحياء" value={generalLivingPrayer} onChange={setGeneralLivingPrayer} />
          </View>
        </Section>

        {/* تنبيه */}
        <View style={[styles.notice, { backgroundColor: t.colors.warning + '12', borderColor: t.colors.warning + '50' }]}>
          <AlertCircle size={16} color={t.colors.warning} />
          <Text style={{ flex: 1, fontSize: 12, color: t.colors.textSecondary, lineHeight: 18 }}>
            التعديلات تُحفظ على هذا الجهاز فقط. لو حابب تنشرها لكل المستخدمين، نحتاج ربط الـ store بـ Convex backend.
          </Text>
        </View>

        {/* أزرار العمليات */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.resetBtn,
              { borderColor: t.colors.error, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <RotateCcw size={16} color={t.colors.error} />
            <Text style={{ color: t.colors.error, fontWeight: '700', fontSize: 13 }}>استعادة الافتراضي</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: t.colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Save size={16} color={t.colors.onPrimary} />
            <Text style={{ color: t.colors.onPrimary, fontWeight: '700', fontSize: 14 }}>حفظ التعديلات</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: t.colors.accent + '14' }]}>
          {icon}
        </View>
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>{title}</Text>
      </View>
      <Card padding={14} elevation="xs" bordered>
        <View style={{ gap: 10 }}>
          {children}
        </View>
      </Card>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}> = ({ label, value, onChange, placeholder, multiline, keyboardType }) => {
  const t = useTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: t.colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textTertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: t.colors.textPrimary,
            borderColor: t.colors.border,
            backgroundColor: t.colors.surfaceAlt,
            minHeight: multiline ? 68 : 42,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
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

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 18,
  },
  quickLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  subSection: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    gap: 10,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },

  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 10,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  // قسم إدارة الأدمنز
  adminSectionHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminEmail: {
    fontSize: 13,
    fontWeight: '700',
  },
  adminTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  adminRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addAdminBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  addAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 8,
  },

  // وصول مرفوض
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  deniedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
});
