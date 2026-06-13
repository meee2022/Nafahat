/**
 * 🔑 مفاتيح Google OAuth (عامّة — آمنة للتضمين في التطبيق).
 *   - iosClientId: مفتاح تطبيق iOS (مرتبط بـ bundle id com.nafahat.app)
 *   - webClientId: مفتاح Web (يُستخدم للحصول على idToken للتحقق من الهوية)
 *   مصدرها: Google Cloud Console → APIs & Services → Credentials.
 */
export const GOOGLE_IOS_CLIENT_ID =
  '51568642934-iioeajrj5t53de6vcr0p40shc7l5345f.apps.googleusercontent.com';

export const GOOGLE_WEB_CLIENT_ID =
  '51568642934-ehspcp5a3i2p26pnpvc51cv6tqfdfeoe.apps.googleusercontent.com';
