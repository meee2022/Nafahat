/**
 * Config Plugin: فرض اتجاه RTL على مستوى أندرويد الأصلي.
 *
 * Android يتجاهل writingDirection في الـ styles، فاتجاه النص العربي يتبع
 * I18nManager.isRTL. ولأن forceRTL من JavaScript لا يُطبَّق إلا بعد إعادة تشغيل،
 * نحقن الاستدعاء في MainActivity.onCreate ليصبح RTL من أول إطار (بدون flash).
 */
const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_KT = 'import com.facebook.react.modules.i18nmanager.I18nUtil';
const CALL_KT = [
  '    // فرض RTL أصلياً (نَفَحات تطبيق عربي بالكامل)',
  '    val i18nUtil = I18nUtil.getInstance()',
  '    i18nUtil.allowRTL(applicationContext, true)',
  '    i18nUtil.forceRTL(applicationContext, true)',
  '    // إيقاف قلب left/right حتى تبقى textAlign:right يمين فيزيائياً',
  '    i18nUtil.swapLeftAndRightInRTL(applicationContext, false)',
].join('\n');

const withForceRtl = (config) =>
  withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';

    if (!isKotlin) {
      const IMPORT_JAVA = 'import com.facebook.react.modules.i18nmanager.I18nUtil;';
      const CALL_JAVA = [
        '    I18nUtil i18nUtil = I18nUtil.getInstance();',
        '    i18nUtil.allowRTL(getApplicationContext(), true);',
        '    i18nUtil.forceRTL(getApplicationContext(), true);',
        '    i18nUtil.swapLeftAndRightInRTL(getApplicationContext(), false);',
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

    if (!src.includes(IMPORT_KT)) {
      src = src.replace(/(package .*\n)/, `$1\n${IMPORT_KT}\n`);
    }
    if (!src.includes('forceRTL(applicationContext')) {
      src = src.replace(/(\n\s*super\.onCreate\([^)]*\))/, `\n${CALL_KT}$1`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = withForceRtl;
