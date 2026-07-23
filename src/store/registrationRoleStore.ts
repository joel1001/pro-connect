import { create } from 'zustand';

import { RegistrationRole } from '@/theme/roleColors';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface RegistrationRoleState {
  role: RegistrationRole | null;
  ready: boolean;
  bootstrap: () => Promise<void>;
  setRole: (role: RegistrationRole) => Promise<void>;
  clear: () => Promise<void>;
}

export const useRegistrationRoleStore = create<RegistrationRoleState>((set) => ({
  role: null,
  ready: false,

  bootstrap: async () => {
    try {
      const stored = (await storage.get(STORAGE_KEYS.registrationRole)) as RegistrationRole | null;
      set({ role: stored === 'CLIENT' || stored === 'PROFESSIONAL' ? stored : null, ready: true });
    } catch {
      set({ role: null, ready: true });
    }
  },

  setRole: async (role) => {
    await storage.set(STORAGE_KEYS.registrationRole, role);
    set({ role });
  },

  clear: async () => {
    await storage.remove(STORAGE_KEYS.registrationRole);
    set({ role: null });
  },
}));
