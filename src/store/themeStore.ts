import { create } from 'zustand';

import { AppThemePaletteKey, isAppThemePaletteKey } from '@/theme/palettes';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface ThemeState {
  palette: AppThemePaletteKey;
  ready: boolean;
  bootstrap: () => Promise<void>;
  setPalette: (palette: AppThemePaletteKey) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  palette: 'role',
  ready: false,

  bootstrap: async () => {
    const saved = await storage.get(STORAGE_KEYS.themePalette);
    set({
      palette: isAppThemePaletteKey(saved) ? saved : 'role',
      ready: true,
    });
  },

  setPalette: async (palette) => {
    await storage.set(STORAGE_KEYS.themePalette, palette);
    set({ palette });
  },
}));
