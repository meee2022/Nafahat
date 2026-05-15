import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const get = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) =>
    ctx.db
      .query('lastRead')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique(),
});

export const set = mutation({
  args: {
    deviceId:   v.string(),
    surahId:    v.number(),
    surahName:  v.string(),
    ayahNumber: v.number(),
    page:       v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('lastRead')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
      .unique();
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt });
      return existing._id;
    }
    return await ctx.db.insert('lastRead', { ...args, updatedAt });
  },
});
