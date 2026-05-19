const { getDefaultConfig } = require('expo/metro-config');

// 🛰️ Sentry source-maps support — يغلّف expo's metro config بـ Sentry wrapper
//   لما الـ package متركّب. ده ضروري عشان stack traces في الـ production تكون
//   مقروءة (مش minified). يرجع للـ default config لو @sentry/react-native
//   مش موجود (للـ dev بدون Sentry).
let config;
try {
  const { getSentryExpoConfig } = require('@sentry/react-native/metro');
  config = getSentryExpoConfig(__dirname);
} catch {
  config = getDefaultConfig(__dirname);
}

module.exports = config;
