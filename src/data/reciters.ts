import { Reciter } from '@/types/index';

/**
 * قائمة القرّاء مع روابط CDN حقيقية من mp3quran.net (موقع مفتوح).
 * بنية الملفات: {cdnBase}/{NNN}.mp3  حيث NNN = رقم السورة بـ 3 أرقام.
 * مثال: https://server8.mp3quran.net/afs/067.mp3 (الملك بصوت العفاسي)
 */
/**
 * 🎯 qcfRecitationId: ID القارئ على Quran Foundation (quran.com) API.
 *   يُستخدم لجلب التوقيتات الدقيقة الخاصة بكل قارئ بدلاً من scaling خطّي
 *   من توقيتات العفاسي - الذي ينتج drift مع طول السورة.
 *   IDs مأخوذة من /resources/recitations - بعضها مؤكّد، البعض الآخر best-guess.
 */
export const RECITERS: Reciter[] = [
  { id: 'mishary',    nameAr: 'مشاري بن راشد العفاسي', nameEn: 'Mishary Rashid Al-Afasy',        countryAr: 'الكويت',   style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/afs',    popular: true, qcfRecitationId: 7 },
  { id: 'sudais',     nameAr: 'عبد الرحمن السديس',     nameEn: 'Abdul Rahman Al-Sudais',         countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/sds',   popular: true, qcfRecitationId: 3 },
  { id: 'shuraim',    nameAr: 'سعود الشريم',           nameEn: 'Saud Al-Shuraim',                countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server7.mp3quran.net/shur',   popular: true, qcfRecitationId: 11 },
  { id: 'husary',     nameAr: 'محمود خليل الحصري',     nameEn: 'Mahmoud Khalil Al-Hussary',      countryAr: 'مصر',     style: 'معلم', bitrate: 192, cdnBase: 'https://server13.mp3quran.net/husr',  popular: true, qcfRecitationId: 6 },
  { id: 'minshawi',   nameAr: 'محمد صديق المنشاوي',    nameEn: 'Mohammed Siddiq Al-Minshawi',    countryAr: 'مصر',     style: 'مجود', bitrate: 192, cdnBase: 'https://server10.mp3quran.net/minsh', popular: true, qcfRecitationId: 9 },
  { id: 'abdulbasit', nameAr: 'عبد الباسط عبد الصمد',  nameEn: 'Abdul Basit Abdul Samad',        countryAr: 'مصر',     style: 'مجود', bitrate: 192, cdnBase: 'https://server7.mp3quran.net/basit',  popular: true, qcfRecitationId: 1 },
  { id: 'ghamdi',     nameAr: 'سعد الغامدي',           nameEn: 'Saad Al-Ghamdi',                 countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server7.mp3quran.net/s_gmd', qcfRecitationId: 10 },
  { id: 'maher',      nameAr: 'ماهر المعيقلي',         nameEn: 'Maher Al-Mueaqly',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server12.mp3quran.net/maher' },
  { id: 'ajamy',      nameAr: 'أحمد بن علي العجمي',    nameEn: 'Ahmed Al-Ajmy',                  countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server10.mp3quran.net/ajm' },
  { id: 'shatry',     nameAr: 'أبو بكر الشاطري',       nameEn: 'Abu Bakr Al-Shatri',             countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/shatri' },
  { id: 'dosari',     nameAr: 'ياسر الدوسري',          nameEn: 'Yasser Al-Dosari',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/yasser' },
  { id: 'banna',      nameAr: 'محمود علي البنا',       nameEn: 'Mahmoud Ali Al-Banna',           countryAr: 'مصر',     style: 'مجود', bitrate: 192, cdnBase: 'https://server8.mp3quran.net/bna' },
];

export const getReciterById = (id: string) => RECITERS.find((r) => r.id === id);

/**
 * يبني رابط ملف الصوت لسورة كاملة لقارئ معيّن.
 */
export function getSurahAudioUrl(reciterId: string, surahId: number): string | null {
  const r = getReciterById(reciterId);
  if (!r) return null;
  const padded = String(surahId).padStart(3, '0');
  return `${r.cdnBase}/${padded}.mp3`;
}
