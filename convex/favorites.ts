import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) =>
    ctx.db.query('favorites').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect(),
});

export const toggle = mutation({
  args: {
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
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
    await ctx.db.insert('favorites', { ...args, createdAt: Date.now() });
    return true;
  },
});
