import type { DhikrCategory } from '@/types';

export interface AdhkarAudioTrack {
  title: string;
  reciter: string;
  source: string;
  sourcePage: string;
  url: string;
  assetModule: number;
}

const BASE = 'https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlDuraihim';

const LOCAL_AUDIO: Record<string, number> = {
  '002': require('../../assets/audio/adhkar/hisn-002.mp3'),
  '026': require('../../assets/audio/adhkar/hisn-026.mp3'),
  '028': require('../../assets/audio/adhkar/hisn-028.mp3'),
  '029': require('../../assets/audio/adhkar/hisn-029.mp3'),
};

const track = (file: string, title: string): AdhkarAudioTrack => ({
  title,
  reciter: 'الشيخ حمد الدريهم',
  source: 'دار الإسلام – حصن المسلم',
  sourcePage: 'https://islamhouse.com/ar/audios/263352/',
  url: `${BASE}/ar_${file}_Hisn_Almuslim_AlDuraihim.mp3`,
  assetModule: LOCAL_AUDIO[file],
});

/** تسجيلات الأبواب المنشورة رسميًا ضمن الكتاب الصوتي «حصن المسلم». */
export const ADHKAR_AUDIO: Partial<Record<DhikrCategory, AdhkarAudioTrack>> = {
  morning: track('028', 'أذكار الصباح والمساء'),
  evening: track('028', 'أذكار الصباح والمساء'),
  'after-prayer': track('026', 'الأذكار بعد السلام من الصلاة'),
  sleep: track('029', 'أذكار النوم'),
  wake: track('002', 'أذكار الاستيقاظ من النوم'),
};
