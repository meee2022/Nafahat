/**
 * نظام تسجيل الدخول لتطبيق نَفَحات.
 *
 * يدعم:
 *  - تسجيل دخول بالبريد + كلمة المرور
 *  - تسجيل جديد
 *  - الاستمرار كزائر (guest)
 *  - تسجيل خروج
 *  - استعادة كلمة المرور (mock - تُربط بالـ backend لاحقاً)
 *
 * النسخة الحالية تخزّن محلياً (AsyncStorage). جاهز للربط بـ Convex Auth
 * أو أي backend عبر استبدال الـ async stubs بـ API calls فعلية.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convex, convexApi } from '@services/convex';
import { secureGet, secureSet, secureDelete } from '@services/secureStorage';

const useCloudAuth = (): boolean => !!convex && !!convexApi?.users;

export type AuthStatus = 'unknown' | 'guest' | 'authenticated';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarSeed: string;
  joinedAt: number;
  emailVerified: boolean;
}

export type AuthError =
  | 'invalid-credentials'
  | 'account-not-found'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'network'
  | 'unknown';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;

  // أكشن
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithApple: (params: { appleUserId: string; email?: string; name?: string }) => Promise<boolean>;
  signInWithGoogle: (params: { googleUserId: string; email?: string; name?: string }) => Promise<boolean>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
  hydrate: () => Promise<void>;
}

const KEY_USER = '@nafahat/auth/user';
const KEY_TOKEN = '@nafahat/auth/token';
const KEY_STATUS = '@nafahat/auth/status';
const KEY_USERS_DB = '@nafahat/auth/users-db';     // قاعدة بيانات محلية للحسابات (demo)

// ----- تحقّقات بسيطة -----
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pw: string) => pw.length >= 6;

// ----- "قاعدة بيانات" محلية للحسابات (demo) -----
interface StoredUser {
  user: AuthUser;
  passwordHash: string;   // demo فقط - استخدم bcrypt على الـ backend الحقيقي
}

async function loadUsersDb(): Promise<Record<string, StoredUser>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_USERS_DB);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveUsersDb(db: Record<string, StoredUser>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_USERS_DB, JSON.stringify(db));
  } catch {}
}

// ⚠️⚠️⚠️ تحذير أمني: simpleHash ليس آمناً إطلاقاً لكلمات المرور.
// يُستخدم فقط في حالة عدم توفّر Convex backend (offline-only demo path).
// لا ترفع هذا التطبيق للإنتاج بدون:
//   ١. تفعيل Convex Auth (موجود بالفعل، انظر useCloudAuth)
//   ٢. حذف هذا الـ path المحلي تماماً
//   ٣. تأكّد إن expo-secure-store مثبّت (انظر secureStorage.ts)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(36)}`;
}

const genToken = () => `tk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
const genId = () => `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  token: null,
  loading: false,
  error: null,

  async signIn(email, password) {
    set({ loading: true, error: null });

    if (!isValidEmail(email)) {
      set({ loading: false, error: 'invalid-email' });
      return false;
    }

    // 🌐 محاولة Convex أولاً (إذا متاحة)
    if (useCloudAuth() && convex && convexApi) {
      try {
        const result = await convex.mutation(convexApi.users.signIn, { email, password });
        if (!result.ok) {
          set({ loading: false, error: result.error });
          return false;
        }
        const u = result.user;
        const user: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name,
          avatarSeed: u.avatarSeed,
          joinedAt: u.joinedAt,
          emailVerified: u.emailVerified,
        };
        await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
        await secureSet(KEY_TOKEN, result.token);
        await AsyncStorage.setItem(KEY_STATUS, 'authenticated');
        set({ status: 'authenticated', user, token: result.token, loading: false, error: null });
        return true;
      } catch (e) {
        // fallback إلى local لو فشل الـ Convex
        if (__DEV__) console.warn('[auth] Convex signIn failed, falling back to local', e);
      }
    }

    // 📱 fallback: تسجيل دخول محلي (نفس الجهاز فقط)
    try {
      const db = await loadUsersDb();
      const stored = db[email.toLowerCase()];

      if (!stored) {
        set({ loading: false, error: 'account-not-found' });
        return false;
      }
      if (stored.passwordHash !== simpleHash(password)) {
        set({ loading: false, error: 'invalid-credentials' });
        return false;
      }

      const token = genToken();
      await AsyncStorage.setItem(KEY_USER, JSON.stringify(stored.user));
      await secureSet(KEY_TOKEN, token);
      await AsyncStorage.setItem(KEY_STATUS, 'authenticated');

      set({
        status: 'authenticated',
        user: stored.user,
        token,
        loading: false,
        error: null,
      });
      return true;
    } catch {
      set({ loading: false, error: 'unknown' });
      return false;
    }
  },

  async signUp(name, email, password) {
    set({ loading: true, error: null });

    if (!isValidEmail(email)) {
      set({ loading: false, error: 'invalid-email' });
      return false;
    }
    if (!isStrongPassword(password)) {
      set({ loading: false, error: 'weak-password' });
      return false;
    }

    // 🌐 محاولة Convex أولاً
    if (useCloudAuth() && convex && convexApi) {
      try {
        const result = await convex.mutation(convexApi.users.signUp, { name, email, password });
        if (!result.ok) {
          set({ loading: false, error: result.error });
          return false;
        }
        const u = result.user;
        const user: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name,
          avatarSeed: u.avatarSeed,
          joinedAt: u.joinedAt,
          emailVerified: u.emailVerified,
        };
        await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
        await secureSet(KEY_TOKEN, result.token);
        await AsyncStorage.setItem(KEY_STATUS, 'authenticated');
        set({ status: 'authenticated', user, token: result.token, loading: false, error: null });
        return true;
      } catch (e) {
        if (__DEV__) console.warn('[auth] Convex signUp failed, falling back to local', e);
      }
    }

    // 📱 fallback: تسجيل محلي
    try {
      const db = await loadUsersDb();
      const lowerEmail = email.toLowerCase();
      if (db[lowerEmail]) {
        set({ loading: false, error: 'email-in-use' });
        return false;
      }

      const user: AuthUser = {
        id: genId(),
        email: lowerEmail,
        name: name.trim() || 'مستخدم',
        avatarSeed: lowerEmail,
        joinedAt: Date.now(),
        emailVerified: false,
      };

      db[lowerEmail] = { user, passwordHash: simpleHash(password) };
      await saveUsersDb(db);

      const token = genToken();
      await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
      await secureSet(KEY_TOKEN, token);
      await AsyncStorage.setItem(KEY_STATUS, 'authenticated');

      set({
        status: 'authenticated',
        user,
        token,
        loading: false,
        error: null,
      });
      return true;
    } catch {
      set({ loading: false, error: 'unknown' });
      return false;
    }
  },

  // 🍎 تسجيل الدخول عبر Apple — يتطلّب Convex (لا يوجد fallback محلي لـ OAuth)
  async signInWithApple({ appleUserId, email, name }) {
    set({ loading: true, error: null });

    if (!useCloudAuth() || !convex || !convexApi) {
      set({ loading: false, error: 'network' });
      return false;
    }

    try {
      const result = await convex.mutation(convexApi.users.signInWithApple, {
        appleUserId,
        email: email || undefined,
        name: name || undefined,
      });
      if (!result.ok) {
        set({ loading: false, error: result.error });
        return false;
      }
      const u = result.user;
      const user: AuthUser = {
        id: u.id,
        email: u.email,
        name: u.name,
        avatarSeed: u.avatarSeed,
        joinedAt: u.joinedAt,
        emailVerified: u.emailVerified,
      };
      await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
      await secureSet(KEY_TOKEN, result.token);
      await AsyncStorage.setItem(KEY_STATUS, 'authenticated');
      set({ status: 'authenticated', user, token: result.token, loading: false, error: null });
      return true;
    } catch (e) {
      if (__DEV__) console.warn('[auth] Apple signIn failed', e);
      set({ loading: false, error: 'unknown' });
      return false;
    }
  },

  // 🟢 تسجيل الدخول عبر Google — يتطلّب Convex
  async signInWithGoogle({ googleUserId, email, name }) {
    set({ loading: true, error: null });

    if (!useCloudAuth() || !convex || !convexApi) {
      set({ loading: false, error: 'network' });
      return false;
    }

    try {
      const result = await convex.mutation(convexApi.users.signInWithGoogle, {
        googleUserId,
        email: email || undefined,
        name: name || undefined,
      });
      if (!result.ok) {
        set({ loading: false, error: result.error });
        return false;
      }
      const u = result.user;
      const user: AuthUser = {
        id: u.id,
        email: u.email,
        name: u.name,
        avatarSeed: u.avatarSeed,
        joinedAt: u.joinedAt,
        emailVerified: u.emailVerified,
      };
      await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
      await secureSet(KEY_TOKEN, result.token);
      await AsyncStorage.setItem(KEY_STATUS, 'authenticated');
      set({ status: 'authenticated', user, token: result.token, loading: false, error: null });
      return true;
    } catch (e) {
      if (__DEV__) console.warn('[auth] Google signIn failed', e);
      set({ loading: false, error: 'unknown' });
      return false;
    }
  },

  async signInAsGuest() {
    await AsyncStorage.setItem(KEY_STATUS, 'guest');
    await AsyncStorage.removeItem(KEY_USER);
    await secureDelete(KEY_TOKEN);
    set({ status: 'guest', user: null, token: null, error: null });
  },

  async signOut() {
    await AsyncStorage.removeItem(KEY_USER);
    await secureDelete(KEY_TOKEN);
    await AsyncStorage.setItem(KEY_STATUS, 'guest');
    set({ status: 'guest', user: null, token: null, error: null });
  },

  // 🗑️ حذف الحساب نهائياً (مطلوب من App Store) — يحذف من الخادم ثم محلياً
  async deleteAccount() {
    const token = get().token;
    if (useCloudAuth() && convex && convexApi && token) {
      try {
        await convex.mutation(convexApi.users.deleteMyAccount, { token });
      } catch (e) {
        if (__DEV__) console.warn('[auth] deleteAccount failed', e);
        // نكمّل التنظيف المحلي حتى لو فشل الخادم
      }
    }
    await AsyncStorage.removeItem(KEY_USER);
    await secureDelete(KEY_TOKEN);
    await AsyncStorage.setItem(KEY_STATUS, 'guest');
    set({ status: 'guest', user: null, token: null, error: null });
    return true;
  },

  async forgotPassword(email) {
    set({ loading: true, error: null });

    if (!isValidEmail(email)) {
      set({ loading: false, error: 'invalid-email' });
      return false;
    }

    // mock - في الإنتاج: استدعِ API لإرسال إيميل reset
    await new Promise((r) => setTimeout(r, 800));
    set({ loading: false });
    return true;
  },

  clearError() {
    set({ error: null });
  },

  async hydrate() {
    try {
      const status = (await AsyncStorage.getItem(KEY_STATUS)) as AuthStatus | null;
      const userRaw = await AsyncStorage.getItem(KEY_USER);
      const token = await secureGet(KEY_TOKEN);

      if (status === 'authenticated' && userRaw && token) {
        set({ status: 'authenticated', user: JSON.parse(userRaw), token });
      } else if (status === 'guest') {
        set({ status: 'guest' });
      } else {
        set({ status: 'unknown' });
      }
    } catch {
      set({ status: 'unknown' });
    }
  },
}));

// ----- مساعدات لتفسير الخطأ بنصّ مفهوم -----
export const authErrorMessage = (e: AuthError | null): string => {
  if (!e) return '';
  switch (e) {
    case 'invalid-email':       return 'صيغة البريد غير صحيحة';
    case 'account-not-found':   return 'لا يوجد حساب بهذا البريد - أنشئ حساباً جديداً أولاً';
    case 'invalid-credentials': return 'كلمة المرور غير صحيحة';
    case 'email-in-use':        return 'هذا البريد مسجّل بالفعل';
    case 'weak-password':       return 'كلمة المرور قصيرة (6 أحرف على الأقل)';
    case 'network':             return 'تعذّر الاتصال - تحقق من الإنترنت';
    default:                    return 'حدث خطأ غير متوقّع';
  }
};
