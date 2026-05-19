/**
 * 📤 Export user data — حقّ المستخدم في أخذ بياناته معه.
 *
 * يجمع كل الـ state من كل الـ stores ويرجّعهم كـ JSON. المستخدم يقدر:
 *  1. ينسخ الـ JSON للـ clipboard
 *  2. يشاركه (email, drive, إلخ)
 *  3. يحفظه في ملف لو حابب backup يدوي قبل ما الـ cloud sync الحقيقي يجهز
 *
 * المحتوى الـ exported:
 *  - lastRead, bookmarks, favorites, notes (readingStore)
 *  - memorization plans + tasks (memoStore)
 *  - reading goals + streak (wirdStore)
 *  - stats (statsStore)
 *  - tasbeeh history
 *  - khatma plans + history
 *  - preferred reciter, location (settingsStore)
 *  - language preference (languageStore)
 *
 * ملاحظة: ما بنـ export الـ audio files أو الـ cached tafsir — لأنهم heavy
 *  ويتعاد تحميلهم.
 */
import { useReadingStore } from '@store/readingStore';
import { useMemoStore } from '@store/memorizationStore';
import { useWirdStore } from '@store/wirdStore';
import { useStatsStore } from '@store/statsStore';
import { useTasbeehStore } from '@store/tasbeehStore';
import { useKhatmaStore } from '@store/khatmaStore';
import { useSettingsStore } from '@store/settingsStore';
import { useUserPrefsStore } from '@store/userPrefsStore';
import { useLanguageStore } from '@store/languageStore';

export interface ExportedUserData {
  /** نسخة الـ schema للترقية المستقبلية */
  version: string;
  exportedAt: string;
  appName: 'Nafahat';

  reading: {
    lastRead: unknown;
    bookmarks: unknown[];
    bookmarkFolders: unknown[];
    notes: unknown[];
    favorites: string[];
  };
  memorization: {
    plans: unknown[];
    tasks: unknown[];
  };
  wird: unknown;
  stats: unknown;
  tasbeeh: unknown;
  khatma: unknown;
  settings: unknown;
  userPrefs: unknown;
  language: { code: string };
}

/**
 * يجمع كل بيانات المستخدم في object واحد جاهز للـ JSON.stringify.
 */
export function buildExport(): ExportedUserData {
  const reading = useReadingStore.getState();
  const memo = useMemoStore.getState();
  const wird = useWirdStore.getState();
  const stats = useStatsStore.getState();
  const tasbeeh = useTasbeehStore.getState();
  const khatma = useKhatmaStore.getState();
  const settings = useSettingsStore.getState();
  const userPrefs = useUserPrefsStore.getState();
  const language = useLanguageStore.getState();

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    appName: 'Nafahat',
    reading: {
      lastRead: reading.lastRead,
      bookmarks: reading.bookmarks,
      bookmarkFolders: reading.bookmarkFolders,
      notes: reading.notes,
      favorites: reading.favorites,
    },
    memorization: {
      plans: memo.plans,
      tasks: memo.tasks,
    },
    wird: {
      dailyTarget: wird.dailyTarget,
      pagesReadToday: wird.pagesReadToday,
      completedDays: wird.completedDays,
    },
    stats: stats.stats,
    tasbeeh: {
      items: tasbeeh.items,
      selectedId: tasbeeh.selectedId,
      todayCount: tasbeeh.todayCount,
    },
    khatma: {
      activePlan: khatma.activePlan,
      history: khatma.history,
    },
    settings: {
      preferredReciterId: settings.preferredReciterId,
      location: settings.location,
      adhanVoice: settings.adhanVoice,
      mushafMode: settings.mushafMode,
    },
    userPrefs: {
      level: userPrefs.level,
      goal: userPrefs.goal,
      reminderTime: userPrefs.reminderTime,
      dailyPageGoal: userPrefs.dailyPageGoal,
    },
    language: { code: language.lang },
  };
}

/**
 * يرجّع الـ data كـ JSON string جاهز للـ copy/share.
 */
export function exportAsJsonString(): string {
  return JSON.stringify(buildExport(), null, 2);
}

/**
 * يرجّع summary مختصر للعرض في UI (مثلاً "5 خطط حفظ، 23 مرجعية، ...").
 */
export function summarizeExport(): { label: string; count: number }[] {
  const data = buildExport();
  return [
    { label: 'مرجعية',       count: (data.reading.bookmarks as unknown[]).length },
    { label: 'مفضّلة',        count: data.reading.favorites.length },
    { label: 'ملاحظة',        count: (data.reading.notes as unknown[]).length },
    { label: 'مجلّد',         count: (data.reading.bookmarkFolders as unknown[]).length },
    { label: 'خطة حفظ',       count: (data.memorization.plans as unknown[]).length },
    { label: 'مهمة حفظ',      count: (data.memorization.tasks as unknown[]).length },
  ];
}
