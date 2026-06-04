/**
 * 🔖 شاشة المفضلة + المرجعيات — منظّمة بالمجلّدات.
 *
 * V2: ضفنا folder filtering للـ bookmarks. كل bookmark يقدر يكون في مجلّد
 *  (للحفظ / تأمّلات / دعاء / مخصّص) عشان التنظيم. الـ favorites قائمة بسيطة.
 *
 * Identity: أخضر primary + ذهبي accent. الأيقونات بألوان feature متنوّعة.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Heart, Bookmark, ChevronLeft, Brain, Sparkles, Folder, Plus,
  FolderPlus, MoreHorizontal, X, Check,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, EmptyState } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useReadingStore } from '@store/index';
import { arabicNumber, getSurahById } from '@data/surahs';
import { useT } from '@store/languageStore';
import type { Bookmark as BookmarkType, BookmarkFolder } from '@/types/index';

// 🎨 الأيقونة المناسبة للمجلّد (folder.iconName → icon component)
function FolderIcon({ name, size = 16, color }: { name?: string; size?: number; color: string }) {
  switch (name) {
    case 'Brain':     return <Brain size={size} color={color} />;
    case 'Sparkles':  return <Sparkles size={size} color={color} />;
    case 'Heart':     return <Heart size={size} color={color} />;
    case 'Bookmark':  return <Bookmark size={size} color={color} />;
    default:          return <Folder size={size} color={color} />;
  }
}

export default function FavoritesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const favorites      = useReadingStore((s) => s.favorites);
  const bookmarks      = useReadingStore((s) => s.bookmarks);
  const folders        = useReadingStore((s) => s.bookmarkFolders);
  const moveBookmark   = useReadingStore((s) => s.moveBookmarkToFolder);
  const createFolder   = useReadingStore((s) => s.createBookmarkFolder);
  const removeFolder   = useReadingStore((s) => s.removeBookmarkFolder);

  // selected folder filter: undefined = all, 'unsorted' = bookmarks بدون folder
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  // modal لإنشاء مجلّد جديد
  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // modal للـ "move to folder" لما المستخدم يضغط على bookmark long-press / 3dots
  const [moveTarget, setMoveTarget] = useState<BookmarkType | null>(null);

  const favoriteAyahs = useMemo(
    () =>
      favorites.map((k) => {
        const [s, a] = k.split(':').map(Number);
        const surah = getSurahById(s);
        return { surahId: s, ayahNumber: a, surahName: surah?.nameAr ?? '' };
      }),
    [favorites],
  );

  // 📂 فلترة الـ bookmarks بالمجلّد المختار
  const filteredBookmarks = useMemo(() => {
    if (selectedFolder === undefined) return bookmarks;
    if (selectedFolder === 'unsorted') return bookmarks.filter((b) => !b.folder);
    return bookmarks.filter((b) => b.folder === selectedFolder);
  }, [bookmarks, selectedFolder]);

  // عداد كل folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { unsorted: 0 };
    for (const f of folders) counts[f.id] = 0;
    for (const b of bookmarks) {
      if (!b.folder) counts.unsorted += 1;
      else if (counts[b.folder] !== undefined) counts[b.folder] += 1;
    }
    return counts;
  }, [bookmarks, folders]);

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name, 'Folder', t.colors.accent);
    setNewFolderName('');
    setCreateOpen(false);
  };

  const handleRemoveFolder = (folder: BookmarkFolder) => {
    Alert.alert(
      'حذف المجلّد',
      `هل أنت متأكّد من حذف "${folder.nameAr}"؟ المرجعيات بداخله ستنتقل إلى "غير مصنّفة".`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => {
          removeFolder(folder.id);
          if (selectedFolder === folder.id) setSelectedFolder(undefined);
        }},
      ],
    );
  };

  const totalCount = favoriteAyahs.length + bookmarks.length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('favorites.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('favorites.title')}</Text>
        </View>
        <Pressable
          onPress={() => setCreateOpen(true)}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.accent, backgroundColor: t.colors.accent + '14' }]}
          accessibilityRole="button"
          accessibilityLabel="إنشاء مجلّد جديد"
        >
          <FolderPlus size={18} color={t.colors.accent} strokeWidth={1.8} />
        </Pressable>
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 14 }}>
        {totalCount === 0 ? (
          <Card padding={32} elevation="xs" bordered>
            <EmptyState
              icon={<Heart size={36} color={t.colors.accent} />}
              title={tr('favorites.empty')}
              description="اضغط على ♥ بجانب أي آية في المصحف لإضافتها لمفضلتك، وستجدها هنا."
              actionLabel="افتح المصحف"
              onAction={() => router.push('/mushaf')}
            />
          </Card>
        ) : (
          <>
            {/* 📂 شريط المجلّدات */}
            {bookmarks.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.foldersRow}
              >
                <FolderChip
                  active={selectedFolder === undefined}
                  label="الكل"
                  count={bookmarks.length}
                  iconName={undefined}
                  color={t.colors.accent}
                  onPress={() => setSelectedFolder(undefined)}
                  t={t}
                />
                <FolderChip
                  active={selectedFolder === 'unsorted'}
                  label="غير مصنّفة"
                  count={folderCounts.unsorted}
                  iconName="Folder"
                  color={t.colors.textTertiary}
                  onPress={() => setSelectedFolder('unsorted')}
                  t={t}
                />
                {folders.map((f) => (
                  <FolderChip
                    key={f.id}
                    active={selectedFolder === f.id}
                    label={f.nameAr}
                    count={folderCounts[f.id] ?? 0}
                    iconName={f.iconName}
                    color={f.color ?? t.colors.accent}
                    onPress={() => setSelectedFolder(f.id)}
                    onLongPress={() => handleRemoveFolder(f)}
                    t={t}
                  />
                ))}
              </ScrollView>
            ) : null}

            {/* المفضلة (favorites = ❤️ - منفصلة عن المجلّدات) */}
            {favoriteAyahs.length > 0 && selectedFolder === undefined ? (
              <>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الآيات</Text>
                    <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
                      المفضلة ({arabicNumber(favoriteAyahs.length)})
                    </Text>
                  </View>
                  <OrnamentalRule width={80} color={t.colors.accent} variant="rosette" />
                </View>
                <View style={{ gap: 10 }}>
                  {favoriteAyahs.map((it, idx) => (
                    <Card
                      key={idx}
                      onPress={() => router.push(`/surah/${it.surahId}?ayah=${it.ayahNumber}`)}
                      padding={14}
                      elevation="xs"
                      bordered
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Heart size={18} color={t.colors.error} fill={t.colors.error} />
                        <View style={{ flex: 1 }}>
                          <Text variant="subtitle">{it.surahName}</Text>
                          <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                            الآية {arabicNumber(it.ayahNumber)}
                          </Text>
                        </View>
                        <ChevronLeft size={16} color={t.colors.textTertiary} />
                      </View>
                    </Card>
                  ))}
                </View>
              </>
            ) : null}

            {/* العلامات المرجعية (مع folder filtering) */}
            {filteredBookmarks.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eyebrow, { color: t.colors.accent }]}>المرجعيات</Text>
                    <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
                      {selectedFolder === undefined
                        ? `الكل (${arabicNumber(filteredBookmarks.length)})`
                        : selectedFolder === 'unsorted'
                          ? `غير مصنّفة (${arabicNumber(filteredBookmarks.length)})`
                          : `${folders.find((f) => f.id === selectedFolder)?.nameAr ?? ''} (${arabicNumber(filteredBookmarks.length)})`}
                    </Text>
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  {filteredBookmarks.map((b) => {
                    const surah = getSurahById(b.surahId);
                    const folder = folders.find((f) => f.id === b.folder);
                    return (
                      <Card
                        key={b.id}
                        onPress={() => router.push(`/surah/${b.surahId}?ayah=${b.ayahNumber}`)}
                        padding={14}
                        elevation="xs"
                        bordered
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Bookmark size={18} color={folder?.color ?? t.colors.accent} fill={folder?.color ?? t.colors.accent} />
                          <View style={{ flex: 1 }}>
                            <Text variant="subtitle">{surah?.nameAr}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text variant="caption" color={t.colors.textSecondary}>
                                الآية {arabicNumber(b.ayahNumber)} · صفحة {arabicNumber(b.page)}
                              </Text>
                              {folder ? (
                                <View style={[styles.folderTag, { backgroundColor: (folder.color ?? t.colors.accent) + '14', borderColor: (folder.color ?? t.colors.accent) + '40' }]}>
                                  <FolderIcon name={folder.iconName} size={9} color={folder.color ?? t.colors.accent} />
                                  <Text style={{ color: folder.color ?? t.colors.accent, fontSize: 9, fontWeight: '700' }}>
                                    {folder.nameAr}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                          <Pressable
                            onPress={() => setMoveTarget(b)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="نقل لمجلّد"
                            style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
                          >
                            <MoreHorizontal size={16} color={t.colors.textTertiary} />
                          </Pressable>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </>
            ) : selectedFolder !== undefined ? (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Folder size={32} color={t.colors.textTertiary} />
                <Text variant="bodySm" color={t.colors.textTertiary} style={{ marginTop: 10, textAlign: 'center' }}>
                  لا توجد مرجعيات في هذا المجلّد بعد.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </Screen>

      {/* ───── Modal: إنشاء مجلّد جديد ───── */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCreateOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text variant="h3">مجلّد جديد</Text>
              <Pressable onPress={() => setCreateOpen(false)} hitSlop={10}>
                <X size={20} color={t.colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="اسم المجلّد (مثال: آيات الرحمة)"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.modalInput, { borderColor: t.colors.border, color: t.colors.textPrimary, backgroundColor: t.colors.background }]}
              autoFocus
              onSubmitEditing={handleCreateFolder}
            />
            <Pressable
              onPress={handleCreateFolder}
              disabled={!newFolderName.trim()}
              style={({ pressed }) => [
                styles.modalConfirmBtn,
                {
                  backgroundColor: newFolderName.trim() ? t.colors.primary : t.colors.surfaceAlt,
                  borderColor: t.colors.accent,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Plus size={16} color={newFolderName.trim() ? '#FFF' : t.colors.textTertiary} />
              <Text style={{ color: newFolderName.trim() ? '#FFF' : t.colors.textTertiary, fontWeight: '800' }}>
                إنشاء
              </Text>
            </Pressable>
            <Text variant="caption" color={t.colors.textTertiary} style={{ textAlign: 'center', marginTop: 8 }}>
              ضغطة طويلة على المجلّد لحذفه
            </Text>
          </View>
        </View>
      </Modal>

      {/* ───── Modal: نقل مرجعية إلى مجلّد ───── */}
      <Modal visible={!!moveTarget} transparent animationType="slide" onRequestClose={() => setMoveTarget(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMoveTarget(null)} />
          <View style={[styles.modalSheet, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text variant="h3">انقل إلى مجلّد</Text>
              <Pressable onPress={() => setMoveTarget(null)} hitSlop={10}>
                <X size={20} color={t.colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable
                onPress={() => { if (moveTarget) moveBookmark(moveTarget.id, undefined); setMoveTarget(null); }}
                style={({ pressed }) => [styles.folderListRow, { backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' }]}
              >
                <Folder size={18} color={t.colors.textTertiary} />
                <Text style={{ flex: 1, marginHorizontal: 12, fontSize: 14, fontWeight: '600', color: t.colors.textPrimary }}>
                  غير مصنّفة
                </Text>
                {moveTarget && !moveTarget.folder ? <Check size={16} color={t.colors.accent} /> : null}
              </Pressable>
              {folders.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => { if (moveTarget) moveBookmark(moveTarget.id, f.id); setMoveTarget(null); }}
                  style={({ pressed }) => [styles.folderListRow, { backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' }]}
                >
                  <FolderIcon name={f.iconName} size={18} color={f.color ?? t.colors.accent} />
                  <Text style={{ flex: 1, marginHorizontal: 12, fontSize: 14, fontWeight: '600', color: t.colors.textPrimary }}>
                    {f.nameAr}
                  </Text>
                  {moveTarget?.folder === f.id ? <Check size={16} color={t.colors.accent} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────── FolderChip ───────────────
const FolderChip: React.FC<{
  active: boolean;
  label: string;
  count: number;
  iconName?: string;
  color: string;
  onPress: () => void;
  onLongPress?: () => void;
  t: any;
}> = ({ active, label, count, iconName, color, onPress, onLongPress, t }) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    accessibilityRole="button"
    accessibilityLabel={`${label}، ${count} مرجعية`}
    style={({ pressed }) => [
      styles.folderChip,
      {
        backgroundColor: active ? color + '20' : t.colors.surface,
        borderColor: active ? color : t.colors.borderGold,
        opacity: pressed ? 0.8 : 1,
      },
    ]}
  >
    <FolderIcon name={iconName} size={14} color={active ? color : t.colors.textSecondary} />
    <Text style={{ color: active ? color : t.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
      {label}
    </Text>
    <View style={[styles.folderCountBadge, { backgroundColor: active ? color : t.colors.surfaceAlt }]}>
      <Text style={{ color: active ? '#FFF' : t.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
        {arabicNumber(count)}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 12, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  foldersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  folderCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  folderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalDragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  folderListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
});
