/**
 * 📚 Articles store — يتعقّب تفاعل المستخدم مع المقالات.
 *
 * يحفظ:
 *  - bookmarkedIds: المقالات المحفوظة
 *  - readIds: المقالات اللي قراها المستخدم (لتقدّم تجربة "متابعة من حيث وقفت")
 *  - viewsCount: عداد مشاهدات (لتظهر "الأكثر قراءة")
 *  - likedIds: المقالات اللي أعجبت المستخدم
 *
 * Persisted في AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@nafahat/articles-state';

interface ArticlesPersist {
  bookmarkedIds: string[];
  readIds: string[];
  likedIds: string[];
  /** لكل مقال: عدد المشاهدات (يستخدم للترتيب) */
  viewsCount: Record<string, number>;
}

interface ArticlesState extends ArticlesPersist {
  /** هل المقال محفوظ (bookmark)؟ */
  isBookmarked: (id: string) => boolean;
  /** هل تمّت قراءته من قبل؟ */
  isRead: (id: string) => boolean;
  /** هل أُعجِب به؟ */
  isLiked: (id: string) => boolean;
  /** عدد المشاهدات لمقال */
  getViews: (id: string) => number;

  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  /** يُستدعى عند فتح مقال - يزيد العداد + يعلّمه كمقروء */
  markAsViewed: (id: string) => void;
  hydrate: () => Promise<void>;
}

const DEFAULT: ArticlesPersist = {
  bookmarkedIds: [],
  readIds: [],
  likedIds: [],
  viewsCount: {},
};

const persist = (s: ArticlesPersist) =>
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  ...DEFAULT,

  isBookmarked: (id) => get().bookmarkedIds.includes(id),
  isRead:       (id) => get().readIds.includes(id),
  isLiked:      (id) => get().likedIds.includes(id),
  getViews:     (id) => get().viewsCount[id] ?? 0,

  toggleBookmark(id) {
    const cur = get().bookmarkedIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ bookmarkedIds: next });
    persist({ ...get(), bookmarkedIds: next });
  },

  toggleLike(id) {
    const cur = get().likedIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ likedIds: next });
    persist({ ...get(), likedIds: next });
  },

  markAsViewed(id) {
    const s = get();
    const views = { ...s.viewsCount, [id]: (s.viewsCount[id] ?? 0) + 1 };
    const readIds = s.readIds.includes(id) ? s.readIds : [...s.readIds, id];
    set({ viewsCount: views, readIds });
    persist({ ...get(), viewsCount: views, readIds });
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw) as ArticlesPersist;
        set({
          bookmarkedIds: data.bookmarkedIds ?? [],
          readIds: data.readIds ?? [],
          likedIds: data.likedIds ?? [],
          viewsCount: data.viewsCount ?? {},
        });
      }
    } catch {}
  },
}));
