import { create } from 'zustand';

import i18n, {
  AppLanguage,
  getDeviceLanguage,
  initI18n,
  isSupportedLanguage,
} from '@/i18n';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface LanguageState {
  language: AppLanguage;
  ready: boolean;
  /** Loads the saved language (or device locale) and initializes i18next. */
  bootstrap: () => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getDeviceLanguage(),
  ready: false,

  bootstrap: async () => {
    let lang: AppLanguage = getDeviceLanguage();
    try {
      const saved = await storage.get(STORAGE_KEYS.language);
      lang = isSupportedLanguage(saved) ? saved : getDeviceLanguage();
      initI18n(lang);
      if (i18n.language !== lang) await i18n.changeLanguage(lang);
    } catch {
      initI18n(lang);
    } finally {
      set({ language: lang, ready: true });
    }
  },

  setLanguage: async (lang) => {
    await storage.set(STORAGE_KEYS.language, lang);
    await i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
