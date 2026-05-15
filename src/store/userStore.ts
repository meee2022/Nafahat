import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types/index';

interface UserState {
  profile: UserProfile;
  hasOnboarded: boolean;
  setName: (name: string) => void;
  setRole: (role: UserProfile['role']) => void;
  completeOnboarding: () => void;
  hydrate: () => Promise<void>;
}

const DEFAULT: UserProfile = {
  id: 'guest',
  name: 'ضيف نَفَحات',
  role: 'guest',
  avatarSeed: 'nafahat-default',
  joinedAt: Date.now(),
};

const KEY_PROFILE = '@nafahat/profile';
const KEY_ONBOARD = '@nafahat/onboarded';

export const useUserStore = create<UserState>((set, get) => ({
  profile: DEFAULT,
  hasOnboarded: false,

  setName(name) {
    const next = { ...get().profile, name };
    set({ profile: next });
    AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(next)).catch(() => {});
  },
  setRole(role) {
    const next = { ...get().profile, role };
    set({ profile: next });
    AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(next)).catch(() => {});
  },
  completeOnboarding() {
    set({ hasOnboarded: true });
    AsyncStorage.setItem(KEY_ONBOARD, '1').catch(() => {});
  },
  async hydrate() {
    try {
      const [p, o] = await Promise.all([
        AsyncStorage.getItem(KEY_PROFILE),
        AsyncStorage.getItem(KEY_ONBOARD),
      ]);
      if (p) set({ profile: JSON.parse(p) });
      if (o === '1') set({ hasOnboarded: true });
    } catch {}
  },
}));
