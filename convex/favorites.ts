import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireOwnerKey } from './auth';

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db.query('favorites').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect();
  },
});

export const toggle = mutation({
  args: {
    token:      v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .filter((q) =>
        q.and(
          q.eq(q.field('surahId'), args.surahId),
          q.eq(q.field('ayahNumber'), args.ayahNumber),
        ),
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert('favorites', { ...args, deviceId, createdAt: Date.now() });
    return true;
  },
});

export const replaceAll = mutation({
  args: {
    token: v.string(),
    favorites: v.array(v.object({ surahId: v.number(), ayahNumber: v.number() })),
  },
  handler: async (ctx, { token, favorites }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .collect();
    for (const item of existing) await ctx.db.delete(item._id);
    const unique = new Map(favorites.map((item) => [`${item.surahId}:${item.ayahNumber}`, item]));
    for (const item of unique.values()) {
      await ctx.db.insert('favorites', { ...item, deviceId, createdAt: Date.now() });
    }
    return unique.size;
  },
});
