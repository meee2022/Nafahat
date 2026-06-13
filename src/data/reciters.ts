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
  // 🎙️ النسخ المرتّلة (حفص عن عاصم) - المسار الجذري على mp3quran = المصحف المرتّل الكامل
  { id: 'husary',     nameAr: 'محمود خليل الحصري',     nameEn: 'Mahmoud Khalil Al-Hussary',      countryAr: 'مصر',     style: 'مرتل', bitrate: 192, cdnBase: 'https://server13.mp3quran.net/husr',  popular: true, qcfRecitationId: 6 },
  { id: 'minshawi',   nameAr: 'محمد صديق المنشاوي',    nameEn: 'Mohammed Siddiq Al-Minshawi',    countryAr: 'مصر',     style: 'مرتل', bitrate: 192, cdnBase: 'https://server10.mp3quran.net/minsh', popular: true },
  { id: 'abdulbasit', nameAr: 'عبد الباسط عبد الصمد',  nameEn: 'Abdul Basit Abdul Samad',        countryAr: 'مصر',     style: 'مرتل', bitrate: 192, cdnBase: 'https://server7.mp3quran.net/basit',   popular: true, qcfRecitationId: 2 },
  // 🎵 النسخ المجوّدة المشهورة (المصحف المجوّد الكامل) - كمدخلات منفصلة
  { id: 'abdulbasit_mjwd', nameAr: 'عبد الباسط عبد الصمد (مجوّد)', nameEn: 'Abdul Basit (Mujawwad)',    countryAr: 'مصر', style: 'مجود', bitrate: 192, cdnBase: 'https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad', popular: true, qcfRecitationId: 1 },
  { id: 'minshawi_mjwd',   nameAr: 'محمد صديق المنشاوي (مجوّد)',  nameEn: 'Al-Minshawi (Mujawwad)',     countryAr: 'مصر', style: 'مجود', bitrate: 192, cdnBase: 'https://server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad', popular: true, qcfRecitationId: 9 },
  { id: 'husary_mjwd',     nameAr: 'محمود خليل الحصري (مجوّد)',   nameEn: 'Al-Hussary (Mujawwad)',      countryAr: 'مصر', style: 'مجود', bitrate: 192, cdnBase: 'https://server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad' },
  { id: 'ghamdi',     nameAr: 'سعد الغامدي',           nameEn: 'Saad Al-Ghamdi',                 countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server7.mp3quran.net/s_gmd', qcfRecitationId: 10 },
  { id: 'maher',      nameAr: 'ماهر المعيقلي',         nameEn: 'Maher Al-Mueaqly',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server12.mp3quran.net/maher' },
  { id: 'ajamy',      nameAr: 'أحمد بن علي العجمي',    nameEn: 'Ahmed Al-Ajmy',                  countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server10.mp3quran.net/ajm' },
  { id: 'shatry',     nameAr: 'أبو بكر الشاطري',       nameEn: 'Abu Bakr Al-Shatri',             countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/shatri' },
  { id: 'dosari',     nameAr: 'ياسر الدوسري',          nameEn: 'Yasser Al-Dosari',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/yasser' },
  { id: 'banna',      nameAr: 'محمود علي البنا',       nameEn: 'Mahmoud Ali Al-Banna',           countryAr: 'مصر',     style: 'مجود', bitrate: 192, cdnBase: 'https://server8.mp3quran.net/bna' },
  // 🆕 قرّاء إضافيون من mp3quran.net (qcfRecitationId يُحقّق عند توفّر الـ ID)
  { id: 'abkar',      nameAr: 'إدريس أبكر',            nameEn: 'Idris Abkar',                    countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server10.mp3quran.net/abkr' },
  { id: 'qatami',     nameAr: 'ناصر القطامي',          nameEn: 'Nasser Al-Qatami',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server6.mp3quran.net/qtm' },
  { id: 'jaleel',     nameAr: 'خالد الجليل',           nameEn: 'Khaled Al-Jaleel',               countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server13.mp3quran.net/jleel' },
  { id: 'baleela',    nameAr: 'بندر بليلة',            nameEn: 'Bandar Baleela',                 countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server6.mp3quran.net/balilah' },
  { id: 'bukhatir',   nameAr: 'صلاح بوخاطر',           nameEn: 'Salah Bukhatir',                 countryAr: 'الإمارات', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/bu_khtr' },
  { id: 'abbad',      nameAr: 'فارس عباد',             nameEn: 'Fares Abbad',                    countryAr: 'اليمن',   style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/frs_a' },
  { id: 'jibreel',    nameAr: 'محمد جبريل',            nameEn: 'Mohammad Jibreel',               countryAr: 'مصر',     style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/jbrl' },
  { id: 'akhdar',     nameAr: 'إبراهيم الأخضر',         nameEn: 'Ibrahim Al-Akhdar',              countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/akdr' },
  { id: 'ayyub',      nameAr: 'محمد أيوب',             nameEn: 'Muhammad Ayyub',                 countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/ayyub' },
  { id: 'sayegh',     nameAr: 'توفيق الصايغ',          nameEn: 'Tawfeeq As-Sayegh',              countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server11.mp3quran.net/sayegh' },
  { id: 'mutrod',     nameAr: 'عبد الله المطرود',       nameEn: 'Abdullah Al-Mutrood',            countryAr: 'السعودية', style: 'مرتل', bitrate: 128, cdnBase: 'https://server8.mp3quran.net/mtrod' },
  { id: 'kurdi',      nameAr: 'رعد محمد الكردي',       nameEn: "Ra'ad Al-Kurdi",                 countryAr: 'العراق',  style: 'مرتل', bitrate: 128, cdnBase: 'https://server6.mp3quran.net/kurdi' },
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

/**
 * 🎯 أسماء مجلّدات everyayah.com لملفات الآيات المنفصلة (ملف صوت لكل آية).
 *   تشغيل ملف الآية المنفصل يبدأ من أوّل الآية بالظبط — بدون أي قفز/تقدير —
 *   فالبداية مضبوطة 100% لكل القرّاء المدعومين هنا.
 *   (القرّاء الحديثون غير الموجودين على everyayah يفضلوا على ملف السورة الكامل.)
 */
const EVERYAYAH_FOLDER: Record<string, string> = {
  mishary:         'Alafasy_128kbps',
  sudais:          'Abdurrahmaan_As-Sudais_192kbps',
  shuraim:         'Saood_ash-Shuraym_128kbps',
  husary:          'Husary_128kbps',
  minshawi:        'Minshawy_Murattal_128kbps',
  abdulbasit:      'Abdul_Basit_Murattal_192kbps',
  abdulbasit_mjwd: 'Abdul_Basit_Mujawwad_128kbps',
  minshawi_mjwd:   'Minshawy_Mujawwad_64kbps',
  husary_mjwd:     'Husary_Mujawwad_64kbps',
  ghamdi:          'Ghamadi_40kbps',
  maher:           'Maher_AlMuaiqly_64kbps',
  ajamy:           'Ahmed_ibn_Ali_al_Ajamy_128kbps',
  shatry:          'Abu_Bakr_Ash-Shaatree_128kbps',
  dosari:          'Yasser_Ad-Dussary_128kbps',
  banna:           'Mahmoud_Ali_Al_Banna_32kbps',
  qatami:          'Nasser_Alqatami_128kbps',
  bukhatir:        'Salaah_AbdulRahman_Bukhatir_128kbps',
  abbad:           'Fares_Abbad_64kbps',
  jibreel:         'Muhammad_Jibreel_128kbps',
  akhdar:          'Ibrahim_Akhdar_32kbps',
  ayyub:           'Muhammad_Ayyoub_128kbps',
  mutrod:          'Abdullah_Matroud_128kbps',
};

/** هل للقارئ ملفات آيات منفصلة (بداية مضبوطة)؟ */
export function getReciterAyahFolder(reciterId: string): string | null {
  return EVERYAYAH_FOLDER[reciterId] ?? null;
}

/**
 * رابط ملف آية مفردة (يبدأ من أوّل الآية بالظبط) — أو null لو القارئ غير مدعوم.
 */
export function getAyahFileUrl(reciterId: string, surahId: number, ayahNumber: number): string | null {
  const folder = EVERYAYAH_FOLDER[reciterId];
  if (!folder) return null;
  const s = String(surahId).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}
