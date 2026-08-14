import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireOwnerKey } from './auth';

export const get = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return await ctx.db
      .query('profiles')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    token:      v.string(),
    name:       v.string(),
    role:       v.union(
      v.literal('guest'), v.literal('student'),
      v.literal('teacher'), v.literal('child'), v.literal('elder'),
    ),
    avatarSeed: v.string(),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
        avatarSeed: args.avatarSeed,
        lastActive: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert('profiles', {
      ...args,
      deviceId,
      joinedAt: Date.now(),
      streakDays: 0,
      lastActive: Date.now(),
    });
  },
});
