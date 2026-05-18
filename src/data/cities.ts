/**
 * 🌍 قاعدة بيانات المدن الإسلامية + diaspora.
 *
 * تُستخدم لاختيار الموقع الجغرافي للمستخدم — يحدّد:
 *  - مواقيت الصلاة (latitude/longitude/timezone)
 *  - الأذان التلقائي
 *  - اتجاه القبلة
 *  - المساجد القريبة (default region)
 *
 * المصادر: قيم Lat/Long رسمية، الـ timezone بـ UTC offset (بدون DST).
 * أكثر من 60 مدينة تغطّي العالم الإسلامي + الجاليات الكبرى.
 */

export interface City {
  id: string;
  cityAr: string;
  cityEn: string;
  countryAr: string;
  countryEn: string;
  /** كود الدولة ISO 3166-1 alpha-2 لاستخدامه في filtering أو flags */
  countryCode: string;
  latitude: number;
  longitude: number;
  /** UTC offset بالساعات (موجب أو سالب). لا يأخذ Daylight Saving في الاعتبار. */
  timezone: number;
  /** علم الدولة كـ emoji */
  flag: string;
  /** هل المدينة "شعبية" — تظهر في قائمة الاقتراحات السريعة */
  popular?: boolean;
}

export const CITIES: City[] = [
  // ═══════════════ 🇸🇦 السعودية ═══════════════
  { id: 'mecca',     cityAr: 'مكة المكرمة',  cityEn: 'Mecca',         countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 21.3891, longitude: 39.8579, timezone: 3, flag: '🇸🇦', popular: true },
  { id: 'medina',    cityAr: 'المدينة المنورة', cityEn: 'Medina',     countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 24.4707, longitude: 39.6111, timezone: 3, flag: '🇸🇦', popular: true },
  { id: 'riyadh',    cityAr: 'الرياض',       cityEn: 'Riyadh',        countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 24.7136, longitude: 46.6753, timezone: 3, flag: '🇸🇦', popular: true },
  { id: 'jeddah',    cityAr: 'جدة',          cityEn: 'Jeddah',        countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 21.4858, longitude: 39.1925, timezone: 3, flag: '🇸🇦', popular: true },
  { id: 'dammam',    cityAr: 'الدمام',       cityEn: 'Dammam',        countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 26.4207, longitude: 50.0888, timezone: 3, flag: '🇸🇦' },
  { id: 'taif',      cityAr: 'الطائف',       cityEn: 'Taif',          countryAr: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', latitude: 21.2703, longitude: 40.4158, timezone: 3, flag: '🇸🇦' },

  // ═══════════════ 🇪🇬 مصر ═══════════════
  { id: 'cairo',     cityAr: 'القاهرة',      cityEn: 'Cairo',         countryAr: 'مصر',     countryEn: 'Egypt',        countryCode: 'EG', latitude: 30.0444, longitude: 31.2357, timezone: 2, flag: '🇪🇬', popular: true },
  { id: 'alexandria',cityAr: 'الإسكندرية',   cityEn: 'Alexandria',    countryAr: 'مصر',     countryEn: 'Egypt',        countryCode: 'EG', latitude: 31.2001, longitude: 29.9187, timezone: 2, flag: '🇪🇬', popular: true },
  { id: 'giza',      cityAr: 'الجيزة',       cityEn: 'Giza',          countryAr: 'مصر',     countryEn: 'Egypt',        countryCode: 'EG', latitude: 30.0131, longitude: 31.2089, timezone: 2, flag: '🇪🇬' },
  { id: 'luxor',     cityAr: 'الأقصر',       cityEn: 'Luxor',         countryAr: 'مصر',     countryEn: 'Egypt',        countryCode: 'EG', latitude: 25.6872, longitude: 32.6396, timezone: 2, flag: '🇪🇬' },
  { id: 'aswan',     cityAr: 'أسوان',        cityEn: 'Aswan',         countryAr: 'مصر',     countryEn: 'Egypt',        countryCode: 'EG', latitude: 24.0889, longitude: 32.8998, timezone: 2, flag: '🇪🇬' },

  // ═══════════════ 🇦🇪 الإمارات ═══════════════
  { id: 'dubai',     cityAr: 'دبي',          cityEn: 'Dubai',         countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, timezone: 4, flag: '🇦🇪', popular: true },
  { id: 'abudhabi',  cityAr: 'أبوظبي',       cityEn: 'Abu Dhabi',     countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 24.4539, longitude: 54.3773, timezone: 4, flag: '🇦🇪', popular: true },
  { id: 'sharjah',   cityAr: 'الشارقة',      cityEn: 'Sharjah',       countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 25.3463, longitude: 55.4209, timezone: 4, flag: '🇦🇪' },
  { id: 'ajman',     cityAr: 'عجمان',        cityEn: 'Ajman',         countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 25.4052, longitude: 55.5136, timezone: 4, flag: '🇦🇪' },
  { id: 'rak',       cityAr: 'رأس الخيمة',   cityEn: 'Ras Al Khaimah',countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 25.7895, longitude: 55.9432, timezone: 4, flag: '🇦🇪' },
  { id: 'fujairah',  cityAr: 'الفجيرة',      cityEn: 'Fujairah',      countryAr: 'الإمارات', countryEn: 'UAE',          countryCode: 'AE', latitude: 25.1288, longitude: 56.3265, timezone: 4, flag: '🇦🇪' },

  // ═══════════════ 🇰🇼 الكويت ═══════════════
  { id: 'kuwait',    cityAr: 'مدينة الكويت', cityEn: 'Kuwait City',   countryAr: 'الكويت',  countryEn: 'Kuwait',       countryCode: 'KW', latitude: 29.3759, longitude: 47.9774, timezone: 3, flag: '🇰🇼', popular: true },

  // ═══════════════ 🇶🇦 قطر ═══════════════
  { id: 'doha',      cityAr: 'الدوحة',       cityEn: 'Doha',          countryAr: 'قطر',     countryEn: 'Qatar',        countryCode: 'QA', latitude: 25.2854, longitude: 51.5310, timezone: 3, flag: '🇶🇦', popular: true },
  { id: 'rayyan',    cityAr: 'الريّان',      cityEn: 'Al Rayyan',     countryAr: 'قطر',     countryEn: 'Qatar',        countryCode: 'QA', latitude: 25.2919, longitude: 51.4244, timezone: 3, flag: '🇶🇦' },

  // ═══════════════ 🇧🇭 البحرين ═══════════════
  { id: 'manama',    cityAr: 'المنامة',      cityEn: 'Manama',        countryAr: 'البحرين', countryEn: 'Bahrain',      countryCode: 'BH', latitude: 26.2285, longitude: 50.5860, timezone: 3, flag: '🇧🇭' },

  // ═══════════════ 🇴🇲 عمان ═══════════════
  { id: 'muscat',    cityAr: 'مسقط',         cityEn: 'Muscat',        countryAr: 'عُمان',    countryEn: 'Oman',         countryCode: 'OM', latitude: 23.5859, longitude: 58.4059, timezone: 4, flag: '🇴🇲' },
  { id: 'salalah',   cityAr: 'صلالة',        cityEn: 'Salalah',       countryAr: 'عُمان',    countryEn: 'Oman',         countryCode: 'OM', latitude: 17.0151, longitude: 54.0924, timezone: 4, flag: '🇴🇲' },

  // ═══════════════ 🇯🇴 الأردن ═══════════════
  { id: 'amman',     cityAr: 'عمّان',        cityEn: 'Amman',         countryAr: 'الأردن',  countryEn: 'Jordan',       countryCode: 'JO', latitude: 31.9454, longitude: 35.9284, timezone: 3, flag: '🇯🇴', popular: true },
  { id: 'zarqa',     cityAr: 'الزرقاء',      cityEn: 'Zarqa',         countryAr: 'الأردن',  countryEn: 'Jordan',       countryCode: 'JO', latitude: 32.0728, longitude: 36.0876, timezone: 3, flag: '🇯🇴' },
  { id: 'irbid',     cityAr: 'إربد',         cityEn: 'Irbid',         countryAr: 'الأردن',  countryEn: 'Jordan',       countryCode: 'JO', latitude: 32.5556, longitude: 35.8500, timezone: 3, flag: '🇯🇴' },

  // ═══════════════ 🇱🇧 لبنان ═══════════════
  { id: 'beirut',    cityAr: 'بيروت',        cityEn: 'Beirut',        countryAr: 'لبنان',   countryEn: 'Lebanon',      countryCode: 'LB', latitude: 33.8938, longitude: 35.5018, timezone: 2, flag: '🇱🇧' },
  { id: 'tripoli-lb',cityAr: 'طرابلس',       cityEn: 'Tripoli',       countryAr: 'لبنان',   countryEn: 'Lebanon',      countryCode: 'LB', latitude: 34.4332, longitude: 35.8498, timezone: 2, flag: '🇱🇧' },

  // ═══════════════ 🇸🇾 سوريا ═══════════════
  { id: 'damascus',  cityAr: 'دمشق',         cityEn: 'Damascus',      countryAr: 'سوريا',   countryEn: 'Syria',        countryCode: 'SY', latitude: 33.5138, longitude: 36.2765, timezone: 3, flag: '🇸🇾' },
  { id: 'aleppo',    cityAr: 'حلب',          cityEn: 'Aleppo',        countryAr: 'سوريا',   countryEn: 'Syria',        countryCode: 'SY', latitude: 36.2021, longitude: 37.1343, timezone: 3, flag: '🇸🇾' },

  // ═══════════════ 🇮🇶 العراق ═══════════════
  { id: 'baghdad',   cityAr: 'بغداد',        cityEn: 'Baghdad',       countryAr: 'العراق',  countryEn: 'Iraq',         countryCode: 'IQ', latitude: 33.3152, longitude: 44.3661, timezone: 3, flag: '🇮🇶', popular: true },
  { id: 'basra',     cityAr: 'البصرة',       cityEn: 'Basra',         countryAr: 'العراق',  countryEn: 'Iraq',         countryCode: 'IQ', latitude: 30.5085, longitude: 47.7804, timezone: 3, flag: '🇮🇶' },
  { id: 'mosul',     cityAr: 'الموصل',       cityEn: 'Mosul',         countryAr: 'العراق',  countryEn: 'Iraq',         countryCode: 'IQ', latitude: 36.3500, longitude: 43.1500, timezone: 3, flag: '🇮🇶' },
  { id: 'najaf',     cityAr: 'النجف',        cityEn: 'Najaf',         countryAr: 'العراق',  countryEn: 'Iraq',         countryCode: 'IQ', latitude: 32.0000, longitude: 44.3333, timezone: 3, flag: '🇮🇶' },
  { id: 'karbala',   cityAr: 'كربلاء',       cityEn: 'Karbala',       countryAr: 'العراق',  countryEn: 'Iraq',         countryCode: 'IQ', latitude: 32.6160, longitude: 44.0249, timezone: 3, flag: '🇮🇶' },

  // ═══════════════ 🇵🇸 فلسطين ═══════════════
  { id: 'jerusalem', cityAr: 'القدس',        cityEn: 'Jerusalem',     countryAr: 'فلسطين',  countryEn: 'Palestine',    countryCode: 'PS', latitude: 31.7683, longitude: 35.2137, timezone: 2, flag: '🇵🇸', popular: true },
  { id: 'gaza',      cityAr: 'غزة',          cityEn: 'Gaza',          countryAr: 'فلسطين',  countryEn: 'Palestine',    countryCode: 'PS', latitude: 31.5017, longitude: 34.4668, timezone: 2, flag: '🇵🇸' },
  { id: 'ramallah',  cityAr: 'رام الله',     cityEn: 'Ramallah',      countryAr: 'فلسطين',  countryEn: 'Palestine',    countryCode: 'PS', latitude: 31.9038, longitude: 35.2034, timezone: 2, flag: '🇵🇸' },
  { id: 'hebron',    cityAr: 'الخليل',       cityEn: 'Hebron',        countryAr: 'فلسطين',  countryEn: 'Palestine',    countryCode: 'PS', latitude: 31.5326, longitude: 35.0998, timezone: 2, flag: '🇵🇸' },

  // ═══════════════ 🇾🇪 اليمن ═══════════════
  { id: 'sanaa',     cityAr: 'صنعاء',        cityEn: "Sana'a",        countryAr: 'اليمن',   countryEn: 'Yemen',        countryCode: 'YE', latitude: 15.3694, longitude: 44.1910, timezone: 3, flag: '🇾🇪' },
  { id: 'aden',      cityAr: 'عدن',          cityEn: 'Aden',          countryAr: 'اليمن',   countryEn: 'Yemen',        countryCode: 'YE', latitude: 12.7855, longitude: 45.0187, timezone: 3, flag: '🇾🇪' },

  // ═══════════════ 🇲🇦 المغرب ═══════════════
  { id: 'rabat',     cityAr: 'الرباط',       cityEn: 'Rabat',         countryAr: 'المغرب',  countryEn: 'Morocco',      countryCode: 'MA', latitude: 34.0209, longitude: -6.8416, timezone: 1, flag: '🇲🇦' },
  { id: 'casablanca',cityAr: 'الدار البيضاء',cityEn: 'Casablanca',    countryAr: 'المغرب',  countryEn: 'Morocco',      countryCode: 'MA', latitude: 33.5731, longitude: -7.5898, timezone: 1, flag: '🇲🇦', popular: true },
  { id: 'marrakech', cityAr: 'مراكش',        cityEn: 'Marrakech',     countryAr: 'المغرب',  countryEn: 'Morocco',      countryCode: 'MA', latitude: 31.6295, longitude: -7.9811, timezone: 1, flag: '🇲🇦' },
  { id: 'fes',       cityAr: 'فاس',          cityEn: 'Fes',           countryAr: 'المغرب',  countryEn: 'Morocco',      countryCode: 'MA', latitude: 34.0181, longitude: -5.0078, timezone: 1, flag: '🇲🇦' },
  { id: 'tangier',   cityAr: 'طنجة',         cityEn: 'Tangier',       countryAr: 'المغرب',  countryEn: 'Morocco',      countryCode: 'MA', latitude: 35.7595, longitude: -5.8340, timezone: 1, flag: '🇲🇦' },

  // ═══════════════ 🇩🇿 الجزائر ═══════════════
  { id: 'algiers',   cityAr: 'الجزائر',      cityEn: 'Algiers',       countryAr: 'الجزائر', countryEn: 'Algeria',      countryCode: 'DZ', latitude: 36.7538, longitude: 3.0588, timezone: 1, flag: '🇩🇿', popular: true },
  { id: 'oran',      cityAr: 'وهران',        cityEn: 'Oran',          countryAr: 'الجزائر', countryEn: 'Algeria',      countryCode: 'DZ', latitude: 35.6969, longitude: -0.6331, timezone: 1, flag: '🇩🇿' },
  { id: 'constantine',cityAr: 'قسنطينة',     cityEn: 'Constantine',   countryAr: 'الجزائر', countryEn: 'Algeria',      countryCode: 'DZ', latitude: 36.3650, longitude: 6.6147, timezone: 1, flag: '🇩🇿' },

  // ═══════════════ 🇹🇳 تونس ═══════════════
  { id: 'tunis',     cityAr: 'تونس',         cityEn: 'Tunis',         countryAr: 'تونس',    countryEn: 'Tunisia',      countryCode: 'TN', latitude: 36.8065, longitude: 10.1815, timezone: 1, flag: '🇹🇳' },
  { id: 'sfax',      cityAr: 'صفاقس',        cityEn: 'Sfax',          countryAr: 'تونس',    countryEn: 'Tunisia',      countryCode: 'TN', latitude: 34.7406, longitude: 10.7603, timezone: 1, flag: '🇹🇳' },

  // ═══════════════ 🇱🇾 ليبيا ═══════════════
  { id: 'tripoli-ly',cityAr: 'طرابلس',       cityEn: 'Tripoli',       countryAr: 'ليبيا',   countryEn: 'Libya',        countryCode: 'LY', latitude: 32.8872, longitude: 13.1913, timezone: 2, flag: '🇱🇾' },
  { id: 'benghazi',  cityAr: 'بنغازي',       cityEn: 'Benghazi',      countryAr: 'ليبيا',   countryEn: 'Libya',        countryCode: 'LY', latitude: 32.1167, longitude: 20.0667, timezone: 2, flag: '🇱🇾' },

  // ═══════════════ 🇸🇩 السودان ═══════════════
  { id: 'khartoum',  cityAr: 'الخرطوم',      cityEn: 'Khartoum',      countryAr: 'السودان', countryEn: 'Sudan',        countryCode: 'SD', latitude: 15.5007, longitude: 32.5599, timezone: 2, flag: '🇸🇩' },
  { id: 'omdurman',  cityAr: 'أم درمان',     cityEn: 'Omdurman',      countryAr: 'السودان', countryEn: 'Sudan',        countryCode: 'SD', latitude: 15.6500, longitude: 32.4833, timezone: 2, flag: '🇸🇩' },

  // ═══════════════ 🇲🇷 موريتانيا ═══════════════
  { id: 'nouakchott',cityAr: 'نواكشوط',      cityEn: 'Nouakchott',    countryAr: 'موريتانيا',countryEn: 'Mauritania',  countryCode: 'MR', latitude: 18.0735, longitude: -15.9582, timezone: 0, flag: '🇲🇷' },

  // ═══════════════ 🇸🇴 الصومال ═══════════════
  { id: 'mogadishu', cityAr: 'مقديشو',       cityEn: 'Mogadishu',     countryAr: 'الصومال', countryEn: 'Somalia',      countryCode: 'SO', latitude: 2.0469, longitude: 45.3182, timezone: 3, flag: '🇸🇴' },

  // ═══════════════ 🇹🇷 تركيا ═══════════════
  { id: 'istanbul',  cityAr: 'إسطنبول',      cityEn: 'Istanbul',      countryAr: 'تركيا',   countryEn: 'Turkey',       countryCode: 'TR', latitude: 41.0082, longitude: 28.9784, timezone: 3, flag: '🇹🇷', popular: true },
  { id: 'ankara',    cityAr: 'أنقرة',        cityEn: 'Ankara',        countryAr: 'تركيا',   countryEn: 'Turkey',       countryCode: 'TR', latitude: 39.9334, longitude: 32.8597, timezone: 3, flag: '🇹🇷' },
  { id: 'izmir',     cityAr: 'إزمير',        cityEn: 'Izmir',         countryAr: 'تركيا',   countryEn: 'Turkey',       countryCode: 'TR', latitude: 38.4192, longitude: 27.1287, timezone: 3, flag: '🇹🇷' },
  { id: 'bursa',     cityAr: 'بورصة',        cityEn: 'Bursa',         countryAr: 'تركيا',   countryEn: 'Turkey',       countryCode: 'TR', latitude: 40.1828, longitude: 29.0665, timezone: 3, flag: '🇹🇷' },

  // ═══════════════ 🇮🇷 إيران ═══════════════
  { id: 'tehran',    cityAr: 'طهران',        cityEn: 'Tehran',        countryAr: 'إيران',   countryEn: 'Iran',         countryCode: 'IR', latitude: 35.6892, longitude: 51.3890, timezone: 3.5, flag: '🇮🇷', popular: true },
  { id: 'mashhad',   cityAr: 'مشهد',         cityEn: 'Mashhad',       countryAr: 'إيران',   countryEn: 'Iran',         countryCode: 'IR', latitude: 36.2605, longitude: 59.6168, timezone: 3.5, flag: '🇮🇷' },
  { id: 'isfahan',   cityAr: 'أصفهان',       cityEn: 'Isfahan',       countryAr: 'إيران',   countryEn: 'Iran',         countryCode: 'IR', latitude: 32.6546, longitude: 51.6680, timezone: 3.5, flag: '🇮🇷' },
  { id: 'qom',       cityAr: 'قُم',          cityEn: 'Qom',           countryAr: 'إيران',   countryEn: 'Iran',         countryCode: 'IR', latitude: 34.6416, longitude: 50.8746, timezone: 3.5, flag: '🇮🇷' },

  // ═══════════════ 🇵🇰 باكستان ═══════════════
  { id: 'islamabad', cityAr: 'إسلام آباد',   cityEn: 'Islamabad',     countryAr: 'باكستان', countryEn: 'Pakistan',     countryCode: 'PK', latitude: 33.6844, longitude: 73.0479, timezone: 5, flag: '🇵🇰', popular: true },
  { id: 'karachi',   cityAr: 'كراتشي',       cityEn: 'Karachi',       countryAr: 'باكستان', countryEn: 'Pakistan',     countryCode: 'PK', latitude: 24.8607, longitude: 67.0011, timezone: 5, flag: '🇵🇰', popular: true },
  { id: 'lahore',    cityAr: 'لاهور',        cityEn: 'Lahore',        countryAr: 'باكستان', countryEn: 'Pakistan',     countryCode: 'PK', latitude: 31.5497, longitude: 74.3436, timezone: 5, flag: '🇵🇰' },

  // ═══════════════ 🇧🇩 بنغلاديش ═══════════════
  { id: 'dhaka',     cityAr: 'دكا',          cityEn: 'Dhaka',         countryAr: 'بنغلاديش',countryEn: 'Bangladesh',   countryCode: 'BD', latitude: 23.8103, longitude: 90.4125, timezone: 6, flag: '🇧🇩' },
  { id: 'chittagong',cityAr: 'شيتاغونغ',     cityEn: 'Chittagong',    countryAr: 'بنغلاديش',countryEn: 'Bangladesh',   countryCode: 'BD', latitude: 22.3569, longitude: 91.7832, timezone: 6, flag: '🇧🇩' },

  // ═══════════════ 🇮🇩 إندونيسيا ═══════════════
  { id: 'jakarta',   cityAr: 'جاكرتا',       cityEn: 'Jakarta',       countryAr: 'إندونيسيا',countryEn: 'Indonesia',   countryCode: 'ID', latitude: -6.2088, longitude: 106.8456, timezone: 7, flag: '🇮🇩', popular: true },
  { id: 'surabaya',  cityAr: 'سورابايا',     cityEn: 'Surabaya',      countryAr: 'إندونيسيا',countryEn: 'Indonesia',   countryCode: 'ID', latitude: -7.2575, longitude: 112.7521, timezone: 7, flag: '🇮🇩' },
  { id: 'bandung',   cityAr: 'باندونغ',      cityEn: 'Bandung',       countryAr: 'إندونيسيا',countryEn: 'Indonesia',   countryCode: 'ID', latitude: -6.9175, longitude: 107.6191, timezone: 7, flag: '🇮🇩' },

  // ═══════════════ 🇲🇾 ماليزيا ═══════════════
  { id: 'kualalumpur',cityAr: 'كوالالمبور',  cityEn: 'Kuala Lumpur',  countryAr: 'ماليزيا', countryEn: 'Malaysia',     countryCode: 'MY', latitude: 3.1390, longitude: 101.6869, timezone: 8, flag: '🇲🇾' },
  { id: 'johor',     cityAr: 'جوهور',        cityEn: 'Johor Bahru',   countryAr: 'ماليزيا', countryEn: 'Malaysia',     countryCode: 'MY', latitude: 1.4927, longitude: 103.7414, timezone: 8, flag: '🇲🇾' },

  // ═══════════════ 🇳🇬 نيجيريا ═══════════════
  { id: 'lagos',     cityAr: 'لاغوس',        cityEn: 'Lagos',         countryAr: 'نيجيريا', countryEn: 'Nigeria',      countryCode: 'NG', latitude: 6.5244, longitude: 3.3792, timezone: 1, flag: '🇳🇬' },
  { id: 'abuja',     cityAr: 'أبوجا',        cityEn: 'Abuja',         countryAr: 'نيجيريا', countryEn: 'Nigeria',      countryCode: 'NG', latitude: 9.0765, longitude: 7.3986, timezone: 1, flag: '🇳🇬' },
  { id: 'kano',      cityAr: 'كانو',         cityEn: 'Kano',          countryAr: 'نيجيريا', countryEn: 'Nigeria',      countryCode: 'NG', latitude: 12.0022, longitude: 8.5920, timezone: 1, flag: '🇳🇬' },

  // ═══════════════ 🌍 الجاليات الإسلامية في الغرب ═══════════════
  { id: 'london',    cityAr: 'لندن',         cityEn: 'London',        countryAr: 'بريطانيا',countryEn: 'United Kingdom',countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, timezone: 0, flag: '🇬🇧', popular: true },
  { id: 'paris',     cityAr: 'باريس',        cityEn: 'Paris',         countryAr: 'فرنسا',   countryEn: 'France',       countryCode: 'FR', latitude: 48.8566, longitude: 2.3522,  timezone: 1, flag: '🇫🇷' },
  { id: 'berlin',    cityAr: 'برلين',        cityEn: 'Berlin',        countryAr: 'ألمانيا', countryEn: 'Germany',      countryCode: 'DE', latitude: 52.5200, longitude: 13.4050, timezone: 1, flag: '🇩🇪' },
  { id: 'newyork',   cityAr: 'نيويورك',      cityEn: 'New York',      countryAr: 'أمريكا',  countryEn: 'USA',          countryCode: 'US', latitude: 40.7128, longitude: -74.0060,timezone: -5, flag: '🇺🇸' },
  { id: 'toronto',   cityAr: 'تورنتو',       cityEn: 'Toronto',       countryAr: 'كندا',    countryEn: 'Canada',       countryCode: 'CA', latitude: 43.6532, longitude: -79.3832,timezone: -5, flag: '🇨🇦' },
  { id: 'sydney',    cityAr: 'سيدني',        cityEn: 'Sydney',        countryAr: 'أستراليا',countryEn: 'Australia',    countryCode: 'AU', latitude: -33.8688,longitude: 151.2093,timezone: 10, flag: '🇦🇺' },
];

/** قائمة الدول الموجودة (مجمّعة من المدن) لاختصار picker الدول. */
export const COUNTRIES = Array.from(
  new Map(
    CITIES.map((c) => [c.countryCode, { code: c.countryCode, nameAr: c.countryAr, nameEn: c.countryEn, flag: c.flag }])
  ).values()
);

/** يبحث عن مدينة بالـ id. */
export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

/** يبحث عن أقرب مدينة معروفة لإحداثيات geo (للـ auto-detect). */
export function findNearestCity(lat: number, lng: number): City {
  let best = CITIES[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of CITIES) {
    const d = (c.latitude - lat) ** 2 + (c.longitude - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}
