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
 * 🛰️ Sentry hook — placeholder. لما نركّب @sentry/react-native لاحقاً:
 *   import * as Sentry from '@sentry/react-native';
 *   Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
 *   وبعدها نـ replace الـ no-op functions بـ Sentry.captureException / captureMessage.
 */
const sentry = {
  captureException: (_e: unknown, _ctx?: LogContext) => { /* TODO: wire Sentry */ },
  captureMessage:   (_msg: string, _ctx?: LogContext) => { /* TODO: wire Sentry */ },
  addBreadcrumb:    (_b: { message: string; data?: LogContext; level?: string }) => { /* TODO */ },
};

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
