/**
 * إعداد عميل Convex لتطبيق نَفَحات.
 *
 * - نُنشئ ConvexReactClient واحد على مستوى التطبيق.
 * - إذا لم يكن URL مُعرَّفًا أو فشلت الاستيرادات - يعمل التطبيق دون مزامنة (offline-first).
 * - الاستيراد محصور داخل try/catch + lazy لكي لا يكسر بناء المشروع
 *   إذا لم تُثبَّت حزمة convex بعد.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔒 العنوان مكتوب صريح كـ fallback مضمون — لأن بناء production المحلي مبيضمّنش
//    متغيّرات .env / eas.json دايماً. العنوان ده عام (EXPO_PUBLIC) وآمن للتضمين.
export const CONVEX_URL: string =
  process.env.EXPO_PUBLIC_CONVEX_URL || 'https://shiny-kiwi-78.eu-west-1.convex.cloud';

let _convex: unknown = null;
let _ConvexProviderImpl: React.ComponentType<{ client: unknown; children: React.ReactNode }> | null = null;
// 🔍 تشخيص مؤقت: نلتقط سبب فشل إنشاء عميل Convex (لو حصل) ليظهر في الواجهة.
let _convexInitError = '';

if (CONVEX_URL) {
  try {
    // 🔑 ConvexHttpClient أخف وأثبت في React Native الإنتاجي — لا يعتمد على
    //    WebSocket مثل ConvexReactClient (الذي يفشل أحياناً في الإنشاء على Hermes
    //    في نسخ الإنتاج فيصير العميل null → "تعذّر الاتصال"). التطبيق يستخدم
    //    mutation/query فقط (لا توجد hooks)، فهذا العميل كافٍ تماماً.
    const { ConvexHttpClient } = require('convex/browser');
    _convex = new ConvexHttpClient(CONVEX_URL);
  } catch (e: any) {
    _convexInitError = `client: ${e?.message ?? String(e)}`;
    if (__DEV__) console.warn('[nafahat] فشل إنشاء عميل convex:', e);
  }
} else {
  _convexInitError = 'no-url';
}

interface ConvexClientShape {
  query: (name: any, args: unknown) => Promise<any>;
  mutation: (name: any, args: unknown) => Promise<any>;
}

export const convex = _convex as null | ConvexClientShape;
export const ConvexProviderImpl = _ConvexProviderImpl;

// ───── مراجع دوال الـ API ─────
//   ❌ require('../../convex/_generated/api') بيفشل في الإنتاج ("Cannot find module")
//      لأن مجلد convex/ مش بيتضمّن في الـ bundle بتاع الإنتاج.
//   ✅ الملف المولّد أصلاً مجرّد `export const api = anyApi`، و anyApi موجود في
//      مكتبة convex نفسها (متضمّنة في الـ bundle) — فنستخدمه مباشرةً.
//      anyApi هو Proxy: anyApi.users.signInWithApple → مرجع الدالة "users:signInWithApple".
let _api: any = null;
try {
  const { anyApi } = require('convex/server');
  _api = anyApi;
} catch (e: any) {
  _convexInitError += ` | api: ${e?.message ?? String(e)}`;
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
