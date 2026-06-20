/**
 * 🛰️ خدمة التحديد التلقائي للموقع.
 *
 * تُستدعى عند فتح التطبيق (من _layout) لتحديد موقع المستخدم تلقائياً عشان
 *   مواقيت الصلاة + الأذان + اتجاه القبلة + المساجد القريبة تشتغل صح من غير
 *   ما يضطر يختار مدينته يدوياً.
 *
 * السلوك:
 *  - لو المستخدم اختار مدينته يدوياً قبل كده (locationManuallySet) → نحترم اختياره
 *    ولا نكتب فوقه (إلا لو force=true).
 *  - لو الإذن ممنوح بالفعل → نجيب الموقع بصمت ونحدّثه (تحديث طازج كل فتحة).
 *  - لو الإذن لسه مطلوب → نطلبه مرة واحدة (prompt). لو اترفض → نسيب الافتراضي
 *    من غير إزعاج (يقدر يفعّله لاحقاً من شاشة الموقع).
 */
import { useSettingsStore } from '@store/index';
import type { UserLocation } from '@store/settingsStore';

let Location: typeof import('expo-location') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Location = require('expo-location');
} catch {
  Location = null;
}

let inFlight = false;

interface DetectOpts {
  /** اطلب الإذن لو لسه ماتطلبش (يظهر dialog النظام). افتراضي true. */
  prompt?: boolean;
  /** حدّث حتى لو المستخدم اختار مدينته يدوياً. افتراضي false. */
  force?: boolean;
}

/**
 * يحدّد موقع المستخدم ويحدّث الستور. يرجّع الموقع الجديد أو null لو فشل/رُفض.
 * آمن تماماً — أي خطأ يرجّع null من غير ما يكسر الإقلاع.
 */
export async function autoDetectLocation(opts: DetectOpts = {}): Promise<UserLocation | null> {
  const { prompt = true, force = false } = opts;
  if (inFlight) return null;
  if (!Location) return null;

  // نحترم الاختيار اليدوي للمستخدم
  if (!force && useSettingsStore.getState().locationManuallySet) return null;

  inFlight = true;
  try {
    // 1) تأكّد من الإذن (من غير ما نزعج لو مرفوض ومش قابل لإعادة الطلب)
    let granted = false;
    try {
      const cur = await Location.getForegroundPermissionsAsync();
      if (cur.status === 'granted') {
        granted = true;
      } else if (prompt && cur.canAskAgain) {
        const req = await Location.requestForegroundPermissionsAsync();
        granted = req.status === 'granted';
      }
    } catch {
      granted = false;
    }
    if (!granted) return null;

    // 2) جيب الإحداثيات
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;

    // 3) اسم المدينة + رمز الدولة (reverse geocode) — اختياري، نكمّل بدونه لو فشل
    let cityAr = 'موقعي الحالي';
    let cityEn = 'My Location';
    let countryCode: string | undefined;
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      const name = geo[0]?.city || geo[0]?.region || geo[0]?.subregion;
      if (name) {
        cityAr = name;
        cityEn = name;
      }
      if (geo[0]?.isoCountryCode) countryCode = geo[0].isoCountryCode;
    } catch {}

    // 4) المنطقة الزمنية الحالية للجهاز بالساعات (مثلاً مصر = +2)
    const timezone = -new Date().getTimezoneOffset() / 60;

    const loc: UserLocation = { cityAr, cityEn, latitude, longitude, timezone, countryCode };
    // manual=false → يفضل قابل للتحديث التلقائي في الفتحات الجاية
    useSettingsStore.getState().setLocation(loc, false);
    return loc;
  } catch {
    return null;
  } finally {
    inFlight = false;
  }
}

/** هل خدمة الموقع متاحة أصلاً (الباكدج متركّب). */
export const isLocationAvailable = (): boolean => !!Location;
