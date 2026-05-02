import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import tr from './locales/tr.json';
import en from './locales/en.json';

import type { Locale } from '@/types/models';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const;

export type TranslationKeys = typeof tr;

const SUPPORTED: Locale[] = ['tr', 'en'];

export function detectDeviceLocale(): Locale {
  const deviceLocale = getLocales()[0]?.languageCode ?? 'tr';
  return (SUPPORTED as string[]).includes(deviceLocale) ? (deviceLocale as Locale) : 'tr';
}

export async function initI18n(initialLocale?: Locale) {
  const locale = initialLocale ?? detectDeviceLocale();

  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'tr',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
}

export async function changeLanguage(locale: Locale) {
  await i18n.changeLanguage(locale);
}

export default i18n;
