/**
 * 🔐 طبقة تخزين آمنة للأسرار (tokens, credentials).
 *
 * تستخدم expo-secure-store لو متاح (Keychain على iOS، EncryptedSharedPreferences على Android)،
 * وإلا تسقط على AsyncStorage مع تحذير في console.
 *
 * كيف تتطوّر تلقائياً:
 *   - الآن: AsyncStorage (لأن expo-secure-store غير مثبّت).
 *   - بعد `npx expo install expo-secure-store` + rebuild: ينتقل تلقائياً للتخزين المشفّر.
 *
 * استخدامه فقط للبيانات الحساسة:
 *   ✅ tokens, session IDs, OAuth credentials
 *   ❌ تفضيلات UI أو state عام (استخدم AsyncStorage مباشرة)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStore: SecureStoreModule | null = null;
let warnedFallback = false;

// محاولة تحميل expo-secure-store - سيفشل بأمان لو غير مثبّت
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-secure-store');
  if (mod && typeof mod.getItemAsync === 'function') {
    secureStore = mod as SecureStoreModule;
  }
} catch {
  // الحزمة غير مثبّتة - سنستخدم AsyncStorage كبديل
}

function warnFallbackOnce() {
  if (warnedFallback) return;
  warnedFallback = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[secureStorage] expo-secure-store غير مثبّت — استخدام AsyncStorage مؤقتاً.\n' +
    'لتأمين الـ tokens، شغّل: `npx expo install expo-secure-store` ثم rebuild.',
  );
}

export async function secureGet(key: string): Promise<string | null> {
  if (secureStore) {
    try { return await secureStore.getItemAsync(key); } catch { return null; }
  }
  warnFallbackOnce();
  try { return await AsyncStorage.getItem(key); } catch { return null; }
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (secureStore) {
    try { await secureStore.setItemAsync(key, value); return; } catch {}
  }
  warnFallbackOnce();
  try { await AsyncStorage.setItem(key, value); } catch {}
}

export async function secureDelete(key: string): Promise<void> {
  if (secureStore) {
    try { await secureStore.deleteItemAsync(key); return; } catch {}
  }
  warnFallbackOnce();
  try { await AsyncStorage.removeItem(key); } catch {}
}

/** هل التخزين الآمن مفعّل فعلاً (expo-secure-store موجود). */
export function isSecureStorageAvailable(): boolean {
  return secureStore !== null;
}
