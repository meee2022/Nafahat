# نَفَحات · Nafahat

> صحبة دائمة مع القرآن الكريم.
> تطبيق إسلامي شامل (Expo + React Native + TypeScript) — قراءة، حفظ، تسميع، استماع، تجويد، أذكار، وتتبّع تقدم.

تصميم عصري بسيط، RTL أصلي بالكامل، وضعان فاتح وداكن جميلان، ودعم لتكبير الخط، وأيقونات متناسقة. كل المنطق جاهز للعمل من اليوم الأول ببيانات تجريبية واقعية ـــ ربط الـAPIs الخارجية (المصحف، التلاوات) قابل للإضافة عبر تعديل طبقة `data/` و `services/`.

---

## ✨ المزايا الرئيسية

### المصحف
- فهرس كامل لـ 114 سورة + 30 جزء + 60 حزب.
- بحث وفلترة (مكية/مدنية).
- صفحة سورة بقراءة مريحة، تكبير/تصغير الخط، تظليل آية، إجراءات سريعة (مرجعية، مفضلة، نسخ، مشاركة، استماع).

### الحفظ والمراجعة
- خطة حفظ مرنة (آيات / صفحات / أحزاب).
- نظام التكرار المتباعد (Spaced Repetition) شبيه بـ SM-2.
- لوحة "مهام اليوم" (مراجعة مستحقة + حفظ جديد).
- تقييم بثلاث درجات: صعب / متوسط / أتقنت — تُحدّث الجدولة تلقائيًا.

### التسميع
- 4 أوضاع: سمّع لنفسك، سمّع للشيخ، أكمل الآية، اختبرني.
- تسجيل صوتي، موجة بصرية، تقييم دقة وطلاقة، ملاحظات.

### الاستماع
- مكتبة قراء (12 قارئًا واقعيًا).
- صفحة قارئ بتصميم متدرج.
- مشغل صوت Premium (سرعة، تكرار، تكرار آية، مؤقت إيقاف، مفضلة، تحميل).
- شريط تشغيل صغير ثابت أعلى التاب بار.

### التجويد
- مسار تعليمي بثلاث مراحل (مبتدئ، متوسط، متقدم).
- 10 دروس جاهزة + إمكانية اختبار قصير.
- تتبع التقدم.

### الأذكار والتسبيح
- 6 فئات أذكار (صباح، مساء، بعد الصلاة، نوم، استيقاظ، عامة).
- سبحة إلكترونية بدائرة كبيرة وتأثيرات، 8 صيغ تسبيح جاهزة.
- عداد يومي، أهداف، تصفير، اهتزاز/صوت.

### الختمة
- 5 خطط ختمة (شهر، رمضان، شهرين، 3 شهور، العشر الأواخر).
- بطاقة ختمة نشطة + متابعة التقدم اليومي.

### حسابي والإحصائيات
- إحصائيات: صفحات، آيات محفوظة، دقائق استماع، تسبيحات.
- رسم بياني أسبوعي.
- إنجازات وشارات (8 شارات + 2 تحديات).
- إعدادات: مظهر فاتح/داكن/تلقائي، حجم خط (4 درجات)، إشعارات، نسخ احتياطي.

### الصفحة الرئيسية
- تحية ديناميكية حسب الوقت.
- بطاقة "آخر قراءة" بتدرج لوني فاخر.
- ورد يومي + سلسلة (streak).
- شبكة 8 خدمات بأيقونات ملوّنة.
- مهام الحفظ + آية اليوم + اقتراحات + بطاقة الإنجازات.

---

## 🛠️ التقنيات

| التقنية | الاستخدام |
|---|---|
| **Expo SDK 52 + React Native 0.76** | المنصة |
| **TypeScript** | أمان الأنواع |
| **Expo Router** | تنقل ملف-مبني |
| **Zustand** | إدارة الحالة (خفيف، بدون boilerplate) |
| **AsyncStorage** | تخزين محلي (هيدرة عند الإقلاع) |
| **expo-av** | الصوت والتسجيل |
| **expo-linear-gradient** | التدرجات اللونية |
| **lucide-react-native** | أيقونات حديثة موحّدة |
| **react-native-reanimated** | حركات سلسة |

---

## 🚀 التشغيل

```bash
# 1) ثبّت التبعيات
npm install

# 2) شغّل بـ Expo
npm run start

# اضغط على QR في تطبيق Expo Go (iOS/Android)
# أو شغّل محاكي:
npm run android
npm run ios
```

> **ملاحظة Windows:** إذا واجهت مشاكل في `react-native-reanimated`، شغّل PowerShell بصلاحيات Administrator، أو استخدم WSL.

---

