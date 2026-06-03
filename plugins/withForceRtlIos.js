/**
 * Config Plugin: فرض اتجاه RTL على مستوى iOS الأصلي (native).
 *
 * المشكلة: على iOS، أمر I18nManager.forceRTL من JavaScript لا يُطبَّق إلا بعد
 * إعادة تشغيل التطبيق — فأوّل فتحة بعد التثبيت تظهر الواجهة من اليسار (LTR)،
 * وتنضبط بعد إغلاق التطبيق وفتحه.
 *
 * الحل: نحقن استدعاء RCTI18nUtil في AppDelegate (didFinishLaunchingWithOptions)
 * ليصبح RTL من أوّل إطار — تمامًا كما نفعل في MainActivity على أندرويد.
 * هذا نظير withForceRtl.js (أندرويد).
 */
const { withAppDelegate } = require('@expo/config-plugins');

const MARKER = 'RCTI18nUtil.sharedInstance().forceRTL';

const SWIFT_CALLS = [
  '    // فرض RTL أصلياً من أوّل فتحة (نَفَحات تطبيق عربي بالكامل)',
  '    RCTI18nUtil.sharedInstance().allowRTL(true)',
  '    RCTI18nUtil.sharedInstance().forceRTL(true)',
  '    RCTI18nUtil.sharedInstance().swapLeftAndRight(inRTL: false)',
].join('\n');

const OBJC_CALLS = [
  '  // فرض RTL أصلياً من أوّل فتحة (نَفَحات تطبيق عربي بالكامل)',
  '  [[RCTI18nUtil sharedInstance] allowRTL:YES];',
  '  [[RCTI18nUtil sharedInstance] forceRTL:YES];',
  '  [[RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:NO];',
].join('\n');

const withForceRtlIos = (config) =>
  withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes(MARKER) || src.includes('RCTI18nUtil sharedInstance] forceRTL')) {
      return cfg; // مُطبَّق بالفعل (idempotent)
    }

    const isSwift = cfg.modResults.language === 'swift';

    if (isSwift) {
      // تأكّد من استيراد React
      if (!/^\s*import React\s*$/m.test(src)) {
        src = src.replace(/(import Expo\s*\n)/, `$1import React\n`);
      }
      // أدخل الاستدعاءات بعد فتح دالة didFinishLaunchingWithOptions
      src = src.replace(
        /(func application\([^)]*didFinishLaunchingWithOptions[^{]*\{\s*\n)/,
        `$1${SWIFT_CALLS}\n`,
      );
    } else {
      // Objective-C
      if (!src.includes('#import <React/RCTI18nUtil.h>')) {
        src = src.replace(/(#import "AppDelegate.h"\s*\n)/, `$1#import <React/RCTI18nUtil.h>\n`);
      }
      src = src.replace(
        /(- \(BOOL\)application:[^\n]*didFinishLaunchingWithOptions[^\n]*\{\s*\n)/,
        `$1${OBJC_CALLS}\n`,
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = withForceRtlIos;
