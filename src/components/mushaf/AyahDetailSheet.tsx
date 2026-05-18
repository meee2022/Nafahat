/**
 * Bottom Sheet لتفاصيل الآية - يفتح عند الضغط على آية في المصحف.
 *
 * تبويبات:
 *  📖 تفسير  - 3 خيارات (الميسّر / الجلالين / القرطبي)
 *  🌐 ترجمة - 4 خيارات (إنجليزي × 2 + فرنسي + أردي)
 *  ⚡ إجراءات - مرجعية / مفضّلة / نسخ / مشاركة / استماع
 *
 * مع كاش ذكي للنصوص + تذكّر آخر تفسير/ترجمة مختارة.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  X, BookOpen, Globe, Sparkles, Bookmark, Heart, Copy, Share2, Play,
  Check, AlertCircle, RotateCcw, ArrowLeft, Brain,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { OrnamentalRule } from '@components/ornaments';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import {
  getAyahText, TafsirEdition, TranslationEdition,
  TAFSIR_OPTIONS, TRANSLATION_OPTIONS,
} from '@services/tafsir';
import { copyToClipboard, shareText } from '@utils/clipboard';
import { getWordsByVerse, QuranWord } from '@services/wordByWord';
import { getWordAudioUrl } from '@services/quranComApi';
import { playOneShot } from '@services/audioPlayer';
import { useMemoStore } from '@store/index';

type Tab = 'tafsir' | 'translation' | 'words' | 'actions';

interface Props {
  visible: boolean;
  onClose: () => void;
  surahId: number;
  ayahNumber: number;
  ayahText: string;
  surahName: string;

  // إجراءات الآية (تأتي من شاشة السورة)
  isBookmarked?: boolean;
  isFavorite?: boolean;
  onToggleBookmark?: () => void;
  onToggleFavorite?: () => void;
  onPlay?: () => void;
}

export const AyahDetailSheet: React.FC<Props> = ({
  visible, onClose, surahId, ayahNumber, ayahText, surahName,
  isBookmarked, isFavorite, onToggleBookmark, onToggleFavorite, onPlay,
}) => {
  const t = useTheme();
  const tr = useT();
  const [tab, setTab] = useState<Tab>('tafsir');
  const [tafsirEdition, setTafsirEdition] = useState<TafsirEdition>('ar.muyassar');
  const [translationEdition, setTranslationEdition] = useState<TranslationEdition>('en.sahih');

  const [tafsirText, setTafsirText] = useState<string>('');
  const [translationText, setTranslationText] = useState<string>('');
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [errorTafsir, setErrorTafsir] = useState<string | null>(null);
  const [errorTranslation, setErrorTranslation] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // 🧠 Memorization: تحقّق لو الآية مضافة بالفعل لخطة الحفظ
  const memoTasks = useMemoStore((s) => s.tasks);
  const addMemoTask = useMemoStore((s) => s.addTask);
  const isInMemoPlan = useMemo(
    () => memoTasks.some((tk) => tk.surahId === surahId && tk.ayahFrom <= ayahNumber && tk.ayahTo >= ayahNumber),
    [memoTasks, surahId, ayahNumber],
  );
  const [memoJustAdded, setMemoJustAdded] = useState(false);

  const handleMarkMemorize = () => {
    if (isInMemoPlan) return;
    addMemoTask({ surahId, ayahFrom: ayahNumber, ayahTo: ayahNumber, status: 'new' });
    setMemoJustAdded(true);
    setTimeout(() => setMemoJustAdded(false), 2000);
  };

  // كلمة كلمة
  const [words, setWords] = useState<QuranWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [errorWords, setErrorWords] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<QuranWord | null>(null);

  const ayahRef = `سورة ${surahName} · الآية ${arabicNumber(ayahNumber)}`;

  // جلب التفسير عند فتح الـ Sheet أو تغيير الإصدار
  useEffect(() => {
    if (!visible || tab !== 'tafsir') return;
    let mounted = true;
    setLoadingTafsir(true);
    setErrorTafsir(null);
    getAyahText(surahId, ayahNumber, tafsirEdition)
      .then((txt) => mounted && setTafsirText(txt))
      .catch(() => mounted && setErrorTafsir(tr('tafsir.loadError')))
      .finally(() => mounted && setLoadingTafsir(false));
    return () => { mounted = false; };
  }, [visible, tab, surahId, ayahNumber, tafsirEdition, tr]);

  // جلب الترجمة
  useEffect(() => {
    if (!visible || tab !== 'translation') return;
    let mounted = true;
    setLoadingTranslation(true);
    setErrorTranslation(null);
    getAyahText(surahId, ayahNumber, translationEdition)
      .then((txt) => mounted && setTranslationText(txt))
      .catch(() => mounted && setErrorTranslation(tr('tafsir.loadError')))
      .finally(() => mounted && setLoadingTranslation(false));
    return () => { mounted = false; };
  }, [visible, tab, surahId, ayahNumber, translationEdition, tr]);

  // جلب كلمة كلمة
  useEffect(() => {
    if (!visible || tab !== 'words') return;
    let mounted = true;
    setLoadingWords(true);
    setErrorWords(null);
    setSelectedWord(null);
    getWordsByVerse(surahId, ayahNumber)
      .then((ws) => mounted && setWords(ws))
      .catch(() => mounted && setErrorWords(tr('tafsir.loadError')))
      .finally(() => mounted && setLoadingWords(false));
    return () => { mounted = false; };
  }, [visible, tab, surahId, ayahNumber, tr]);

  // إعادة تعيين عند الإغلاق
  useEffect(() => {
    if (!visible) {
      setCopied(false);
      setSelectedWord(null);
    }
  }, [visible]);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleShareAyah = () => {
    shareText(
      `${ayahText}\n\n— ${ayahRef}\n\nمن تطبيق نَفَحات`,
      ayahRef,
    );
  };

  const currentTranslationLang = TRANSLATION_OPTIONS.find((o) => o.id === translationEdition)?.lang ?? 'en';
  // RTL languages: Urdu, Persian (Arabic is the source verse, not a translation choice)
  const isRTL = currentTranslationLang === 'ur' || currentTranslationLang === 'fa';

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      {/* خلفية معتمة قابلة للنقر للإغلاق */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbWrap}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { backgroundColor: t.colors.background, borderColor: t.colors.borderGold }]}>
          {/* مقبض السحب */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: t.colors.borderStrong }]} />
          </View>

          {/* الترويسة - الآية + زر الإغلاق */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowDot, { backgroundColor: t.colors.accent }]} />
                <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('tafsir.title')}</Text>
                <View style={[styles.eyebrowDot, { backgroundColor: t.colors.accent }]} />
              </View>
              <Text style={[styles.ayahRef, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]} numberOfLines={1}>
                {ayahRef}
              </Text>
            </View>
            <Pressable
              onPress={onPlay}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="تشغيل الآية"
              style={[styles.closeBtn, { backgroundColor: t.colors.accent + '1A', marginEnd: 8 }]}
            >
              <Play size={16} color={t.colors.accent} fill={t.colors.accent} />
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              style={[styles.closeBtn, { backgroundColor: t.colors.surfaceAlt }]}
            >
              <X size={18} color={t.colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* نص الآية (مختصر) */}
          <LinearGradient
            colors={[t.colors.accent + '12', t.colors.accent + '04']}
            style={[styles.ayahCard, { borderColor: t.colors.borderGold }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.bracket}>﴿</Text>
            <Text
              style={[
                styles.ayahText,
                { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran },
              ]}
              numberOfLines={3}
            >
              {ayahText}
            </Text>
            <Text style={styles.bracket}>﴾</Text>
          </LinearGradient>

          {/* تبويبات */}
          <View style={[styles.tabs, { backgroundColor: t.colors.surfaceAlt }]}>
            <TabButton
              icon={<BookOpen size={14} color={tab === 'tafsir' ? t.colors.onPrimary : t.colors.textSecondary} />}
              label={tr('tafsir.tabTafsir')}
              active={tab === 'tafsir'}
              onPress={() => setTab('tafsir')}
            />
            <TabButton
              icon={<Globe size={14} color={tab === 'translation' ? t.colors.onPrimary : t.colors.textSecondary} />}
              label={tr('tafsir.tabTranslation')}
              active={tab === 'translation'}
              onPress={() => setTab('translation')}
            />
            <TabButton
              icon={<Text style={{ fontSize: 12, color: tab === 'words' ? t.colors.onPrimary : t.colors.textSecondary, fontWeight: '900' }}>أ</Text>}
              label="كلمة كلمة"
              active={tab === 'words'}
              onPress={() => setTab('words')}
            />
            <TabButton
              icon={<Sparkles size={14} color={tab === 'actions' ? t.colors.onPrimary : t.colors.textSecondary} />}
              label={tr('tafsir.tabActions')}
              active={tab === 'actions'}
              onPress={() => setTab('actions')}
            />
          </View>

          {/* محتوى التبويب */}
          <ScrollView
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'tafsir' ? (
              <View style={{ padding: 16 }}>
                {/* اختيار التفسير */}
                <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                  {tr('tafsir.chooseTafsir')}
                </Text>
                <View style={styles.chipRow}>
                  {TAFSIR_OPTIONS.map((opt) => (
                    <SelectChip
                      key={opt.id}
                      label={opt.nameAr}
                      active={tafsirEdition === opt.id}
                      onPress={() => setTafsirEdition(opt.id)}
                    />
                  ))}
                </View>

                {/* النص */}
                <View style={[styles.contentBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                  {loadingTafsir ? (
                    <View style={styles.center}>
                      <ActivityIndicator color={t.colors.accent} size="large" />
                      <Text style={{ color: t.colors.textSecondary, marginTop: 14, fontSize: 13 }}>
                        {tr('tafsir.loading')}
                      </Text>
                    </View>
                  ) : errorTafsir ? (
                    <View style={styles.center}>
                      <AlertCircle size={28} color={t.colors.error} />
                      <Text style={{ color: t.colors.error, marginTop: 10, fontSize: 13, textAlign: 'center' }}>
                        {errorTafsir}
                      </Text>
                      <Pressable
                        onPress={() => setTafsirEdition(tafsirEdition)}
                        style={[styles.retryBtn, { borderColor: t.colors.accent }]}
                      >
                        <RotateCcw size={14} color={t.colors.accent} />
                        <Text style={{ color: t.colors.accent, fontWeight: '700', fontSize: 13, marginStart: 6 }}>
                          {tr('common.retry')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          lineHeight: 30,
                          color: t.colors.textPrimary,
                          textAlign: 'right',
                          fontWeight: '400',
                        }}
                      >
                        {tafsirText}
                      </Text>
                      {/* أزرار صغيرة: نسخ + مشاركة التفسير */}
                      <View style={styles.tafsirActions}>
                        <Pressable
                          onPress={() => handleCopy(`${tafsirText}\n\n— التفسير الميسّر، ${ayahRef}\n\nمن تطبيق نَفَحات`)}
                          style={({ pressed }) => [styles.miniBtn, { backgroundColor: t.colors.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}
                        >
                          {copied ? <Check size={14} color={t.colors.success} /> : <Copy size={14} color={t.colors.textSecondary} />}
                          <Text style={{ fontSize: 11, fontWeight: '700', color: copied ? t.colors.success : t.colors.textSecondary, marginStart: 5 }}>
                            {copied ? 'تم النسخ' : tr('common.copy')}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => shareText(`${tafsirText}\n\n— ${ayahRef}`, 'تفسير الآية')}
                          style={({ pressed }) => [styles.miniBtn, { backgroundColor: t.colors.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Share2 size={14} color={t.colors.textSecondary} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.textSecondary, marginStart: 5 }}>
                            {tr('common.share')}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              </View>
            ) : null}

            {tab === 'translation' ? (
              <View style={{ padding: 16 }}>
                <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                  {tr('tafsir.chooseTranslation')}
                </Text>
                <View style={styles.chipRow}>
                  {TRANSLATION_OPTIONS.map((opt) => (
                    <SelectChip
                      key={opt.id}
                      label={`${opt.flag} ${opt.nameAr}`}
                      active={translationEdition === opt.id}
                      onPress={() => setTranslationEdition(opt.id)}
                    />
                  ))}
                </View>

                <View style={[styles.contentBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                  {loadingTranslation ? (
                    <View style={styles.center}>
                      <ActivityIndicator color={t.colors.accent} size="large" />
                      <Text style={{ color: t.colors.textSecondary, marginTop: 14, fontSize: 13 }}>
                        {tr('tafsir.loading')}
                      </Text>
                    </View>
                  ) : errorTranslation ? (
                    <View style={styles.center}>
                      <AlertCircle size={28} color={t.colors.error} />
                      <Text style={{ color: t.colors.error, marginTop: 10, fontSize: 13 }}>
                        {errorTranslation}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        lineHeight: 28,
                        color: t.colors.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      }}
                    >
                      {translationText}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {tab === 'words' ? (
              <View style={{ padding: 16 }}>
                <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                  اضغط على الكلمة لمعرفة معناها
                </Text>

                <View style={[styles.contentBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                  {loadingWords ? (
                    <View style={styles.center}>
                      <ActivityIndicator color={t.colors.accent} size="large" />
                      <Text style={{ color: t.colors.textSecondary, marginTop: 14, fontSize: 13 }}>
                        جارٍ تحميل الكلمات...
                      </Text>
                    </View>
                  ) : errorWords ? (
                    <View style={styles.center}>
                      <AlertCircle size={28} color={t.colors.error} />
                      <Text style={{ color: t.colors.error, marginTop: 10, fontSize: 13 }}>
                        {errorWords}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* الكلمات قابلة للنقر */}
                      <View style={styles.wordsGrid}>
                        {words.map((w) => {
                          const isSelected = selectedWord?.position === w.position;
                          return (
                            <Pressable
                              key={w.position}
                              onPress={() => setSelectedWord(isSelected ? null : w)}
                              style={({ pressed }) => [
                                styles.wordChip,
                                {
                                  backgroundColor: isSelected ? t.colors.accent + '20' : t.colors.surfaceAlt,
                                  borderColor: isSelected ? t.colors.accent : 'transparent',
                                  opacity: pressed ? 0.7 : 1,
                                },
                              ]}
                            >
                              <Text style={{
                                fontFamily: t.fontFamilies.arabicQuran,
                                fontSize: 19,
                                color: isSelected ? t.colors.accentDeep : t.colors.textPrimary,
                                fontWeight: '600',
                              }}>
                                {w.text}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* تفاصيل الكلمة المختارة */}
                      {selectedWord ? (
                        <View style={[styles.wordDetails, { backgroundColor: t.colors.accent + '08', borderColor: t.colors.accent + '40' }]}>
                          <Text style={{ fontFamily: t.fontFamilies.arabicQuran, fontSize: 28, color: t.colors.accentDeep, textAlign: 'center', fontWeight: '700' }}>
                            {selectedWord.text}
                          </Text>
                          {selectedWord.transliteration ? (
                            <Text style={{ fontSize: 13, color: t.colors.textTertiary, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
                              {selectedWord.transliteration}
                            </Text>
                          ) : null}
                          <View style={[styles.wordDivider, { backgroundColor: t.colors.accent + '40' }]} />
                          <Text style={{ fontSize: 15, color: t.colors.textPrimary, textAlign: 'center', fontWeight: '600', lineHeight: 22 }}>
                            {selectedWord.translation || '(لا توجد ترجمة لهذه الكلمة)'}
                          </Text>

                          {/* 🔊 زر استماع للكلمة من Tarteel */}
                          <Pressable
                            onPress={() => {
                              const location = `${surahId}:${ayahNumber}:${selectedWord.position}`;
                              const url = getWordAudioUrl(location);
                              if (url) playOneShot(url);
                            }}
                            style={({ pressed }) => ({
                              marginTop: 12,
                              alignSelf: 'center',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: t.colors.accent,
                              opacity: pressed ? 0.75 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="استماع للكلمة"
                          >
                            <Play size={14} color={t.colors.background} fill={t.colors.background} />
                            <Text style={{ color: t.colors.background, fontSize: 12, fontWeight: '700' }}>
                              استمع للكلمة
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', marginTop: 14, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 11, color: t.colors.textTertiary }}>
                            ✦ اختر كلمة لترى معناها بالتفصيل ✦
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            ) : null}

            {tab === 'actions' ? (
              <View style={{ padding: 16 }}>
                <View style={[styles.actionsGrid]}>
                  <ActionBig
                    icon={<Bookmark size={22} color={isBookmarked ? t.colors.accent : t.colors.textSecondary} fill={isBookmarked ? t.colors.accent : 'none'} />}
                    label="مرجعية"
                    active={isBookmarked}
                    onPress={onToggleBookmark}
                  />
                  <ActionBig
                    icon={<Heart size={22} color={isFavorite ? t.colors.error : t.colors.textSecondary} fill={isFavorite ? t.colors.error : 'none'} />}
                    label="مفضلة"
                    active={isFavorite}
                    onPress={onToggleFavorite}
                  />
                  <ActionBig
                    icon={copied ? <Check size={22} color={t.colors.success} /> : <Copy size={22} color={t.colors.textSecondary} />}
                    label={copied ? 'تم النسخ' : 'نسخ الآية'}
                    active={copied}
                    onPress={() => handleCopy(`${ayahText}\n\n— ${ayahRef}\n\nمن تطبيق نَفَحات`)}
                  />
                  <ActionBig
                    icon={<Share2 size={22} color={t.colors.textSecondary} />}
                    label="مشاركة"
                    onPress={handleShareAyah}
                  />
                  <ActionBig
                    icon={<Play size={22} color={t.colors.textSecondary} fill={t.colors.textSecondary} />}
                    label="استماع"
                    onPress={onPlay}
                  />
                  {/* 🧠 ربط المصحف بنظام الحفظ — احفظ هذه الآية يضيفها لـ memorization plan */}
                  <ActionBig
                    icon={<Brain size={22} color={isInMemoPlan || memoJustAdded ? t.colors.accent : t.colors.textSecondary} fill={isInMemoPlan || memoJustAdded ? t.colors.accent + '30' : 'none'} />}
                    label={memoJustAdded ? 'تمت الإضافة' : isInMemoPlan ? 'في خطة الحفظ' : 'احفظ هذه الآية'}
                    active={isInMemoPlan || memoJustAdded}
                    onPress={handleMarkMemorize}
                  />
                </View>

                <View style={{ marginTop: 18, alignItems: 'center' }}>
                  <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────── شارة تبويب ───────────────
const TabButton: React.FC<{
  icon: React.ReactNode; label: string; active: boolean; onPress: () => void;
}> = ({ icon, label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tab,
        {
          backgroundColor: active ? t.colors.primary : 'transparent',
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? t.colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: active ? 0.22 : 0,
          shadowRadius: 8,
          elevation: active ? 3 : 0,
        },
      ]}
    >
      {icon}
      <Text style={{
        fontSize: 13,
        fontWeight: '700',
        color: active ? t.colors.onPrimary : t.colors.textSecondary,
        marginStart: 6,
        letterSpacing: 0.3,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─────────────── شارة اختيار (نوع تفسير/ترجمة) ───────────────
const SelectChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: active ? t.colors.accent : t.colors.border,
          backgroundColor: active ? t.colors.accent + '14' : t.colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: '700',
        color: active ? t.colors.accentDeep : t.colors.textSecondary,
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─────────────── بطاقة إجراء كبيرة ───────────────
const ActionBig: React.FC<{
  icon: React.ReactNode; label: string; active?: boolean; onPress?: () => void;
}> = ({ icon, label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBig,
        {
          backgroundColor: active ? t.colors.accent + '14' : t.colors.surface,
          borderColor: active ? t.colors.accent + '50' : t.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? t.colors.accentDeep : t.colors.textPrimary, marginTop: 8, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 22, 18, 0.55)',
  },
  kbWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 8,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 4, height: 4, borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 3, fontWeight: '700',
  },
  ayahRef: {
    fontSize: 17, fontWeight: '800', marginTop: 4,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  ayahCard: {
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bracket: {
    fontSize: 22,
    color: '#B89456',
    lineHeight: 30,
    fontWeight: '700',
  },
  ayahText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '500',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 5,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 11, letterSpacing: 2, fontWeight: '700',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  contentBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 140,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 14,
  },

  tafsirActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  wordChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  wordDetails: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  wordDivider: {
    height: 1,
    width: '60%',
    alignSelf: 'center',
    marginVertical: 10,
    opacity: 0.6,
  },
  actionBig: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
});