## ☁️ Convex Backend (مزامنة سحابية)

التطبيق يستخدم **Convex** كـ backend اختياري للمزامنة بين الأجهزة. يعمل **offline-first** بشكل كامل دون Convex، ويفعّل المزامنة تلقائيًا فور توفّر URL صحيح.

### الإعداد لأول مرة

ملف `.env` يحتوي بالفعل على:
```bash
EXPO_PUBLIC_CONVEX_URL=https://qualified-crocodile-58.convex.cloud
```

لرفع الـ schema والدوال إلى deployment الخاص بك:
```bash
# 1) ثبّت Convex CLI (إن لم تكن مثبتة):
npm install -g convex

# 2) سجّل دخول وربط الـ deployment:
npx convex dev
# ستفتح صفحة لتسجيل الدخول إلى Convex
# ثم اختر deployment الخاص بك (qualified-crocodile-58)
# سيتم رفع `convex/schema.ts` + جميع الدوال تلقائيًا
# وستُولّد `convex/_generated/api.ts` لـ type-safety كامل
```

### ما يُزامَن عبر السحابة

| الكيان | الجدول | الدوال |
|---|---|---|
| الملف الشخصي | `profiles` | `get`, `upsert` |
| العلامات المرجعية | `bookmarks` | `list`, `add`, `remove` |
| الملاحظات | `notes` | `list`, `create`, `update`, `remove` |
| المفضلة | `favorites` | `list`, `toggle` |
| آخر موضع قراءة | `lastRead` | `get`, `set` |
| خطط الحفظ | `memoPlans` | `listPlans`, `createPlan`, `deletePlan` |
| مهام الحفظ (SRS) | `memoTasks` | `listTasks`, `dueTasks`, `createTask`, `updateTaskReview`, `deleteTask` |
| الإحصائيات | `stats` | `get`, `upsert` |

### بنية مجلد `convex/`

```
convex/
├── schema.ts           # تعريف 10 جداول مع الفهارس
├── profiles.ts         # ملف المستخدم
├── bookmarks.ts
├── notes.ts
├── favorites.ts
├── lastRead.ts
├── memorization.ts     # خطط + مهام SRS
├── stats.ts
├── tsconfig.json
└── _generated/         # يُولّد بـ `convex dev` (مُستثنى من Git)
```

### كيف يعمل العميل

```ts
// src/services/convex.ts
export const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;
```

- إن وُجد `EXPO_PUBLIC_CONVEX_URL`، نلفّ التطبيق بـ `<ConvexProvider>`.
- إن لم يوجد (أو فشل الاتصال)، يعمل التطبيق محليًا فقط دون أي تغيير في تجربة المستخدم.
- معرف الجهاز (`deviceId`) يُولَّد ويُحفظ في `AsyncStorage` ويُستخدم في كل استعلامات Convex (يدعم وضع الضيف).

### المزايا التي يمنحها

- **مزامنة فورية**: علامات/ملاحظات/خطط حفظ تنتقل بين الهاتف والجهاز اللوحي.
- **نسخ احتياطي**: لا تفقد تقدمك إن غيّرت جهازك.
- **حلّ تعارض الكتابات**: Convex يضمن ترتيب التحديثات (transactional).
- **Realtime queries**: التغييرات تصل لكل الأجهزة فورًا (عند ربط استعلامات تفاعلية).

### تشغيل Convex محليًا (للتطوير)

```bash
npm run convex:dev      # يرفع التغييرات تلقائيًا عند الحفظ
npm run convex:deploy   # رفع نسخة production
```

---

## 📁 هيكل المشروع

