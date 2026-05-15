/**
 * إعداد عميل Convex لتطبيق نَفَحات.
 *
 * - نُنشئ ConvexReactClient واحد على مستوى التطبيق.
 * - إذا لم يكن URL مُعرَّفًا أو فشلت الاستيرادات - يعمل التطبيق دون مزامنة (offline-first).
 * - الاستيراد محصور داخل try/catch + lazy لكي لا يكسر بناء المشروع
 *   إذا لم تُثبَّت حزمة convex بعد.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONVEX_URL: string | undefined = process.env.EXPO_PUBLIC_CONVEX_URL;

let _convex: unknown = null;
let _ConvexProviderImpl: React.ComponentType<{ client: unknown; children: React.ReactNode }> | null = null;

if (CONVEX_URL) {
  try {
    // require الديناميكي حتى لا يفشل البناء إذا لم تُثبَّت convex بعد
    const mod = require('convex/react');
    _ConvexProviderImpl = mod.ConvexProvider;
    _convex = new mod.ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false });
  } catch {
    if (__DEV__) {
      console.warn(
        '[nafahat] لم يتم تحميل حزمة convex. شغّل `npm install` لتفعيل المزامنة السحابية.',
      );
    }
  }
}

interface ConvexClientShape {
  query: (name: any, args: unknown) => Promise<any>;
  mutation: (name: any, args: unknown) => Promise<any>;
}

export const convex = _convex as null | ConvexClientShape;
export const ConvexProviderImpl = _ConvexProviderImpl;

// ───── محاولة تحميل الـ generated API (يعمل بعد `npx convex dev`) ─────
let _api: any = null;
try {
  const apiMod = require('../../convex/_generated/api');
  _api = apiMod.api;
} catch {
  // _generated مش موجود لسه - الـ Convex auth مش متاح
}
export const convexApi = _api;

const DEVICE_KEY = '@nafahat/device-id';
let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  } catch {
    return 'dev-anon';
  }
}

export const isCloudEnabled = (): boolean => !!_convex;
