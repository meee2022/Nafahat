import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark, BookmarkFolder, Note } from '@/types/index';

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
  /** 🆕 مجلّدات تنظيمية للمرجعيات */
  bookmarkFolders: BookmarkFolder[];
  notes: Note[];
  favorites: string[];          // مفاتيح "surahId:ayah"
  setLastRead: (lr: LastRead) => void;
  toggleBookmark: (surahId: number, ayahNumber: number, page: number) => void;
  /** 🆕 ينقل bookmark موجود إلى مجلّد. folderId=undefined → خارج المجلّدات. */
  moveBookmarkToFolder: (bookmarkId: string, folderId?: string) => void;
  /** 🆕 ينشئ folder جديد. */
  createBookmarkFolder: (nameAr: string, iconName?: string, color?: string) => BookmarkFolder;
  /** 🆕 يحذف folder (الـ bookmarks جواه ترجع للـ default). */
  removeBookmarkFolder: (id: string) => void;
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
    bookmarkFolders: state.bookmarkFolders,
    notes: state.notes,
    favorites: state.favorites,
  };
  AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
};

const DEFAULT_FOLDERS: BookmarkFolder[] = [
  { id: 'memorize',  nameAr: 'للحفظ',       iconName: 'Brain',     color: '#B8923B', createdAt: 0 },
  { id: 'reflect',   nameAr: 'تأمّلات',     iconName: 'Sparkles',  color: '#0A3D38', createdAt: 0 },
  { id: 'duaa',      nameAr: 'دعاء',        iconName: 'Heart',     color: '#9C7A2D', createdAt: 0 },
];

export const useReadingStore = create<ReadingState>((set, get) => ({
  lastRead: null,
  bookmarks: [],
  bookmarkFolders: DEFAULT_FOLDERS,
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
  moveBookmarkToFolder(bookmarkId, folderId) {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, folder: folderId } : b
    );
    set({ bookmarks });
    persist({ ...get(), bookmarks });
  },
  createBookmarkFolder(nameAr, iconName, color) {
    const folder: BookmarkFolder = {
      id: `f-${Date.now()}`,
      nameAr,
      iconName,
      color,
      createdAt: Date.now(),
    };
    const bookmarkFolders = [...get().bookmarkFolders, folder];
    set({ bookmarkFolders });
    persist({ ...get(), bookmarkFolders });
    return folder;
  },
  removeBookmarkFolder(id) {
    const bookmarkFolders = get().bookmarkFolders.filter((f) => f.id !== id);
    // الـ bookmarks اللي كانت في المجلّد تروح للـ default (undefined)
    const bookmarks = get().bookmarks.map((b) => b.folder === id ? { ...b, folder: undefined } : b);
    set({ bookmarkFolders, bookmarks });
    persist({ ...get(), bookmarkFolders, bookmarks });
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
          bookmarkFolders: data.bookmarkFolders ?? DEFAULT_FOLDERS,
          notes: data.notes ?? [],
          favorites: data.favorites ?? [],
        });
      }
    } catch {}
  },
}));
