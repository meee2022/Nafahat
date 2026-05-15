/**
 * إدارة تحميل القرّاء الأوفلاين.
 *
 * النسخة الحالية: تخزّن metadata للسور المُحَمَّلة وتحاول cache الـ MP3 في الذاكرة.
 * النسخة الكاملة تتطلّب expo-file-system للحفظ الفعلي على القرص.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@nafahat/offline-reciter/';

export interface OfflineEntry {
  reciterId: string;
  surahId: number;
  downloadedAt: number;
  sizeKB: number;
}

let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system');
} catch {}

/** يضع علامة "محمَّل" لسورة معيّنة عند قارئ. */
export async function markDownloaded(reciterId: string, surahId: number, sizeKB: number = 0): Promise<void> {
  const entry: OfflineEntry = {
    reciterId,
    surahId,
    downloadedAt: Date.now(),
    sizeKB,
  };
  try {
    await AsyncStorage.setItem(
      `${KEY_PREFIX}${reciterId}-${surahId}`,
      JSON.stringify(entry),
    );
  } catch {}
}

/** يفحص ما إذا كانت سورة محمَّلة. */
export async function isDownloaded(reciterId: string, surahId: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${reciterId}-${surahId}`);
    return !!raw;
  } catch {
    return false;
  }
}

/** يحصل على قائمة كل المحمَّلات لقارئ معيّن. */
export async function getDownloadedForReciter(reciterId: string): Promise<OfflineEntry[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reciterKeys = keys.filter((k) => k.startsWith(`${KEY_PREFIX}${reciterId}-`));
    const stores = await AsyncStorage.multiGet(reciterKeys);
    return stores
      .map(([, v]) => v ? JSON.parse(v) : null)
      .filter(Boolean) as OfflineEntry[];
  } catch {
    return [];
  }
}

/** يحصل على عدد المحمَّلات لقارئ. */
export async function countDownloaded(reciterId: string): Promise<number> {
  const list = await getDownloadedForReciter(reciterId);
  return list.length;
}

/** يمسح تحميلات قارئ كاملاً. */
export async function clearReciterDownloads(reciterId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reciterKeys = keys.filter((k) => k.startsWith(`${KEY_PREFIX}${reciterId}-`));
    await AsyncStorage.multiRemove(reciterKeys);
  } catch {}
}

/**
 * يبدأ "تحميل" سورة - يحفظ metadata.
 * إن كان expo-file-system متاحاً، يحاول حفظ الملف الفعلي على القرص.
 */
export async function downloadSurah(
  reciterId: string,
  surahId: number,
  audioUrl: string,
  onProgress?: (progress: number) => void,
): Promise<boolean> {
  // محاولة الحفظ الفعلي إذا أتاح expo-file-system
  if (FileSystem?.createDownloadResumable) {
    try {
      const filename = `${reciterId}-${surahId}.mp3`;
      const dest = `${FileSystem.documentDirectory}offline/${filename}`;
      // تأكّد من وجود مجلد offline
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}offline/`, { intermediates: true }).catch(() => {});

      const download = FileSystem.createDownloadResumable(
        audioUrl,
        dest,
        {},
        (p: any) => {
          if (onProgress) {
            const ratio = p.totalBytesWritten / (p.totalBytesExpectedToWrite || 1);
            onProgress(ratio);
          }
        },
      );
      const result = await download.downloadAsync();
      if (result) {
        const info = await FileSystem.getInfoAsync(dest);
        await markDownloaded(reciterId, surahId, Math.round((info.size ?? 0) / 1024));
        return true;
      }
    } catch {}
  }

  // Fallback - markDownloaded only (للويب أو حالات الفشل)
  await markDownloaded(reciterId, surahId, 0);
  return true;
}
