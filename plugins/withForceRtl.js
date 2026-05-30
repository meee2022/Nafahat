/**
 * Config Plugin: فرض اتجاه RTL على مستوى أندرويد الأصلي.
 *
 * المشكلة: I18nManager.forceRTL(true) من JavaScript لا يُطبَّق إلا بعد إعادة
 * تشغيل التطبيق، فأول فتح بعد التثبيت يظهر LTR.
 *
 * الحل: نحقن استدعاء I18nUtil.forceRTL داخل MainActivity.onCreate (Kotlin)
 * قبل تهيئة React — فيصبح التطبيق RTL من أول إطار، بدون أي flash أو إعادة تشغيل.
 */
const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_KT = 'import com.facebook.react.modules.i18nmanager.I18nUtil';
const CALL_KT = [
  '    // فرض RTL أصلياً (نَفَحات تطبيق عربي بالكامل)',
  '    val i18nUtil = I18nUtil.getInstance()',
  '    i18nUtil.allowRTL(applicationContext, true)',
  '    i18nUtil.forceRTL(applicationContext, true)',
].join('\n');

const withForceRtl = (config) =>
  withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';

    if (!isKotlin) {
      // Java fallback (نادر في SDK الحديثة)
      const IMPORT_JAVA = 'import com.facebook.react.modules.i18nmanager.I18nUtil;';
      const CALL_JAVA = [
        '    I18nUtil i18nUtil = I18nUtil.getInstance();',
        '    i18nUtil.allowRTL(getApplicationContext(), true);',
        '    i18nUtil.forceRTL(getApplicationContext(), true);',
      ].join('\n');
      if (!src.includes(IMPORT_JAVA)) {
        src = src.replace(/(package .*;\n)/, `$1\n${IMPORT_JAVA}\n`);
      }
      if (!src.includes('forceRTL(getApplicationContext')) {
        src = src.replace(/(super\.onCreate\([^;]*\);)/, `${CALL_JAVA}\n    $1`);
      }
      cfg.modResults.contents = src;
      return cfg;
    }

    // Kotlin (SDK 56 الافتراضي)
    if (!src.includes(IMPORT_KT)) {
      src = src.replace(/(package .*\n)/, `$1\n${IMPORT_KT}\n`);
    }
    if (!src.includes('forceRTL(applicationContext')) {
      // نحقن قبل أول super.onCreate(...) داخل الكلاس
      src = src.replace(/(\n\s*super\.onCreate\([^)]*\))/, `\n${CALL_KT}$1`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = withForceRtl;
