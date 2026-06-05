/**
 * Config Plugin: إزالة صلاحية ACTIVITY_RECOGNITION من AndroidManifest.
 *
 * بعض المكتبات تضيف android.permission.ACTIVITY_RECOGNITION تلقائياً عند الدمج،
 * وهي صلاحية «صحية» تطلبها Google ضمن Health Apps policy. تطبيق نَفَحات
 * (قرآن / أذكار / مواقيت / قبلة) لا يستخدم أي ميزة صحية إطلاقاً، فنزيلها نهائياً
 * عبر tools:node="remove" حتى يحذفها دامج الـ manifest حتى لو أضافتها مكتبة.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const PERM = 'android.permission.ACTIVITY_RECOGNITION';

const withRemoveActivityRecognition = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // تأكيد وجود مساحة الأسماء tools
    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    // احذف أي إعلان صريح للصلاحية
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      (p) => p?.$?.['android:name'] !== PERM
    );

    // أضِف توجيه الإزالة ليحذفها دامج الـ manifest حتى لو حقنتها مكتبة
    manifest['uses-permission'].push({
      $: {
        'android:name': PERM,
        'tools:node': 'remove',
      },
    });

    return cfg;
  });

module.exports = withRemoveActivityRecognition;
