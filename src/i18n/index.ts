import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { pt } from './locales/pt';

export type AppLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de';

export interface LanguageMeta {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
} as const;

export function isSupportedLanguage(code: string | undefined | null): code is AppLanguage {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

/** Best language from the device/browser locale list, falling back to English. */
export function getDeviceLanguage(): AppLanguage {
  for (const locale of getLocales()) {
    const code = locale.languageCode;
    if (isSupportedLanguage(code)) return code;
    const tagPrefix = locale.languageTag?.split('-')[0];
    if (isSupportedLanguage(tagPrefix)) return tagPrefix;
  }
  return DEFAULT_LANGUAGE;
}

export function initI18n(initialLanguage: AppLanguage) {
  if (i18n.isInitialized) {
    Object.entries(resources).forEach(([lng, { translation }]) => {
      i18n.addResourceBundle(lng, 'translation', translation, true, true);
    });
    if (i18n.language !== initialLanguage) {
      void i18n.changeLanguage(initialLanguage);
    }
    return i18n;
  }
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
  return i18n;
}

export default i18n;
