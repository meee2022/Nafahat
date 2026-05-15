/**
 * حساب اتجاه القبلة من أي موقع جغرافي إلى الكعبة المشرّفة في مكة المكرّمة.
 * يستخدم معادلة Initial Bearing على الكرة (great-circle navigation).
 *
 * المرجع: https://www.movable-type.co.uk/scripts/latlong.html
 */

// إحداثيات الكعبة المشرفة (الحجر الأسود)
export const KAABA = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * يحسب الزاوية من الموقع إلى الكعبة (من الشمال الجغرافي، باتجاه عقارب الساعة).
 * النتيجة بين 0 و 360 درجة.
 */
export function calculateQiblaBearing(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.latitude);
  const Δλ = toRad(KAABA.longitude - lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * يحسب المسافة بالكيلومتر من الموقع إلى الكعبة (Haversine).
 */
export function distanceToKaaba(lat: number, lng: number): number {
  const R = 6371; // نصف قطر الأرض كم
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.latitude);
  const Δφ = toRad(KAABA.latitude - lat);
  const Δλ = toRad(KAABA.longitude - lng);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * مدن جاهزة للاختيار اليدوي - تشمل العواصم والمدن الإسلامية الكبرى.
 */
export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  countryAr: string;
  latitude: number;
  longitude: number;
}

