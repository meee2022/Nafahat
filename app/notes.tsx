/**
 * شاشة التدبّر والملاحظات + نموذج إضافة inline كامل.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Plus, Feather, X, Save, BookOpen } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card, EmptyState, Button } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useReadingStore } from '@store/index';
import { arabicNumber, getSurahById, SURAHS } from '@data/surahs';
import { useT } from '@store/languageStore';
import { getDailyPrompt } from '@data/reflectionPrompts';

export default function NotesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { notes, removeNote, addNote } = useReadingStore();

  const [showForm, setShowForm] = useState(false);
  const [surahId, setSurahId] = useState<number>(2);
  const [ayahNumber, setAyahNumber] = useState<string>('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [surahSearch, setSurahSearch] = useState('');

  const filteredSurahs = SURAHS.filter((s) => s.nameAr.includes(surahSearch.trim())).slice(0, 6);
  const selectedSurah = getSurahById(surahId);
  const canSubmit = body.trim().length > 0 && ayahNumber.trim().length > 0;

  // محفّز اليوم
  const dailyPrompt = React.useMemo(() => getDailyPrompt(), []);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const tags = tagsInput
      .split(/[,،#\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    addNote({
      surahId,
      ayahNumber: parseInt(ayahNumber, 10) || 1,
      body: body.trim(),
      tags,
    });
    setBody(''); setAyahNumber(''); setTagsInput('');
    setShowForm(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('notes.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('notes.title')}</Text>
        </View>
        <Pressable
          onPress={() => setShowForm((v) => !v)}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.accent, backgroundColor: t.colors.accent + '14' }]}
        >
          {showForm ? <X size={18} color={t.colors.accent} strokeWidth={2} /> : <Plus size={18} color={t.colors.accent} strokeWidth={2} />}
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 }}>
          {/* بطاقة المحفّز اليومي */}
          {!showForm ? (
            <Pressable
              onPress={() => {
                setBody(dailyPrompt.prompt + '\n\n');
                setShowForm(true);
              }}
              style={({ pressed }) => [
                styles.promptCard,
                {
                  backgroundColor: t.colors.accent + '10',
                  borderColor: t.colors.accent + '40',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{dailyPrompt.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, letterSpacing: 2, fontWeight: '700', color: t.colors.accent }}>
                    تأمّل اليوم · {dailyPrompt.category}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.textPrimary, marginTop: 4, lineHeight: 22 }}>
                    {dailyPrompt.prompt}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: t.colors.accentDeep, marginTop: 10, fontWeight: '700' }}>
                ← اضغط لكتابة تأمّلك
              </Text>
            </Pressable>
          ) : null}

          {/* نموذج إضافة inline */}
          {showForm ? (
            <Card padding={18} elevation="sm" bordered background={t.colors.accent + '06'} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Feather size={16} color={t.colors.accent} />
                <Text variant="subtitle">{tr('notes.newReflection')}</Text>
              </View>

              {/* السورة */}
              <Text variant="label" style={{ marginBottom: 6 }}>{tr('notes.fieldSurah')}</Text>
              <View style={[styles.input, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                <BookOpen size={14} color={t.colors.textTertiary} />
                <TextInput
                  value={surahSearch || (selectedSurah?.nameAr ?? '')}
                  onChangeText={setSurahSearch}
                  placeholder="ابحث عن سورة..."
                  placeholderTextColor={t.colors.textTertiary}
                  style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
                />
              </View>

              {surahSearch.trim() && filteredSurahs.length > 0 ? (
                <View style={[styles.dropdown, { borderColor: t.colors.borderGold, backgroundColor: t.colors.surface }]}>
                  {filteredSurahs.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => { setSurahId(s.id); setSurahSearch(''); }}
                      style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: t.colors.accent + '10' }]}
                    >
                      <Text variant="body">{s.nameAr}</Text>
                      <Text variant="caption" color={t.colors.textTertiary}>
                        {arabicNumber(s.versesCount)} آية
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* رقم الآية */}
              <Text variant="label" style={{ marginTop: 12, marginBottom: 6 }}>
                {tr('notes.fieldAyahNum')} ({tr('common.to')} {arabicNumber(selectedSurah?.versesCount ?? 286)})
              </Text>
              <View style={[styles.input, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                <TextInput
                  value={ayahNumber}
                  onChangeText={(v) => setAyahNumber(v.replace(/[^0-9]/g, ''))}
                  placeholder={tr('notes.ayahNumPlaceholder')}
                  placeholderTextColor={t.colors.textTertiary}
                  keyboardType="numeric"
                  style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
                />
              </View>

              {/* نص التأمّل */}
              <Text variant="label" style={{ marginTop: 12, marginBottom: 6 }}>{tr('notes.fieldReflection')}</Text>
              <View style={[styles.textArea, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder={tr('notes.reflectionPlaceholder')}
                  placeholderTextColor={t.colors.textTertiary}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{
                    color: t.colors.textPrimary, textAlign: 'right',
                    fontSize: 15, lineHeight: 24, minHeight: 110,
                  }}
                />
              </View>

              {/* وسوم */}
              <Text variant="label" style={{ marginTop: 12, marginBottom: 6 }}>
                {tr('notes.fieldTags')}
              </Text>
              <View style={[styles.input, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                <TextInput
                  value={tagsInput}
                  onChangeText={setTagsInput}
                  placeholder={tr('notes.tagsPlaceholder')}
                  placeholderTextColor={t.colors.textTertiary}
                  style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
                />
              </View>

              {/* أزرار */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Button label={tr('common.cancel')} variant="ghost" onPress={() => setShowForm(false)} fullWidth />
                <Button
                  label={tr('notes.saveButton')}
                  iconRight={<Save size={14} color={t.colors.onPrimary} />}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  fullWidth
                />
              </View>
            </Card>
          ) : null}

          {notes.length === 0 && !showForm ? (
            <Card padding={32} elevation="xs" bordered>
              <EmptyState
                icon={<Feather size={36} color={t.colors.accent} />}
                title={tr('notes.empty')}
                description="ابدأ بتدوين أول تأمّل لك على آية. اضغط + أعلى الشاشة."
                actionLabel="أضف تأمّلاً"
                onAction={() => setShowForm(true)}
              />
            </Card>
          ) : null}

          {notes.length > 0 ? (
            <>
              <View style={styles.sectionHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: t.colors.accent }]}>تأمّلاتي</Text>
                  <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
                    {arabicNumber(notes.length)} تأمّل
                  </Text>
                </View>
                <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
              </View>

              <View style={{ gap: 12 }}>
                {notes.map((n) => {
                  const surah = getSurahById(n.surahId);
                  return (
                    <Card key={n.id} padding={16} elevation="xs" bordered>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Feather size={12} color={t.colors.accent} />
                            <Text variant="label" color={t.colors.accent}>
                              {surah?.nameAr} · الآية {arabicNumber(n.ayahNumber)}
                            </Text>
                          </View>

                          <Text variant="body" style={{ marginTop: 8, lineHeight: 24 }}>
                            {n.body}
                          </Text>

                          {n.tags.length > 0 ? (
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                              {n.tags.map((tag, i) => (
                                <View key={i} style={[styles.tag, { borderColor: t.colors.borderGold }]}>
                                  <Text variant="caption" color={t.colors.textSecondary}>#{tag}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}

                          <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 8 }}>
                            {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                          </Text>
                        </View>
                        <Pressable onPress={() => removeNote(n.id)} hitSlop={10}>
                          <X size={16} color={t.colors.textTertiary} />
                        </Pressable>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12, marginTop: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 44, borderWidth: 1,
  },
  textArea: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  dropdown: { marginTop: 4, borderWidth: 1 },
  dropdownItem: {
    paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
});
