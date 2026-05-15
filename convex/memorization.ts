import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

const statusValidator = v.union(
  v.literal('new'), v.literal('learning'),
  v.literal('memorized'), v.literal('review'),
);
const strengthValidator = v.union(v.literal('weak'), v.literal('medium'), v.literal('strong'));

// ----- خطط -----
export const listPlans = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) =>
    ctx.db.query('memoPlans').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect(),
});

export const createPlan = mutation({
  args: {
    deviceId:     v.string(),
    title:        v.string(),
    unit:         v.union(v.literal('ayah'), v.literal('page'), v.literal('hizb')),
    dailyAmount:  v.number(),
    startSurah:   v.number(),
    endSurah:     v.number(),
    daysPerWeek:  v.number(),
    reminderTime: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('memoPlans', { ...args, createdAt: Date.now(), active: true }),
});

export const deletePlan = mutation({
  args: { id: v.id('memoPlans') },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ----- مهام -----
export const listTasks = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) =>
    ctx.db.query('memoTasks').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect(),
});

export const dueTasks = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
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
    deviceId: v.string(),
    surahId:  v.number(),
    ayahFrom: v.number(),
    ayahTo:   v.number(),
    status:   statusValidator,
  },
  handler: async (ctx, args) =>
    ctx.db.insert('memoTasks', {
      ...args,
      strength: 'weak',
      reviewIntervalDays: 1,
      repetitions: 0,
    }),
});

export const updateTaskReview = mutation({
  args: {
    id:                 v.id('memoTasks'),
    strength:           strengthValidator,
    reviewIntervalDays: v.number(),
    nextReviewAt:       v.number(),
    repetitions:        v.number(),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, { ...patch, lastReviewedAt: Date.now(), status: 'memorized' });
  },
});

export const deleteTask = mutation({
  args: { id: v.id('memoTasks') },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
