/**
 * نظام i18n مُخصّص - 10 لغات.
 * RTL: ar / ur / fa
 * LTR: en / tr / fr / id / ms / ha / sw
 */

import { ar, TranslationKey } from './translations/ar';
import { en } from './translations/en';
import { ur } from './translations/ur';
import { tr } from './translations/tr';
import { fr } from './translations/fr';
import { id } from './translations/id';
import { ms } from './translations/ms';
import { fa } from './translations/fa';
import { ha } from './translations/ha';
import { sw } from './translations/sw';

export type LanguageCode = 'ar' | 'en' | 'ur' | 'fa' | 'tr' | 'fr' | 'id' | 'ms' | 'ha' | 'sw';

export const LANGUAGE_CODES: LanguageCode[] = ['ar','en','ur','fa','tr','fr','id','ms','ha','sw'];

export interface LanguageMeta {
  code: LanguageCode;
  nameNative: string;
  nameEn: string;
  rtl: boolean;
  flag: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'ar', nameNative: 'العربية',    nameEn: 'Arabic',     rtl: true,  flag: '🇸🇦' },
  { code: 'en', nameNative: 'English',    nameEn: 'English',    rtl: false, flag: '🇬🇧' },
  { code: 'ur', nameNative: 'اردو',       nameEn: 'Urdu',       rtl: true,  flag: '🇵🇰' },
  { code: 'fa', nameNative: 'فارسی',      nameEn: 'Persian',    rtl: true,  flag: '🇮🇷' },
  { code: 'tr', nameNative: 'Türkçe',     nameEn: 'Turkish',    rtl: false, flag: '🇹🇷' },
  { code: 'fr', nameNative: 'Français',   nameEn: 'French',     rtl: false, flag: '🇫🇷' },
  { code: 'id', nameNative: 'Indonesia',  nameEn: 'Indonesian', rtl: false, flag: '🇮🇩' },
  { code: 'ms', nameNative: 'Melayu',     nameEn: 'Malay',      rtl: false, flag: '🇲🇾' },
  { code: 'ha', nameNative: 'Hausa',      nameEn: 'Hausa',      rtl: false, flag: '🇳🇬' },
  { code: 'sw', nameNative: 'Kiswahili',  nameEn: 'Swahili',    rtl: false, flag: '🇰🇪' },
];

const DICTIONARIES: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  ar, en, ur, fa, tr, fr, id, ms, ha, sw,
};

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isRtlLanguage(code: LanguageCode): boolean {
  return getLanguageMeta(code).rtl;
}

export function translate(key: TranslationKey, lang: LanguageCode): string {
  const dict = DICTIONARIES[lang];
  return dict[key] ?? ar[key] ?? key;
}

export type { TranslationKey };
