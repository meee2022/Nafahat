/**
 * 📿 خدمة الأذكار الدورية — إشعارات تذكير بالذِّكر على مدار اليوم.
 *
 * تجدول إشعارات يومية متكرّرة خلال ساعات اليقظة (٨ص–١٠م) بفاصل يختاره
 * المستخدم (كل ساعة/ساعتين/٣ ساعات)، وكل إشعار يحمل ذِكراً مختلفاً من مجموعة
 * متنوّعة. لا تعمل في ساعات النوم احتراماً لراحة المستخدم.
 *
 * تستخدم صيغة SchedulableTriggerInputTypes.DAILY (SDK 56).
 */
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let Notifications: any = null;
try {
  if (!isWeb) Notifications = require('expo-notifications');
} catch {}

const isAvailable = (): boolean => !isWeb && !!Notifications;

/** مجموعة الأذكار التي تدور عليها الإشعارات. */
const DHIKR_POOL: { title: string; body: string }[] = [
  { title: '📿 ذِكر', body: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيم' },
  { title: '📿 ذِكر', body: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَه' },
  { title: '📿 ذِكر', body: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِين' },
  { title: '📿 ذِكر', body: 'اللَّهُ أَكْبَرُ كَبِيرًا' },
  { title: '📿 استغفار', body: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْه' },
  { title: '📿 ذِكر', body: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّه' },
  { title: '🤍 صلاة على النبي', body: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّد' },
  { title: '📿 ذِكر', body: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيل' },
  { title: '📿 ذِكر', body: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَر' },
  { title: '🤲 دعاء', body: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِك' },
];

const START_HOUR = 8;   // أول إشعار الساعة ٨ صباحاً
const END_HOUR = 22;    // آخر إشعار الساعة ١٠ مساءً
const ID_PREFIX = 'dhikr-';

/** يطلب إذن الإشعارات إن لزم. */
async function ensurePermission(): Promise<boolean> {
  if (!isAvailable()) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** يلغي كل إشعارات الأذكار الدورية المُجَدْوَلة. */
export async function cancelDhikrReminders(): Promise<void> {
  if (!isAvailable()) return;
  try {
    for (let h = 0; h < 24; h++) {
      await Notifications.cancelScheduledNotificationAsync(`${ID_PREFIX}${h}`).catch(() => {});
    }
  } catch {}
}

/**
 * يجدول الأذكار الدورية بفاصل intervalHours ساعة خلال ساعات اليقظة.
 * يلغي السابق ثم يعيد الجدولة. كل إشعار يحمل ذِكراً مختلفاً بالتناوب.
 */
export async function scheduleDhikrReminders(intervalHours: number): Promise<boolean> {
  if (!isAvailable()) return false;
  const granted = await ensurePermission();
  if (!granted) return false;

  await cancelDhikrReminders();

  const step = Math.max(1, Math.round(intervalHours));
  let idx = 0;
  try {
    for (let hour = START_HOUR; hour <= END_HOUR; hour += step) {
      const d = DHIKR_POOL[idx % DHIKR_POOL.length];
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${hour}`,
        content: {
          title: d.title,
          body: d.body,
          sound: 'default',
          data: { type: 'dhikr' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      });
      idx++;
    }
    return true;
  } catch {
    return false;
  }
}