export const PRESET_CITIES: City[] = [
  // الجزيرة العربية والخليج
  { id: 'makkah',    nameAr: 'مكة المكرّمة', nameEn: 'Makkah',    countryAr: 'السعودية',     latitude: 21.4225, longitude: 39.8262 },
  { id: 'madinah',   nameAr: 'المدينة',      nameEn: 'Madinah',   countryAr: 'السعودية',     latitude: 24.4683, longitude: 39.6142 },
  { id: 'riyadh',    nameAr: 'الرياض',       nameEn: 'Riyadh',    countryAr: 'السعودية',     latitude: 24.7136, longitude: 46.6753 },
  { id: 'jeddah',    nameAr: 'جدة',          nameEn: 'Jeddah',    countryAr: 'السعودية',     latitude: 21.4858, longitude: 39.1925 },
  { id: 'dubai',     nameAr: 'دبي',          nameEn: 'Dubai',     countryAr: 'الإمارات',    latitude: 25.2048, longitude: 55.2708 },
  { id: 'abu-dhabi', nameAr: 'أبوظبي',       nameEn: 'Abu Dhabi', countryAr: 'الإمارات',    latitude: 24.4539, longitude: 54.3773 },
  { id: 'doha',      nameAr: 'الدوحة',       nameEn: 'Doha',      countryAr: 'قطر',          latitude: 25.2854, longitude: 51.5310 },
  { id: 'kuwait',    nameAr: 'الكويت',       nameEn: 'Kuwait',    countryAr: 'الكويت',       latitude: 29.3759, longitude: 47.9774 },
  { id: 'manama',    nameAr: 'المنامة',       nameEn: 'Manama',    countryAr: 'البحرين',      latitude: 26.2235, longitude: 50.5876 },
  { id: 'muscat',    nameAr: 'مسقط',         nameEn: 'Muscat',    countryAr: 'عُمان',         latitude: 23.5859, longitude: 58.4059 },
  // مصر والشام
  { id: 'cairo',     nameAr: 'القاهرة',      nameEn: 'Cairo',     countryAr: 'مصر',           latitude: 30.0444, longitude: 31.2357 },
  { id: 'alex',      nameAr: 'الإسكندرية',   nameEn: 'Alexandria',countryAr: 'مصر',           latitude: 31.2001, longitude: 29.9187 },
  { id: 'amman',     nameAr: 'عمّان',         nameEn: 'Amman',     countryAr: 'الأردن',        latitude: 31.9454, longitude: 35.9284 },
  { id: 'jerusalem', nameAr: 'القدس',        nameEn: 'Jerusalem', countryAr: 'فلسطين',        latitude: 31.7683, longitude: 35.2137 },
  { id: 'damascus',  nameAr: 'دمشق',         nameEn: 'Damascus',  countryAr: 'سوريا',         latitude: 33.5138, longitude: 36.2765 },
  { id: 'beirut',    nameAr: 'بيروت',         nameEn: 'Beirut',    countryAr: 'لبنان',         latitude: 33.8938, longitude: 35.5018 },
  { id: 'baghdad',   nameAr: 'بغداد',         nameEn: 'Baghdad',   countryAr: 'العراق',        latitude: 33.3152, longitude: 44.3661 },
  // شمال أفريقيا
  { id: 'casa',      nameAr: 'الدار البيضاء',nameEn: 'Casablanca',countryAr: 'المغرب',        latitude: 33.5731, longitude: -7.5898 },
  { id: 'tunis',     nameAr: 'تونس',          nameEn: 'Tunis',     countryAr: 'تونس',          latitude: 36.8065, longitude: 10.1815 },
  { id: 'algiers',   nameAr: 'الجزائر',       nameEn: 'Algiers',   countryAr: 'الجزائر',       latitude: 36.7372, longitude: 3.0863 },
  { id: 'khartoum',  nameAr: 'الخرطوم',       nameEn: 'Khartoum',  countryAr: 'السودان',       latitude: 15.5007, longitude: 32.5599 },
  // آسيا
  { id: 'istanbul',  nameAr: 'إسطنبول',       nameEn: 'Istanbul',  countryAr: 'تركيا',         latitude: 41.0082, longitude: 28.9784 },
  { id: 'tehran',    nameAr: 'طهران',         nameEn: 'Tehran',    countryAr: 'إيران',         latitude: 35.6892, longitude: 51.3890 },
  { id: 'karachi',   nameAr: 'كراتشي',        nameEn: 'Karachi',   countryAr: 'باكستان',       latitude: 24.8607, longitude: 67.0011 },
  { id: 'jakarta',   nameAr: 'جاكرتا',        nameEn: 'Jakarta',   countryAr: 'إندونيسيا',     latitude: -6.2088, longitude: 106.8456 },
  { id: 'kuala',     nameAr: 'كوالالمبور',    nameEn: 'KL',        countryAr: 'ماليزيا',       latitude: 3.1390,  longitude: 101.6869 },
  // عواصم غربية لها جاليات كبيرة
  { id: 'london',    nameAr: 'لندن',          nameEn: 'London',    countryAr: 'المملكة المتحدة', latitude: 51.5074, longitude: -0.1278 },
  { id: 'paris',     nameAr: 'باريس',         nameEn: 'Paris',     countryAr: 'فرنسا',         latitude: 48.8566, longitude: 2.3522 },
  { id: 'berlin',    nameAr: 'برلين',          nameEn: 'Berlin',    countryAr: 'ألمانيا',       latitude: 52.5200, longitude: 13.4050 },
  { id: 'nyc',       nameAr: 'نيويورك',        nameEn: 'New York',  countryAr: 'الولايات المتحدة', latitude: 40.7128, longitude: -74.0060 },
];

/** يرجع لفظاً عربياً لاتجاه عام بناءً على الزاوية. */
export function describeBearingAr(bearing: number): string {
  // 8 جهات
  const normalized = (bearing + 360) % 360;
  if (normalized < 22.5)  return 'شمالاً';
  if (normalized < 67.5)  return 'شمال شرق';
  if (normalized < 112.5) return 'شرقاً';
  if (normalized < 157.5) return 'جنوب شرق';
  if (normalized < 202.5) return 'جنوباً';
  if (normalized < 247.5) return 'جنوب غرب';
  if (normalized < 292.5) return 'غرباً';
  if (normalized < 337.5) return 'شمال غرب';
  return 'شمالاً';
}
