/**
 * تخزين واسترجاع صور صفحات مصحف المدينة من Convex Storage.
 *
 * كيف يشتغل:
 *   ١. الـ Admin يرفع الـ 604 صورة مرة واحدة عبر السكربت
 *   ٢. كل صفحة يبقى لها storageId مخزن في جدول mushafPages
 *   ٣. التطبيق يطلب URL للصفحة → Convex يرجّع URL موثوق من CDN بتاعهم
 *   ٤. CORS مش مشكلة لأنها storage بتاعتنا
 *   ٥. سريعة جداً (Convex CDN عالمي)
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * يرجع URL مباشر لصورة صفحة معيّنة.
 * يستخدمه التطبيق لعرض الصفحات.
 */
export const getPageUrl = query({
  args: { page: v.number() },
  handler: async (ctx, { page }) => {
    const record = await ctx.db
      .query('mushafPages')
      .withIndex('by_page', (q) => q.eq('page', page))
      .first();
    if (!record) return null;
    return await ctx.storage.getUrl(record.storageId);
  },
});

/**
 * يرجع URLs لنطاق من الصفحات (للـ prefetch).
 */
export const getPageRangeUrls = query({
  args: { fromPage: v.number(), toPage: v.number() },
  handler: async (ctx, { fromPage, toPage }) => {
    const records = await ctx.db
      .query('mushafPages')
      .collect();
    const filtered = records.filter((r) => r.page >= fromPage && r.page <= toPage);
    const result: Record<number, string | null> = {};
    for (const r of filtered) {
      result[r.page] = await ctx.storage.getUrl(r.storageId);
    }
    return result;
  },
});

/**
 * يخزّن صورة لصفحة معيّنة.
 * يستخدمه الـ Admin من السكربت لتعبئة الـ 604 صورة.
 *
 * Workflow:
 *   ١. الـ client يحمّل الصورة من مصدر ما
 *   ٢. ينشئ uploadUrl من Convex
 *   ٣. يرفع الـ blob إلى الـ uploadUrl → ياخد storageId
 *   ٤. يستدعي savePageImage مع الـ storageId ورقم الصفحة
 */
export const savePageImage = mutation({
  args: {
    page: v.number(),
    storageId: v.id('_storage'),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // تحقّق إن الـ caller أدمن
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return { ok: false, error: 'not-authenticated' };
    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== 'admin') return { ok: false, error: 'forbidden' };

    // لو الصفحة موجودة، استبدل
    const existing = await ctx.db
      .query('mushafPages')
      .withIndex('by_page', (q) => q.eq('page', args.page))
      .first();

    if (existing) {
      // احذف الصورة القديمة من الـ storage
      await ctx.storage.delete(existing.storageId);
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        uploadedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('mushafPages', {
        page: args.page,
        storageId: args.storageId,
        uploadedAt: Date.now(),
      });
    }

    return { ok: true as const };
  },
});

/**
 * ينشئ URL مؤقت للرفع (يحتاج token أدمن).
 */
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== 'admin') return null;
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * يرجع إحصائيات الصفحات المُحمّلة (للأدمن).
 */
export const getUploadStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== 'admin') return null;

    const records = await ctx.db.query('mushafPages').collect();
    const uploadedPages = records.map((r) => r.page).sort((a, b) => a - b);
    const missingPages: number[] = [];
    for (let p = 1; p <= 604; p++) {
      if (!uploadedPages.includes(p)) missingPages.push(p);
    }

    return {
      total: 604,
      uploaded: records.length,
      missing: missingPages.length,
      missingPages: missingPages.slice(0, 50), // أول 50 ناقصة
    };
  },
});
