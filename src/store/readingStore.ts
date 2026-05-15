import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark, Note } from '@/types/index';

interface LastRead {
  surahId: number;
  ayahNumber: number;
  surahName: string;
  page: number;
  updatedAt: number;
}

interface ReadingState {
  lastRead: LastRead | null;
  bookmarks: Bookmark[];
  notes: Note[];
  favorites: string[];          // مفاتيح "surahId:ayah"
  setLastRead: (lr: LastRead) => void;
  toggleBookmark: (surahId: number, ayahNumber: number, page: number) => void;
  toggleFavorite: (surahId: number, ayahNumber: number) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeNote: (id: string) => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/reading';

const persist = (state: Partial<ReadingState>) => {
  const data = {
    lastRead: state.lastRead,
    bookmarks: state.bookmarks,
    notes: state.notes,
    favorites: state.favorites,
  };
  AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
};

export const useReadingStore = create<ReadingState>((set, get) => ({
  lastRead: null,
  bookmarks: [],
  notes: [],
  favorites: [],

  setLastRead(lr) {
    set({ lastRead: lr });
    persist({ ...get(), lastRead: lr });
  },
  toggleBookmark(surahId, ayahNumber, page) {
    const exists = get().bookmarks.find((b) => b.surahId === surahId && b.ayahNumber === ayahNumber);
    const bookmarks = exists
      ? get().bookmarks.filter((b) => b.id !== exists.id)
      : [...get().bookmarks, { id: `b-${Date.now()}`, surahId, ayahNumber, page, createdAt: Date.now() }];
    set({ bookmarks });
    persist({ ...get(), bookmarks });
  },
  toggleFavorite(surahId, ayahNumber) {
    const key = `${surahId}:${ayahNumber}`;
    const favorites = get().favorites.includes(key)
      ? get().favorites.filter((k) => k !== key)
      : [...get().favorites, key];
    set({ favorites });
    persist({ ...get(), favorites });
  },
  addNote(note) {
    const newNote: Note = { ...note, id: `n-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() };
    const notes = [newNote, ...get().notes];
    set({ notes });
    persist({ ...get(), notes });
  },
  removeNote(id) {
    const notes = get().notes.filter((n) => n.id !== id);
    set({ notes });
    persist({ ...get(), notes });
  },
  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          lastRead: data.lastRead ?? null,
          bookmarks: data.bookmarks ?? [],
          notes: data.notes ?? [],
          favorites: data.favorites ?? [],
        });
      }
    } catch {}
  },
}));
