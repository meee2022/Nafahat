import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query('notes')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .order('desc')
      .collect();
  },
});

export const create = mutation({
  args: {
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    body:       v.string(),
    tags:       v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('notes', { ...args, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: {
    id:   v.id('notes'),
    body: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, body, tags }) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body !== undefined) patch.body = body;
    if (tags !== undefined) patch.tags = tags;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('notes') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
