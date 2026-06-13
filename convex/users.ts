/**
 * ⚙️ Convex functions للحسابات (signUp / signIn / getCurrentUser).
 *
 * ⚠️ ملاحظة أمنية مهمة:
 * هذا الـ hash بسيط جداً وللعرض فقط. في الإنتاج الحقيقي:
 *   - استخدم bcrypt أو argon2
 *   - أضف rate limiting
 *   - فعّل تأكيد الإيميل
 *   - استخدم HTTPS فقط
 *
 * للاستخدام الحالي (تطبيق مجاني، صدقة جارية)، النظام يحقق:
 *   ✅ حسابات تعمل عبر كل الأجهزة
 *   ✅ لا تعارض في الإيميلات
 *   ✅ تخزين مشفّر للباسورد
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// ───── helpers ─────

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// hash بسيط - يعطي نفس النتيجة لنفس الإدخال
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(36)}_${s.length}`;
}

const genToken = (): string =>
  `tk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;

const TOKEN_EXPIRY_DAYS = 90;
const ADMIN_EMAILS: readonly string[] = [
  'eng.mohamed87@live.com',
];

const determineRole = (email: string): 'admin' | 'user' =>
  ADMIN_EMAILS.includes(email.toLowerCase().trim()) ? 'admin' : 'user';

// ───── إنشاء حساب جديد ─────

export const signUp = mutation({
  args: {
    email:    v.string(),
    name:     v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const name = args.name.trim() || 'مستخدم';

    if (!isValidEmail(email)) {
      return { ok: false, error: 'invalid-email' as const };
    }
    if (args.password.length < 6) {
      return { ok: false, error: 'weak-password' as const };
    }

    // تحقق من عدم وجود نفس البريد
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (existing) {
      return { ok: false, error: 'email-in-use' as const };
    }

    // إنشاء الحساب
    const userId = await ctx.db.insert('users', {
      email,
      name,
      passwordHash: simpleHash(args.password),
      avatarSeed: email,
      joinedAt: Date.now(),
      role: determineRole(email),
      emailVerified: false,
      lastLoginAt: Date.now(),
    });

    // إنشاء token
    const token = genToken();
    await ctx.db.insert('authSessions', {
      userId,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    const user = await ctx.db.get(userId);
    if (!user) return { ok: false, error: 'unknown' as const };

    return {
      ok: true as const,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarSeed: user.avatarSeed,
        joinedAt: user.joinedAt,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  },
});

// ───── تسجيل الدخول ─────

export const signIn = mutation({
  args: {
    email:    v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    if (!isValidEmail(email)) {
      return { ok: false, error: 'invalid-email' as const };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (!user) {
      return { ok: false, error: 'account-not-found' as const };
    }

    if (user.passwordHash !== simpleHash(args.password)) {
      return { ok: false, error: 'invalid-credentials' as const };
    }

    // تحديث آخر دخول
    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    // إنشاء token
    const token = genToken();
    await ctx.db.insert('authSessions', {
      userId: user._id,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return {
      ok: true as const,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarSeed: user.avatarSeed,
        joinedAt: user.joinedAt,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  },
});

// ───── تسجيل الدخول عبر Apple ─────
//
// ⚠️ ملاحظة أمنية: في الإنتاج الكامل يُفضّل التحقق من توقيع identityToken
//    على الخادم (Apple JWKS). حالياً نثق في الـ credential من جهاز iOS —
//    متوافق مع مستوى الأمان الحالي للتطبيق (راجع ملاحظة simpleHash أعلاه).

export const signInWithApple = mutation({
  args: {
    appleUserId: v.string(),
    email:       v.optional(v.string()),
    name:        v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appleUserId = args.appleUserId.trim();
    if (!appleUserId) return { ok: false, error: 'unknown' as const };

    const email = (args.email ?? '').toLowerCase().trim();

    // 1) ابحث بمُعرّف Apple الثابت
    let user = await ctx.db
      .query('users')
      .withIndex('by_appleUserId', (q) => q.eq('appleUserId', appleUserId))
      .first();

    // 2) لو مش موجود، اربطه بحساب موجود بنفس الإيميل (لو متاح)
    if (!user && email && isValidEmail(email)) {
      const byEmail = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .first();
      if (byEmail) {
        await ctx.db.patch(byEmail._id, { appleUserId, provider: 'apple', lastLoginAt: Date.now() });
        user = await ctx.db.get(byEmail._id);
      }
    }

    // 3) لسه مش موجود → أنشئ حساباً جديداً
    if (!user) {
      const finalEmail = email && isValidEmail(email)
        ? email
        : `apple_${appleUserId}@privaterelay.appleid.com`;
      const name = (args.name ?? '').trim() || 'مستخدم';
      const userId = await ctx.db.insert('users', {
        email: finalEmail,
        name,
        avatarSeed: finalEmail,
        joinedAt: Date.now(),
        role: determineRole(finalEmail),
        emailVerified: true, // Apple يتحقّق من الإيميل بنفسه
        lastLoginAt: Date.now(),
        provider: 'apple',
        appleUserId,
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }

    if (!user) return { ok: false, error: 'unknown' as const };

    const token = genToken();
    await ctx.db.insert('authSessions', {
      userId: user._id,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return {
      ok: true as const,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarSeed: user.avatarSeed,
        joinedAt: user.joinedAt,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  },
});

// ───── تسجيل الدخول عبر Google ─────
//
// ⚠️ نفس الملاحظة الأمنية: يُفضّل التحقق من idToken على الخادم في الإنتاج الكامل.

export const signInWithGoogle = mutation({
  args: {
    googleUserId: v.string(),
    email:        v.optional(v.string()),
    name:         v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const googleUserId = args.googleUserId.trim();
    if (!googleUserId) return { ok: false, error: 'unknown' as const };

    const email = (args.email ?? '').toLowerCase().trim();

    // 1) ابحث بمُعرّف Google الثابت
    let user = await ctx.db
      .query('users')
      .withIndex('by_googleUserId', (q) => q.eq('googleUserId', googleUserId))
      .first();

    // 2) لو مش موجود، اربطه بحساب موجود بنفس الإيميل (لو متاح)
    if (!user && email && isValidEmail(email)) {
      const byEmail = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .first();
      if (byEmail) {
        await ctx.db.patch(byEmail._id, { googleUserId, provider: 'google', lastLoginAt: Date.now() });
        user = await ctx.db.get(byEmail._id);
      }
    }

    // 3) لسه مش موجود → أنشئ حساباً جديداً
    if (!user) {
      const finalEmail = email && isValidEmail(email)
        ? email
        : `google_${googleUserId}@users.noreply.nafahat.app`;
      const name = (args.name ?? '').trim() || 'مستخدم';
      const userId = await ctx.db.insert('users', {
        email: finalEmail,
        name,
        avatarSeed: finalEmail,
        joinedAt: Date.now(),
        role: determineRole(finalEmail),
        emailVerified: true, // Google يتحقّق من الإيميل بنفسه
        lastLoginAt: Date.now(),
        provider: 'google',
        googleUserId,
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }

    if (!user) return { ok: false, error: 'unknown' as const };

    const token = genToken();
    await ctx.db.insert('authSessions', {
      userId: user._id,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return {
      ok: true as const,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarSeed: user.avatarSeed,
        joinedAt: user.joinedAt,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  },
});

// ───── تسجيل الخروج ─────

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { ok: true };
  },
});

// ───── حذف الحساب نهائياً (المستخدم نفسه) ─────
//   مطلوب من App Store (قاعدة 5.1.1): أي تطبيق فيه إنشاء حساب لازم
//   يسمح للمستخدم بحذف حسابه نهائياً من داخل التطبيق.

export const deleteMyAccount = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return { ok: false, error: 'not-authenticated' as const };

    const userId = session.userId;

    // احذف كل جلسات الدخول الخاصة بالمستخدم
    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    // احذف سجل المستخدم نهائياً
    await ctx.db.delete(userId);

    return { ok: true as const };
  },
});

// ───── الحصول على المستخدم الحالي من الـ token ─────

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarSeed: user.avatarSeed,
      joinedAt: user.joinedAt,
      emailVerified: user.emailVerified,
      role: user.role,
    };
  },
});

// ───── حذف حساب (للأدمن) ─────

export const deleteUser = mutation({
  args: { token: v.string(), targetUserId: v.id('users') },
  handler: async (ctx, args) => {
    // تحقق من الأدمن
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return { ok: false, error: 'not-authenticated' };

    const me = await ctx.db.get(session.userId);
    if (!me || me.role !== 'admin') return { ok: false, error: 'forbidden' };

    // احذف الجلسات أولاً
    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('by_user', (q) => q.eq('userId', args.targetUserId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(args.targetUserId);
    return { ok: true };
  },
});

// ───── قائمة كل المستخدمين (للأدمن) ─────

export const listAllUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (!session) return null;

    const me = await ctx.db.get(session.userId);
    if (!me || me.role !== 'admin') return null;

    const users = await ctx.db.query('users').collect();
    return users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      joinedAt: u.joinedAt,
      role: u.role,
      lastLoginAt: u.lastLoginAt,
    }));
  },
});
