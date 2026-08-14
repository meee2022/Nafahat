import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireOwnerKey } from './auth';

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return await ctx.db
      .query('bookmarks')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .order('desc')
      .collect();
  },
});

export const add = mutation({
  args: {
    token:      v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    page:       v.number(),
    note:       v.optional(v.string()),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    // تجنب التكرار
    const existing = await ctx.db
      .query('bookmarks')
      .withIndex('by_device_surah', (q) =>
        q.eq('deviceId', deviceId).eq('surahId', args.surahId),
      )
      .filter((q) => q.eq(q.field('ayahNumber'), args.ayahNumber))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert('bookmarks', { ...args, deviceId, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: {
    token:      v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, { token, surahId, ayahNumber }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const docs = await ctx.db
      .query('bookmarks')
      .withIndex('by_device_surah', (q) =>
        q.eq('deviceId', deviceId).eq('surahId', surahId),
      )
      .filter((q) => q.eq(q.field('ayahNumber'), ayahNumber))
      .collect();
    for (const d of docs) await ctx.db.delete(d._id);
  },
});

export const replaceAll = mutation({
  args: {
    token: v.string(),
    bookmarks: v.array(v.object({
      surahId: v.number(),
      ayahNumber: v.number(),
      page: v.number(),
      note: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { token, bookmarks }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('bookmarks')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .collect();
    for (const item of existing) await ctx.db.delete(item._id);
    const unique = new Map(bookmarks.map((item) => [`${item.surahId}:${item.ayahNumber}`, item]));
    for (const item of unique.values()) {
      await ctx.db.insert('bookmarks', { ...item, deviceId, createdAt: Date.now() });
    }
    return unique.size;
  },
});
