/**
 * HTML shell للويب فقط - يضبط RTL ويُحمّل Google Fonts الأساسية:
 *  - Amiri Quran          : النص القرآني
 *  - IBM Plex Sans Arabic : واجهة عربية
 *  - Inter                : واجهة لاتينية
 *
 * يضمن أن كل النصوص العربية في كل أنحاء التطبيق تستخدم خطاً عربياً صحيحاً
 * يدعم الـ tashkeel والحروف المتصلة بدون انقطاع.
 *
 * 🔑 الحل الأساسي لمشكلة "الكلام مقطع":
 *    letter-spacing: 0 !important على كل العناصر في RTL.
 *    هذا يشمل inline styles من React Native Web ويحلّ المشكلة في كل الصفحات.
 */
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

type Props = { children: React.ReactNode };

export default function Root({ children }: Props) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Scheherazade+New:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />

        {/* 🕌 الخط الرسمي لمجمع الملك فهد (KFGQPC Uthmanic Hafs) */}
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'KFGQPC Uthmanic Hafs';
            src: url('https://cdn.jsdelivr.net/npm/kfgqpc-uthmanic-script-hafs-regular@1.0.0/arabic.otf') format('opentype');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
          }
        `}} />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { margin: 0; min-height: 100vh; }

          /* ════ الخطوط الأساسية ════ */
          html, body, #root, div, span, p, h1, h2, h3, h4, h5, h6,
          button, input, textarea, select, label, a, li, td, th {
            font-family: "IBM Plex Sans Arabic", "Inter", -apple-system, BlinkMacSystemFont,
                         "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
            -webkit-font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body {
            font-family: "IBM Plex Sans Arabic", "Inter", system-ui, -apple-system, sans-serif;
          }

          /* ════ النص القرآني ════ */
          /* الأولوية: KFGQPC Uthmanic Hafs (خط مجمع الملك فهد الرسمي) → Scheherazade New → Amiri Quran */
          [data-quran-text="true"], .quran-text {
            font-family: "KFGQPC Uthmanic Hafs", "Scheherazade New", "Amiri Quran", "Traditional Arabic", serif !important;
            font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "ss01" 1 !important;
          }

          /* تحسين رسم النص القرآني خصوصاً مع Scheherazade New */
          .quran-text, [data-quran-text="true"] {
            -webkit-font-smoothing: subpixel-antialiased;
            font-variant-ligatures: contextual common-ligatures;
          }

          /* ════ 🔑 الحل الجوهري: منع letter-spacing على النصوص العربية ════
             letter-spacing الكبير بيكسر الحروف المتصلة والتشكيل في العربي.
             نشيله من كل النصوص داخل RTL، والاستثناء على الأرقام فقط. */
          [dir="rtl"] *,
          html[dir="rtl"] body * {
            letter-spacing: 0 !important;
            word-spacing: normal !important;
          }

          /* الأرقام (ساعة العداد، الإحصائيات) ممكن تحتفظ بـ tabular-nums
             لكن من غير letter-spacing عشان مايبقاش متباعد جداً */
          [dir="rtl"] [data-tabular-nums="true"] {
            font-variant-numeric: tabular-nums;
            letter-spacing: 0 !important;
          }

          /* الـ unicode-bidi لعزل اتجاه النصوص داخل العنصر */
          [dir="rtl"] {
            unicode-bidi: isolate;
          }

          /* ════ تحسينات إضافية ════ */
          * { box-sizing: border-box; }

          /* منع زوم iOS عند الضغط على input */
          input, textarea, select {
            font-size: 16px;
          }
        `}} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
