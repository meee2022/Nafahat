import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const get = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) =>
    ctx.db
      .query('stats')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique(),
});

export const upsert = mutation({
  args: {
    deviceId:        v.string(),
    pagesRead:       v.number(),
    versesMemorized: v.number(),
    sessionsCount:   v.number(),
    listenedMinutes: v.number(),
    tasbeehCount:    v.number(),
    streakDays:      v.number(),
    weeklyMinutes:   v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('stats')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
      .unique();
    const lastActiveDate = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, lastActiveDate });
      return existing._id;
    }
    return await ctx.db.insert('stats', { ...args, lastActiveDate });
  },
});
