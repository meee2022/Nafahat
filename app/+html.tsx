/**
 * HTML shell للويب فقط - يضبط RTL ويُحمّل Google Fonts الأساسية:
 *  - Amiri Quran          : النص القرآني
 *  - IBM Plex Sans Arabic : واجهة عربية
 *  - Inter                : واجهة لاتينية
 *
 * هذا التحميل احتياطي/مكمّل لـ @expo-google-fonts؛ يضمن ظهور الخط فوراً قبل
 * اكتمال تحميل expo-font عبر JS على الويب.
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
          body {
            font-family: "IBM Plex Sans Arabic", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          }
        `}} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
