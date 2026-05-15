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
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
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

// hash بسيط جداً - للديمو فقط، استخدم bcrypt على الـ backend الحقيقي
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

    try {
      const db = await loadUsersDb();
      const stored = db[email.toLowerCase()];

      // التمييز بين "حساب غير موجود" و "كلمة سر غلط"
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
      await AsyncStorage.setItem(KEY_TOKEN, token);
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
      await AsyncStorage.setItem(KEY_TOKEN, token);
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

  async signInAsGuest() {
    await AsyncStorage.setItem(KEY_STATUS, 'guest');
    await AsyncStorage.removeItem(KEY_USER);
    await AsyncStorage.removeItem(KEY_TOKEN);
    set({ status: 'guest', user: null, token: null, error: null });
  },

  async signOut() {
    await AsyncStorage.removeItem(KEY_USER);
    await AsyncStorage.removeItem(KEY_TOKEN);
    await AsyncStorage.setItem(KEY_STATUS, 'guest');
    set({ status: 'guest', user: null, token: null, error: null });
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
      const token = await AsyncStorage.getItem(KEY_TOKEN);

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
