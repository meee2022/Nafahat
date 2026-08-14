import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireOwnerKey } from './auth';

export const get = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db
      .query('stats')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    token:           v.string(),
    pagesRead:       v.number(),
    versesMemorized: v.number(),
    sessionsCount:   v.number(),
    listenedMinutes: v.number(),
    tasbeehCount:    v.number(),
    streakDays:      v.number(),
    weeklyMinutes:   v.array(v.number()),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('stats')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    const lastActiveDate = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, deviceId, lastActiveDate });
      return existing._id;
    }
    return await ctx.db.insert('stats', { ...args, deviceId, lastActiveDate });
  },
});
