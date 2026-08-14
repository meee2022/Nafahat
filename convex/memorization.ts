import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { assertOwnedRecord, requireOwnerKey } from './auth';

const statusValidator = v.union(
  v.literal('new'), v.literal('learning'),
  v.literal('memorized'), v.literal('review'),
);
const strengthValidator = v.union(v.literal('weak'), v.literal('medium'), v.literal('strong'));

// ----- خطط -----
export const listPlans = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db.query('memoPlans').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect();
  },
});

export const createPlan = mutation({
  args: {
    token:        v.string(),
    title:        v.string(),
    unit:         v.union(v.literal('ayah'), v.literal('page'), v.literal('hizb')),
    dailyAmount:  v.number(),
    startSurah:   v.number(),
    endSurah:     v.number(),
    daysPerWeek:  v.number(),
    reminderTime: v.string(),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db.insert('memoPlans', { ...args, deviceId, createdAt: Date.now(), active: true });
  },
});

export const deletePlan = mutation({
  args: { token: v.string(), id: v.id('memoPlans') },
  handler: async (ctx, { token, id }) => {
    await assertOwnedRecord(ctx, token, await ctx.db.get(id));
    await ctx.db.delete(id);
  },
});

// ----- مهام -----
export const listTasks = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db.query('memoTasks').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect();
  },
});

export const dueTasks = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    const now = Date.now();
    const all = await ctx.db
      .query('memoTasks')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .collect();
    return all.filter((t) => t.status !== 'new' && (t.nextReviewAt ?? 0) <= now);
  },
});

export const createTask = mutation({
  args: {
    token:    v.string(),
    surahId:  v.number(),
    ayahFrom: v.number(),
    ayahTo:   v.number(),
    status:   statusValidator,
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwnerKey(ctx, token);
    return ctx.db.insert('memoTasks', {
      ...args,
      deviceId,
      strength: 'weak',
      reviewIntervalDays: 1,
      repetitions: 0,
    });
  },
});

export const updateTaskReview = mutation({
  args: {
    token:              v.string(),
    id:                 v.id('memoTasks'),
    strength:           strengthValidator,
    reviewIntervalDays: v.number(),
    nextReviewAt:       v.number(),
    repetitions:        v.number(),
  },
  handler: async (ctx, { token, id, ...patch }) => {
    await assertOwnedRecord(ctx, token, await ctx.db.get(id));
    await ctx.db.patch(id, { ...patch, lastReviewedAt: Date.now(), status: 'memorized' });
  },
});

export const deleteTask = mutation({
  args: { token: v.string(), id: v.id('memoTasks') },
  handler: async (ctx, { token, id }) => {
    await assertOwnedRecord(ctx, token, await ctx.db.get(id));
    await ctx.db.delete(id);
  },
});
