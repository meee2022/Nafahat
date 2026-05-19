/**
 * 📝 Logger wrapper — single place for logging across the app.
 *
 * - في development: يطبع للـ console بألوان واضحة
 * - في production: متصل بـ Sentry/Bugsnag بمجرد ما الـ DSN يتركّب
 *
 * استخدام:
 *   import { log } from '@utils/logger';
 *   log.info('user signed in', { userId });
 *   log.error('audio failed', err);
 *   log.warn('timing missing', { surahId });
 *
 * الميزة: بدل ما نـ scatter `.catch(() => {})` في كل مكان، نستخدم
 *  `.catch(log.error)` ويكون عندنا visibility في الإنتاج بدون تشخيص يدوي.
 *
 * 🔌 Integration ports:
 *  - sentryDsn يُضبَط في .env بـ EXPO_PUBLIC_SENTRY_DSN
 *  - لو DSN موجود، captureException + captureMessage يبعتوا للسرفر
 *  - حتى لو DSN فاضي، الـ console.* بيشتغل في الـ dev
 */

type LogContext = Record<string, unknown>;

const isDev = (typeof __DEV__ !== 'undefined') ? __DEV__ : (process.env.NODE_ENV !== 'production');

/**
 * 🛰️ Sentry integration — graceful: يشتغل لو الـ package متركّب والـ DSN موجود،
 *   وإلا يفضل no-op.
 *
 *   لتفعيل Sentry فعلياً:
 *     1. npm install @sentry/react-native
 *     2. ضع EXPO_PUBLIC_SENTRY_DSN في .env
 *     3. (iOS) cd ios && pod install
 *     4. أعد بناء التطبيق
 *
 *   الـ require الـ try/catch يحمي build لو الـ package لسه ما تركّبش.
 */
let SentryLib: any = null;
let sentryReady = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SentryLib = require('@sentry/react-native');
  const dsn = (process.env.EXPO_PUBLIC_SENTRY_DSN ?? '').trim();
  if (dsn && SentryLib?.init) {
    SentryLib.init({
      dsn,
      tracesSampleRate: 0.2,
      enableInExpoDevelopment: false,
      debug: false,
    });
    sentryReady = true;
  }
} catch {
  // Sentry غير متركّب - نشتغل بدونه
}

const sentry = {
  captureException: (e: unknown, ctx?: LogContext) => {
    if (sentryReady && SentryLib?.captureException) {
      try { SentryLib.captureException(e, { extra: ctx ?? {} }); } catch {}
    }
  },
  captureMessage: (msg: string, ctx?: LogContext) => {
    if (sentryReady && SentryLib?.captureMessage) {
      try { SentryLib.captureMessage(msg, { extra: ctx ?? {} }); } catch {}
    }
  },
  addBreadcrumb: (b: { message: string; data?: LogContext; level?: string }) => {
    if (sentryReady && SentryLib?.addBreadcrumb) {
      try { SentryLib.addBreadcrumb(b as any); } catch {}
    }
  },
};

/** Public flag — لتعرف لو Sentry فعّال أو لا (للـ UI debug screens) */
export const isSentryActive = () => sentryReady;

/**
 * 🎁 يلفّ مكوّن root بـ Sentry للـ performance monitoring + Error Boundary native.
 *   لو Sentry غير فعّال، يرجع نفس المكوّن بدون تغيير (no-op).
 *   استخدم في app/_layout.tsx: `export default sentryWrap(RootLayout);`
 */
export function sentryWrap<T>(component: T): T {
  if (sentryReady && SentryLib?.wrap) {
    try {
      return SentryLib.wrap(component as any) as T;
    } catch {
      return component;
    }
  }
  return component;
}

/**
 * 🏷️ يسجّل user context للـ Sentry — يساعد في tracking errors per-user.
 *   مرّر null للـ logout.
 */
export function setSentryUser(user: { id?: string; email?: string; username?: string } | null) {
  if (sentryReady && SentryLib?.setUser) {
    try { SentryLib.setUser(user as any); } catch {}
  }
}

function fmt(msg: string, ctx?: LogContext): string {
  if (!ctx || Object.keys(ctx).length === 0) return msg;
  try {
    return `${msg} ${JSON.stringify(ctx)}`;
  } catch {
    return msg;
  }
}

export const log = {
  /** معلومة عادية - debug في الـ dev، breadcrumb في الـ production */
  info(msg: string, ctx?: LogContext) {
    if (isDev) console.log(`[INFO] ${fmt(msg, ctx)}`);
    sentry.addBreadcrumb({ message: msg, data: ctx, level: 'info' });
  },

  /** تحذير - يطبع في الـ dev، captureMessage في production */
  warn(msg: string, ctx?: LogContext) {
    if (isDev) console.warn(`[WARN] ${fmt(msg, ctx)}`);
    sentry.captureMessage(msg, { ...ctx, level: 'warning' });
  },

  /** خطأ - يطبع في الـ dev، captureException في production */
  error(msg: string | Error, ctx?: LogContext) {
    const err = msg instanceof Error ? msg : new Error(msg);
    if (isDev) console.error(`[ERROR] ${err.message}`, err.stack, ctx);
    sentry.captureException(err, ctx);
  },

  /** silent — للـ catch handlers اللي مش بنهتم بيها فعلاً
   *  لكن في production لو DSN موجود، يتسجّل كـ low-priority breadcrumb */
  silent(msg: string, ctx?: LogContext) {
    if (isDev) console.log(`[SILENT] ${fmt(msg, ctx)}`);
    sentry.addBreadcrumb({ message: msg, data: ctx, level: 'debug' });
  },
};

/**
 * Helper to wrap a promise: catches errors and logs them with context.
 *  await safe(myPromise(), 'audio.load', { surahId })
 */
export async function safe<T>(p: Promise<T>, label: string, ctx?: LogContext): Promise<T | undefined> {
  try {
    return await p;
  } catch (e) {
    log.error(`${label}: ${(e as Error)?.message ?? String(e)}`, ctx);
    return undefined;
  }
}
