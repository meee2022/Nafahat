/**
 * HTML shell للويب فقط - يضبط RTL ويُحمّل Google Fonts الأساسية:
 *  - Amiri Quran          : النص القرآني
 *  - IBM Plex Sans Arabic : واجهة عربية
 *  - Inter                : واجهة لاتينية
 *
 * يضمن أن كل النصوص العربية في كل أنحاء التطبيق تستخدم خطاً عربياً صحيحاً
 * يدعم الـ tashkeel والحروف المتصلة بدون انقطاع.
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { margin: 0; min-height: 100vh; }

          /* الخط العربي العام لكل العناصر - مع fallback شامل */
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
            font-family: "IBM Plex Sans Arabic", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          }

          /* النص القرآني - خط Amiri Quran فقط */
          [data-quran-text="true"], .quran-text {
            font-family: "Amiri Quran", "Traditional Arabic", serif !important;
          }

          /* منع كسر الكلمات العربية */
          * {
            word-spacing: normal;
          }

          /* عزل الاتجاه - يساعد على تجنّب كسر الحروف العربية المتصلة */
          [dir="rtl"] * {
            unicode-bidi: isolate;
          }
        `}} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