```
.
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root layout + ThemeProvider + Hydration
│   ├── index.tsx                 # Splash
│   ├── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tabs (5)
│   │   ├── index.tsx             # 🏠 الرئيسية
│   │   ├── mushaf.tsx            # 📖 المصحف
│   │   ├── memorization.tsx      # 🧠 الحفظ
│   │   ├── reciters.tsx          # 🎧 الاستماع
│   │   └── account.tsx           # 👤 حسابي
│   ├── surah/[id].tsx            # تفاصيل السورة
│   ├── reciter/[id].tsx          # صفحة القارئ
│   ├── tajweed/index.tsx         # قائمة دروس التجويد
│   ├── tajweed/[id].tsx          # درس تجويد
│   ├── adhkar/[category].tsx     # أذكار فئة
│   ├── tasmee.tsx                # التسميع
│   ├── tasbeeh.tsx               # السبحة
│   ├── khatma.tsx                # الختمة
│   ├── achievements.tsx          # الإنجازات
│   ├── player.tsx                # مشغل الصوت (modal)
│   └── search.tsx                # البحث (modal)
│
├── src/
│   ├── theme/                    # Design System
│   │   ├── colors.ts             # Light + Dark palettes
│   │   ├── typography.ts         # سلم الخطوط
│   │   ├── spacing.ts            # spacing / radius / shadows
│   │   ├── ThemeProvider.tsx     # Provider + RTL + AsyncStorage
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/                   # Text, Card, Button, Screen, AppHeader, Chip, ProgressBar, EmptyState, SectionHeader
│   │   └── common/               # IconCard, FeatureGrid, StatCard, LastReadCard, SurahListItem, AudioPlayerBar
│   ├── data/                     # بيانات تجريبية
│   │   ├── surahs.ts             # 114 سورة
│   │   ├── reciters.ts           # 12 قارئ
│   │   ├── ayahs.ts              # نصوص آيات
│   │   ├── adhkar.ts             # 14 ذكر بـ 6 فئات
│   │   ├── tasbeeh.ts            # 8 صيغ
│   │   ├── tajweed.ts            # 10 دروس
│   │   ├── achievements.ts       # شارات + تحديات
│   │   └── duas.ts
│   ├── store/                    # Zustand stores
│   │   ├── userStore.ts
│   │   ├── readingStore.ts       # last-read, bookmarks, notes, favorites
│   │   ├── memorizationStore.ts  # خطط + مهام
│   │   ├── statsStore.ts
│   │   ├── tasbeehStore.ts
│   │   └── audioStore.ts
│   ├── services/
│   │   └── memorization.ts       # خوارزمية التكرار المتباعد + اقتراح الخطط
│   └── types/
│       └── index.ts              # نماذج جميع الكيانات
│
├── app.json                      # Expo config (RTL, plugins, permissions)
├── babel.config.js               # aliases + reanimated
├── tsconfig.json                 # path aliases
└── package.json
```

---

## 🎨 نظام التصميم

### الألوان
- **Primary**: تركواز إسلامي حديث `#14746F` (مع تدرّج)
- **Accent**: ذهبي ناعم `#C9A961`
- **Background light**: `#FAF8F3` (كريم دافئ)
- **Background dark**: `#0A1110` (أخضر عميق)
- **Feature colors**: 8 ألوان مميزة للأقسام (Teal/Gold/Rose/Sky/Purple/Mint/Sand/Coral)

### الخطوط
- النص العام: System (Geeza Pro على iOS، Sans على Android)
- النص القرآني: Geeza Pro / Serif (قابل للاستبدال بـ KFGQPC أو Amiri)
- 11 صنف خط (display, h1..h3, subtitle, body, bodySm, caption, label, button, quran*)

### الزوايا والمسافات
- زوايا: 4 / 8 / 12 / 16 / 20 / 28 / 999
- مسافات: 2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56
- 5 مستويات ظل

---

## 🧠 منطق التكرار المتباعد

تجده في `src/services/memorization.ts`. مبسّط بشكل عملي:

```
محفوظ قوي  → معامل ×2.3
محفوظ متوسط → معامل ×1.6
محفوظ ضعيف  → معامل ×1.0

التكرار 1 → 1 يوم
التكرار 2 → 3 أيام
التكرار 3 → 7 أيام
التكرار 4 → 14 يوم
التكرار 5 → 30 يوم
التكرار 6+ → 60 يوم
```

يُحسب `intervalDays = round(base × factor)` ثم `nextReviewAt = now + intervalDays`.

---

## 📋 TODOs والأفكار للمراحل القادمة

- [ ] ربط API حقيقي للمصحف (Quran.com / AlQuran.cloud).
- [ ] تحميل ملفات صوتية لكل قارئ + كاش محلي عبر `expo-file-system`.
- [ ] إشعارات لطيفة (expo-notifications) لتذكير الورد والمراجعة.
- [ ] مزامنة سحابية (Firebase / Supabase) للنسخ الاحتياطي.
- [ ] خطوط القرآن الرسمية المجمع (KFGQPC).
- [ ] وضع مخصص للأطفال (ألوان أزهى + صور).
- [ ] وضع كبار السن (خط أكبر + UI أبسط).
- [ ] حساب معلم لإدارة طلاب.
- [ ] دعم الـ Widgets على iOS/Android.
- [ ] دعم Wear OS / Apple Watch.

---

## 📜 الترخيص

اختر الترخيص المناسب لمشروعك (MIT مقترح).

---

> **نَفَحات** — جُمعت من قول النبي ﷺ: *"إن لربكم في أيام دهركم نفحات، ألا فتعرّضوا لها"*. نسأل الله أن يجعل هذا التطبيق سببًا في قُرب قلوبنا من كتابه.
