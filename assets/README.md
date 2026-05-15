# الأصول (Assets)

ضع هنا الملفات التالية قبل بناء الـ APK/IPA:

- `icon.png` — 1024×1024 (أيقونة التطبيق)
- `splash.png` — 1284×2778 (شاشة البداية)
- `adaptive-icon.png` — 1024×1024 (Android adaptive)
- `favicon.png` — 48×48 (الويب)

تعمل واجهة التطبيق بدون هذه الملفات أثناء التطوير، لكن Expo سيحذرك من غيابها عند البناء النهائي.

## خطوط مقترحة (اختياري)

لتجربة قراءة أفضل للقرآن، يمكنك إضافة:
- KFGQPC Uthman Taha Naskh
- Amiri Quran
- Scheherazade New

ضعها في `assets/fonts/` وعرّفها في `expo-font` ثم حدّث `theme/typography.ts`.
