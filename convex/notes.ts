import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { assertOwnedRecord, requireOwnerKey } from './auth';

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return await ctx.db
      .query('notes')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .order('desc')
      .collect();
  },
});

export const create = mutation({
  args: {
    token:      v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    body:       v.string(),
    tags:       v.array(v.string()),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const now = Date.now();
    return await ctx.db.insert('notes', { ...args, deviceId, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id:   v.id('notes'),
    body: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { token, id, body, tags }) => {
    await assertOwnedRecord(ctx, token, await ctx.db.get(id));
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body !== undefined) patch.body = body;
    if (tags !== undefined) patch.tags = tags;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id('notes') },
  handler: async (ctx, { token, id }) => {
    await assertOwnedRecord(ctx, token, await ctx.db.get(id));
    await ctx.db.delete(id);
  },
});
