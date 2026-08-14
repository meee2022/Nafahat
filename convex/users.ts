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
import { internalMutation, mutation, query } from './_generated/server';
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

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const hexToBytes = (hex: string) => new Uint8Array(hex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? []);

async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210_000 }, key, 256);
  return `pbkdf2$210000$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2$')) return stored === simpleHash(password);
  const [, iterations, salt, expected] = stored.split('$');
  if (iterations !== '210000' || !salt || !expected) return false;
  const actual = (await hashPassword(password, salt)).split('$')[3];
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const genToken = (): string => `tk_${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`;

const TOKEN_EXPIRY_DAYS = 90;

async function hashResetCode(email: string, code: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${email}:${code}`);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

export const createPasswordReset = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email: rawEmail, code }) => {
    const email = rawEmail.toLowerCase().trim();
    const now = Date.now();
    const recent = await ctx.db.query('passwordResetRequests').withIndex('by_email', (q) => q.eq('email', email)).collect();
    if (recent.some((request) => request.createdAt > now - 60_000)) return { ok: false as const, error: 'too-many-attempts' as const };
    for (const request of recent.filter((item) => item.expiresAt <= now || item.consumedAt != null)) {
      await ctx.db.delete(request._id);
    }
    const user = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', email)).first();
    if (!user) return { ok: true as const, deliver: false as const };
    await ctx.db.insert('passwordResetRequests', {
      email,
      codeHash: await hashResetCode(email, code),
      createdAt: now,
      expiresAt: now + 15 * 60_000,
      attempts: 0,
    });
    return { ok: true as const, deliver: true as const };
  },
});

export const resetPassword = mutation({
  args: { email: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!isValidEmail(email) || args.newPassword.length < 8 || !/^\d{6}$/.test(args.code)) {
      return { ok: false as const, error: 'invalid-reset' as const };
    }
    const requests = await ctx.db.query('passwordResetRequests').withIndex('by_email', (q) => q.eq('email', email)).order('desc').collect();
    const request = requests.find((item) => item.consumedAt == null && item.expiresAt > Date.now());
    if (!request || request.attempts >= 5) return { ok: false as const, error: 'invalid-reset' as const };
    const matches = (await hashResetCode(email, args.code)) === request.codeHash;
    if (!matches) {
      await ctx.db.patch(request._id, { attempts: request.attempts + 1 });
      return { ok: false as const, error: 'invalid-reset' as const };
    }
    const user = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', email)).first();
    if (!user) return { ok: false as const, error: 'invalid-reset' as const };
    await ctx.db.patch(user._id, { passwordHash: await hashPassword(args.newPassword) });
    await ctx.db.patch(request._id, { consumedAt: Date.now() });
    const sessions = await ctx.db.query('authSessions').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
    for (const session of sessions) await ctx.db.delete(session._id);
    return { ok: true as const };
  },
});

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
    if (args.password.length < 8) {
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
      passwordHash: await hashPassword(args.password),
      avatarSeed: email,
      joinedAt: Date.now(),
      role: 'user',
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

    const recentAttempts = await ctx.db.query('authAttempts').withIndex('by_email', (q) => q.eq('email', email)).collect();
    const cutoff = Date.now() - 15 * 60 * 1000;
    if (recentAttempts.filter((a) => a.attemptedAt >= cutoff).length >= 8) {
      return { ok: false, error: 'too-many-attempts' as const };
    }

    if (!isValidEmail(email)) {
      return { ok: false, error: 'invalid-email' as const };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (!user || !(await verifyPassword(args.password, user.passwordHash))) {
      await ctx.db.insert('authAttempts', { email, attemptedAt: Date.now() });
      return { ok: false, error: 'invalid-credentials' as const };
    }

    for (const attempt of recentAttempts) await ctx.db.delete(attempt._id);

    if (!user.passwordHash.startsWith('pbkdf2$')) {
      await ctx.db.patch(user._id, { passwordHash: await hashPassword(args.password) });
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
    if (!session || session.expiresAt < Date.now()) return { ok: false, error: 'not-authenticated' };

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
    if (!session || session.expiresAt < Date.now()) return null;

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
