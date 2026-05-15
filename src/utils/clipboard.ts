/**
 * أداة نسخ النص - cross-platform.
 * يعمل على Web فوراً (navigator.clipboard)
 * يتدرّج على Native لـ expo-clipboard إن وُجد، وإلا يستخدم Share كبديل.
 */
import { Platform, Share } from 'react-native';

let ExpoClipboard: any = null;
if (Platform.OS !== 'web') {
  try {
    ExpoClipboard = require('expo-clipboard');
  } catch {}
}

/** ينسخ نصاً للحافظة. يرجع true إذا نجح. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // fallback - استخدام document.execCommand للمتصفّحات القديمة
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    }

    if (ExpoClipboard?.setStringAsync) {
      await ExpoClipboard.setStringAsync(text);
      return true;
    }

    // Fallback نهائي - استخدم Share
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}

/** يشارك نصاً عبر واجهة المشاركة الأصلية. */
export async function shareText(text: string, title?: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && (navigator as any)?.share) {
      await (navigator as any).share({ text, title });
      return;
    }
    await Share.share({ message: text, title });
  } catch {}
}
