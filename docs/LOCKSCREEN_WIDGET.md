# 📱 Lockscreen Widgets — Implementation Guide

Lockscreen widgets show **Continue Reading** + **آية اليوم** + **Next Prayer Time**
without opening the app. They require **native code** (SwiftUI on iOS, Glance on
Android) — not implementable with pure JS/React Native.

This document captures the design + integration plan so it can be built when ready.

## What the widgets should show

### Widget 1: Continue Reading (small)
- Surah name + page number
- "تابع القراءة" CTA (deep links to `/surah/{id}?page={n}`)
- Background: emerald gradient + gold border

### Widget 2: Ayah of the Day (medium)
- Quranic verse (Arabic font)
- Surah + ayah reference
- Deep links to `/ayah-of-day`

### Widget 3: Prayer Times Countdown (medium)
- Next prayer name + countdown HH:MM
- Mini strip of all 6 prayers
- Deep links to `/daily`

## iOS Implementation (SwiftUI + WidgetKit)

```swift
// ios/NafahatWidget/NafahatWidget.swift
import WidgetKit
import SwiftUI

struct ContinueReadingProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReadingEntry {
        ReadingEntry(date: Date(), surahName: "الفاتحة", page: 1)
    }
    func getSnapshot(in context: Context, completion: @escaping (ReadingEntry) -> Void) {
        completion(loadFromUserDefaults())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ReadingEntry>) -> Void) {
        let entry = loadFromUserDefaults()
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct ContinueReadingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "NafahatContinueReading", provider: ContinueReadingProvider()) { entry in
            VStack {
                Text("كمّل قراءتك")
                Text("سورة \(entry.surahName)")
                Text("صفحة \(entry.page)")
            }
            .background(LinearGradient(colors: [.green, .black], startPoint: .topLeading, endPoint: .bottomTrailing))
        }
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### Data sharing (RN ↔ Widget)
Use `react-native-shared-group-preferences` or `react-native-async-storage`
+ App Group to write data that the widget reads.

```ts
// React Native side
import SharedGroupPreferences from 'react-native-shared-group-preferences';
const APP_GROUP = 'group.com.nafahat.shared';

export async function syncWidgetData() {
  const lastRead = useReadingStore.getState().lastRead;
  if (!lastRead) return;
  await SharedGroupPreferences.setItem('lastRead', JSON.stringify(lastRead), APP_GROUP);
}
```

## Android Implementation (Glance / RemoteViews)

```kotlin
// android/app/src/main/java/com/nafahat/widget/ContinueReadingWidget.kt
class ContinueReadingWidget : GlanceAppWidget() {
    @Composable
    override fun Content() {
        val prefs = currentState<Preferences>()
        Column {
            Text("كمّل قراءتك")
            Text("سورة ${prefs[stringPreferencesKey("surahName")]}")
            Text("صفحة ${prefs[intPreferencesKey("page")]}")
        }
    }
}
```

## Setup Steps

1. Install: `expo install react-native-shared-group-preferences`
2. iOS: open `ios/Nafahat.xcworkspace`, add a new Widget Extension target
3. Configure App Groups in both targets to share `group.com.nafahat.shared`
4. Implement `WidgetKit` config + timeline in SwiftUI
5. Android: add Widget receiver in `AndroidManifest.xml`
6. Implement Glance composable
7. From RN: call `syncWidgetData()` after every `setLastRead`

## Deep-link Routing

The widgets use `expo-linking` to deep-link back into the app:
- `nafahat://surah/2?page=24` → opens surah 2 at page 24
- `nafahat://ayah-of-day` → opens daily verse
- `nafahat://daily` → opens daily tab

`app.json` `scheme: 'nafahat'` is already configured.

## Status

- [ ] iOS WidgetKit target
- [ ] Android Glance/AppWidget receiver
- [ ] Shared preferences data sync hook
- [ ] Deep-link handlers (already partial in expo-router)
- [ ] Widget previews + App Store screenshots

**Estimated effort**: 2-3 weeks of focused native work.
