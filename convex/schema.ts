/**
 * Convex schema لتطبيق نَفَحات.
 *
 * بعد تشغيل `npx convex dev` لأول مرة، سيتم رفع هذا المخطط تلقائيًا
 * إلى deployment الذي حدّدته. كل جدول مفهرس بـ deviceId/userId للسماح
 * بمستخدم ضيف (بدون تسجيل) أو حساب كامل (مستقبلًا).
 */

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ----------------- الحسابات (Authentication) -----------------
  users: defineTable({
    email:        v.string(),                          // البريد - فريد (lowercase)
    name:         v.string(),                          // الاسم المعروض
    passwordHash: v.string(),                          // hash للباسورد
    avatarSeed:   v.string(),                          // bdz seed لتوليد الأفاتار
    joinedAt:     v.number(),                          // تاريخ التسجيل
    role:         v.union(v.literal('user'), v.literal('admin')),
    emailVerified: v.boolean(),                        // تأكيد الإيميل (مستقبلاً)
    lastLoginAt:  v.optional(v.number()),
  })
    .index('by_email', ['email']),

  // ----------------- جلسات تسجيل الدخول (tokens) -----------------
  authSessions: defineTable({
    userId:    v.id('users'),
    token:     v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId']),

  // ----------------- المستخدمون والملفات الشخصية -----------------
  profiles: defineTable({
    deviceId:   v.string(),                     // معرف الجهاز (UUID محلي)
    name:       v.string(),
    role:       v.union(
      v.literal('guest'), v.literal('student'),
      v.literal('teacher'), v.literal('child'), v.literal('elder'),
    ),
    avatarSeed: v.string(),
    joinedAt:   v.number(),
    streakDays: v.number(),
    lastActive: v.number(),
  })
    .index('by_device', ['deviceId']),

  // ----------------- علامات مرجعية -----------------
  bookmarks: defineTable({
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    page:       v.number(),
    note:       v.optional(v.string()),
    createdAt:  v.number(),
  })
    .index('by_device', ['deviceId'])
    .index('by_device_surah', ['deviceId', 'surahId']),

  // ----------------- ملاحظات/تأملات -----------------
  notes: defineTable({
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    body:       v.string(),
    tags:       v.array(v.string()),
    createdAt:  v.number(),
    updatedAt:  v.number(),
  })
    .index('by_device', ['deviceId'])
    .index('by_device_surah', ['deviceId', 'surahId']),

  // ----------------- مفضلة (آيات) -----------------
  favorites: defineTable({
    deviceId:   v.string(),
    surahId:    v.number(),
    ayahNumber: v.number(),
    createdAt:  v.number(),
  })
    .index('by_device', ['deviceId']),

  // ----------------- آخر موضع قراءة -----------------
  lastRead: defineTable({
    deviceId:   v.string(),
    surahId:    v.number(),
    surahName:  v.string(),
    ayahNumber: v.number(),
    page:       v.number(),
    updatedAt:  v.number(),
  })
    .index('by_device', ['deviceId']),

  // ----------------- خطط الحفظ -----------------
  memoPlans: defineTable({
    deviceId:     v.string(),
    title:        v.string(),
    unit:         v.union(v.literal('ayah'), v.literal('page'), v.literal('hizb')),
    dailyAmount:  v.number(),
    startSurah:   v.number(),
    endSurah:     v.number(),
    daysPerWeek:  v.number(),
    reminderTime: v.string(),
    createdAt:    v.number(),
    active:       v.boolean(),
  })
    .index('by_device', ['deviceId']),

  // ----------------- مهام الحفظ (SRS) -----------------
  memoTasks: defineTable({
    deviceId:           v.string(),
    surahId:            v.number(),
    ayahFrom:           v.number(),
    ayahTo:             v.number(),
    status:             v.union(
      v.literal('new'), v.literal('learning'),
      v.literal('memorized'), v.literal('review'),
    ),
    strength:           v.union(v.literal('weak'), v.literal('medium'), v.literal('strong')),
    lastReviewedAt:     v.optional(v.number()),
    nextReviewAt:       v.optional(v.number()),
    reviewIntervalDays: v.number(),
    repetitions:        v.number(),
  })
    .index('by_device', ['deviceId'])
    .index('by_device_due', ['deviceId', 'nextReviewAt']),

  // ----------------- جلسات قراءة -----------------
  readingSessions: defineTable({
    deviceId:    v.string(),
    startedAt:   v.number(),
    durationSec: v.number(),
    pagesRead:   v.number(),
    surahId:     v.number(),
    lastAyah:    v.number(),
  })
    .index('by_device', ['deviceId']),

  // ----------------- جلسات تسميع -----------------
  tasmeeSessions: defineTable({
    deviceId:     v.string(),
    startedAt:    v.number(),
    durationSec:  v.number(),
    surahId:      v.number(),
    ayahFrom:     v.number(),
    ayahTo:       v.number(),
    mistakes:     v.number(),
    score:        v.number(),
    notes:        v.optional(v.string()),
    recordingUrl: v.optional(v.string()),       // إن رُفع إلى Convex storage
  })
    .index('by_device', ['deviceId']),

  // ----------------- الإحصائيات التجميعية -----------------
  stats: defineTable({
    deviceId:        v.string(),
    pagesRead:       v.number(),
    versesMemorized: v.number(),
    sessionsCount:   v.number(),
    listenedMinutes: v.number(),
    tasbeehCount:    v.number(),
    streakDays:      v.number(),
    lastActiveDate:  v.number(),
    weeklyMinutes:   v.array(v.number()),
  })
    .index('by_device', ['deviceId']),

  // ----------------- الإنجازات المفتوحة -----------------
  unlockedAchievements: defineTable({
    deviceId:    v.string(),
    achievementId: v.string(),
    unlockedAt:  v.number(),
  })
    .index('by_device', ['deviceId']),
});
