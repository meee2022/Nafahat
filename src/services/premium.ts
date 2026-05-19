/**
 * 💎 Premium subscription service — graceful RevenueCat wrapper.
 *
 * يشتغل بـ stub لو react-native-purchases مش متركّب (للـ dev). لما تركّب الـ
 * package + تضيف API key، الـ functions تتحوّل لـ purchases الفعلية.
 *
 * لتفعيل:
 *   1. npm install react-native-purchases
 *   2. أضف EXPO_PUBLIC_RC_IOS_KEY و EXPO_PUBLIC_RC_ANDROID_KEY في .env
 *   3. أنشئ products في RevenueCat dashboard: nafahat_monthly, nafahat_yearly
 *   4. cd ios && pod install
 *   5. أعد بناء التطبيق
 *
 * Usage:
 *   const offerings = await getOfferings();           // قائمة الباقات
 *   await purchasePackage(offerings[0]);              // شراء
 *   const isPro = await checkActiveSubscription();    // تحقّق
 *   await restorePurchases();                         // استرجاع
 */
import { Platform } from 'react-native';
import { log } from '@utils/logger';
import { useSettingsStore } from '@store/index';

let Purchases: any = null;
let rcReady = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases');
} catch {
  // مش متركّب - الـ stubs بتشتغل بدل
}

/** يستخدم Platform المناسبة لاختيار الـ key الصحيح. */
function getApiKey(): string {
  const iosKey = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
  const androidKey = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
  return Platform.OS === 'ios' ? iosKey : androidKey;
}

/**
 * يهيّئ RevenueCat. يستدعى مرة عند بدء التطبيق.
 * يفشل بصمت لو الـ package أو الـ key مش موجودين.
 */
export async function initPremium(userId?: string): Promise<void> {
  if (!Purchases?.configure) return;
  const key = getApiKey();
  if (!key) {
    log.info('RevenueCat: skipped init (no API key)');
    return;
  }
  try {
    await Purchases.configure({ apiKey: key, appUserID: userId });
    rcReady = true;
    log.info('RevenueCat initialized');
  } catch (e) {
    log.warn('RevenueCat init failed', { error: String(e) });
  }
}

export interface PremiumPackage {
  identifier: string;
  product: {
    title: string;
    priceString: string;
    description: string;
  };
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM';
}

/**
 * يجلب الباقات المتاحة. لو RC غير فعّال، يرجّع stub بـ السعر الافتراضي.
 */
export async function getOfferings(): Promise<PremiumPackage[]> {
  if (rcReady && Purchases?.getOfferings) {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings?.current;
      if (current?.availablePackages?.length) {
        return current.availablePackages.map((p: any) => ({
          identifier: p.identifier,
          product: {
            title: p.product?.title ?? '',
            priceString: p.product?.priceString ?? '',
            description: p.product?.description ?? '',
          },
          packageType: p.packageType ?? 'CUSTOM',
        }));
      }
    } catch (e) {
      log.warn('getOfferings failed', { error: String(e) });
    }
  }
  // 📦 stub fallback (للـ dev و الـ UI preview)
  return [
    { identifier: 'monthly', product: { title: 'الباقة الشهرية', priceString: '$4.99/شهر', description: 'نَفَحات Premium' }, packageType: 'MONTHLY' },
    { identifier: 'yearly',  product: { title: 'الباقة السنوية', priceString: '$39.99/سنة', description: 'وفّر 33%' },         packageType: 'ANNUAL' },
    { identifier: 'lifetime',product: { title: 'مدى الحياة',    priceString: '$149 لمرة واحدة', description: 'دفعة واحدة' },  packageType: 'LIFETIME' },
  ];
}

/**
 * يبدأ عملية شراء. لو RC غير فعّال، يفعّل isPremium محلياً (للـ dev).
 */
export async function purchasePackage(pkg: PremiumPackage | string): Promise<boolean> {
  const identifier = typeof pkg === 'string' ? pkg : pkg.identifier;
  if (rcReady && Purchases?.purchasePackage) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isActive = !!customerInfo?.entitlements?.active?.premium;
      if (isActive) {
        useSettingsStore.getState().setPremium(true);
        return true;
      }
      return false;
    } catch (e: any) {
      if (e?.userCancelled) return false;
      log.error('purchase failed', { error: String(e), identifier });
      return false;
    }
  }
  // ✋ stub: فعّل premium محلياً (للـ dev/testing)
  useSettingsStore.getState().setPremium(true);
  log.info('Premium activated (stub mode)', { identifier });
  return true;
}

/**
 * استرجاع المشتريات (لو المستخدم اشترى على جهاز تاني).
 */
export async function restorePurchases(): Promise<boolean> {
  if (rcReady && Purchases?.restorePurchases) {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isActive = !!customerInfo?.entitlements?.active?.premium;
      useSettingsStore.getState().setPremium(isActive);
      return isActive;
    } catch (e) {
      log.error('restore failed', { error: String(e) });
      return false;
    }
  }
  return useSettingsStore.getState().isPremium;
}

/**
 * يتحقّق من حالة الاشتراك الحالية.
 */
export async function checkActiveSubscription(): Promise<boolean> {
  if (rcReady && Purchases?.getCustomerInfo) {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = !!customerInfo?.entitlements?.active?.premium;
      useSettingsStore.getState().setPremium(isActive);
      return isActive;
    } catch {
      return useSettingsStore.getState().isPremium;
    }
  }
  return useSettingsStore.getState().isPremium;
}

/** Public flag — true لو RevenueCat فعّال (للـ debug screens) */
export const isPremiumReady = () => rcReady;
