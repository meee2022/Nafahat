import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query('bookmarks')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .order('desc')
      .collect();
  },
});

export const add = mutation({
  args: {
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    page:       v.number(),
    note:       v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // تجنب التكرار
    const existing = await ctx.db
      .query('bookmarks')
      .withIndex('by_device_surah', (q) =>
        q.eq('deviceId', args.deviceId).eq('surahId', args.surahId),
      )
      .filter((q) => q.eq(q.field('ayahNumber'), args.ayahNumber))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert('bookmarks', { ...args, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: {
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, { deviceId, surahId, ayahNumber }) => {
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
