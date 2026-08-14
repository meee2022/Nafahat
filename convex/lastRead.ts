import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireOwnerKey } from './auth';

export const get = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db
      .query('lastRead')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
  },
});

export const set = mutation({
  args: {
    token:      v.string(),
    surahId:    v.number(),
    surahName:  v.string(),
    ayahNumber: v.number(),
    page:       v.number(),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('lastRead')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, deviceId, updatedAt });
      return existing._id;
    }
    return await ctx.db.insert('lastRead', { ...args, deviceId, updatedAt });
  },
});
