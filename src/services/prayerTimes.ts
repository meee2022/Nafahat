/**
 * حساب مواقيت الصلاة - خوارزمية محلية بدون API.
 *
 * يستخدم معادلات Praytimes.org (طريقة أم القرى افتراضياً).
 * المرجع: https://praytimes.org/calculation
 *
 * يقبل إحداثيات (lat/lng) + المنطقة الزمنية + الطريقة، يُرجع 6 أوقات بالـ HH:MM.
 */

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export type CalculationMethod =
  | 'MWL'   // Muslim World League
  | 'ISNA'  // Islamic Society of North America
  | 'Egypt' // الهيئة المصرية العامة للمساحة
  | 'Makkah' // أم القرى
  | 'Karachi' // كراتشي
  | 'Tehran'
  | 'Jafari';

const METHOD_PARAMS: Record<CalculationMethod, { fajr: number; isha: number | string }> = {
  MWL:     { fajr: 18,    isha: 17 },
  ISNA:    { fajr: 15,    isha: 15 },
  Egypt:   { fajr: 19.5,  isha: 17.5 },
  Makkah:  { fajr: 18.5,  isha: '90 min' }, // بعد المغرب
  Karachi: { fajr: 18,    isha: 18 },
  Tehran:  { fajr: 17.7,  isha: 14 },
  Jafari:  { fajr: 16,    isha: 14 },
};

// ============== Math helpers ==============
const dtr = (d: number) => (d * Math.PI) / 180;
const rtd = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(dtr(d));
const cos = (d: number) => Math.cos(dtr(d));
const tan = (d: number) => Math.tan(dtr(d));
const asin = (d: number) => rtd(Math.asin(d));
const acos = (d: number) => rtd(Math.acos(d));
const atan2 = (y: number, x: number) => rtd(Math.atan2(y, x));
const fixHour = (h: number) => {
  let v = h - 24 * Math.floor(h / 24);
  return v < 0 ? v + 24 : v;
};

/** الموقع الشمسي ليوم Julian معيّن. */
function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  const eqt = q / 15 - fixHour(RA);
  const decl = asin(sin(e) * sin(L));
  return { declination: decl, equation: eqt };
}

function fixAngle(a: number) {
  let v = a - 360 * Math.floor(a / 360);
  return v < 0 ? v + 360 : v;
}

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/** زاوية الشمس من الأفق لوقت معيّن. */
function sunAngleTime(angle: number, t: number, jd: number, lat: number, direction: 'ccw' | 'cw' = 'ccw'): number {
  const decl = sunPosition(jd + t).declination;
  const noon = computeNoon(jd, 0);
  const arg = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
  if (arg < -1 || arg > 1) return NaN;
  const t2 = (1 / 15) * acos(arg);
  return noon + (direction === 'ccw' ? -t2 : t2);
}

function computeNoon(jd: number, t: number): number {
  return 12 - sunPosition(jd + t).equation;
}

/** زاوية العصر (Shafi=1, Hanafi=2). */
function asrTime(factor: number, t: number, jd: number, lat: number): number {
  const decl = sunPosition(jd + t).declination;
  const angle = -rtd(Math.atan(1 / (factor + tan(Math.abs(lat - decl)))));
  return sunAngleTime(angle, t, jd, lat, 'cw');
}

function formatTime(time: number, tz: number): string {
  if (isNaN(time)) return '--:--';
  let t = fixHour(time + tz);
  let hours = Math.floor(t);
  let minutes = Math.round((t - hours) * 60);
  if (minutes >= 60) { hours += 1; minutes -= 60; }
  hours = ((hours % 24) + 24) % 24;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ============== Public API ==============

export interface PrayerCalcParams {
  date?: Date;
  latitude: number;
  longitude: number;
  /** ساعة الإزاحة الزمنية (مثال: +3 للسعودية، +2 لمصر). */
  timezone: number;
  method?: CalculationMethod;
  /** للعصر: 1 = شافعي (افتراضي)، 2 = حنفي */
  asrFactor?: 1 | 2;
}

/** يحسب مواقيت الصلوات الستة للموقع المحدد. */
export function calculatePrayerTimes(params: PrayerCalcParams): PrayerTimes {
  const date = params.date ?? new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const lat = params.latitude;
  const tz = params.timezone - params.longitude / 15;

  const jd = julianDate(year, month, day) - params.longitude / (15 * 24);
  const method = METHOD_PARAMS[params.method ?? 'Makkah'];

  const fajr    = sunAngleTime(method.fajr as number, 5 / 24, jd, lat, 'ccw');
  const sunrise = sunAngleTime(0.833, 6 / 24, jd, lat, 'ccw');
  const dhuhr   = computeNoon(jd, 12 / 24) + 0.0667; // +4 دقائق احتياط
  const asr     = asrTime(params.asrFactor ?? 1, 13 / 24, jd, lat);
  const maghrib = sunAngleTime(0.833, 18 / 24, jd, lat, 'cw');
  let ishaTime: number;
  if (typeof method.isha === 'string' && method.isha.includes('min')) {
    const mins = parseFloat(method.isha) / 60;
    ishaTime = maghrib + mins;
  } else {
    ishaTime = sunAngleTime(method.isha as number, 18 / 24, jd, lat, 'cw');
  }

  return {
    fajr:    formatTime(fajr, tz),
    sunrise: formatTime(sunrise, tz),
    dhuhr:   formatTime(dhuhr, tz),
    asr:     formatTime(asr, tz),
    maghrib: formatTime(maghrib, tz),
    isha:    formatTime(ishaTime, tz),
  };
}

/** يرجع الصلاة القادمة + الوقت المتبقّي بالدقائق. */
export function nextPrayer(times: PrayerTimes, now: Date = new Date()): {
  name: PrayerName;
  time: string;
  minutesUntil: number;
} {
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const name of order) {
    const [h, m] = times[name].split(':').map(Number);
    const prayerMin = h * 60 + m;
    if (prayerMin > nowMin) {
      return { name, time: times[name], minutesUntil: prayerMin - nowMin };
    }
  }
  // كل الصلوات مرّت اليوم → الفجر غداً
  const [h, m] = times.fajr.split(':').map(Number);
  const minutesUntil = (24 * 60 - nowMin) + (h * 60 + m);
  return { name: 'fajr', time: times.fajr, minutesUntil };
}

/** أسماء الصلوات بالعربية. */
export const PRAYER_NAMES_AR: Record<PrayerName, string> = {
  fajr:    'الفجر',
  sunrise: 'الشروق',
  dhuhr:   'الظهر',
  asr:     'العصر',
  maghrib: 'المغرب',
  isha:    'العشاء',
};

/** أسماء الصلوات بالإنجليزية. */
export const PRAYER_NAMES_EN: Record<PrayerName, string> = {
  fajr:    'Fajr',
  sunrise: 'Sunrise',
  dhuhr:   'Dhuhr',
  asr:     'Asr',
  maghrib: 'Maghrib',
  isha:    'Isha',
};
