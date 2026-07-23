import { create } from 'zustand';

import { authApi, LoginPayload, RegisterPayload } from '@/api/auth.api';
import { presenceApi } from '@/api/presence.api';
import {
  clearStoredSession,
  ensureValidAccessToken,
  persistAuthResponse,
} from '@/lib/authSession';
import { resetNotificationSession } from '@/store/notificationStore';
import { resetPresenceStore } from '@/store/presenceStore';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { realtimeService } from '@/services/realtime';
import { AuthResponse, AuthUser, UserRole } from '@/types';
import { getDeviceId, getDeviceName } from '@/utils/device';
import { storage, STORAGE_KEYS } from '@/utils/storage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

const ALL_ROLES: UserRole[] = ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];

  bootstrap: () => Promise<void>;
  login: (emailOrDisplayName: string, password: string) => Promise<AuthUser>;
  register: (input: Omit<RegisterPayload, 'deviceId' | 'deviceName'>) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setActiveRole: (role: UserRole) => Promise<void>;
  enableAllRolesPreview: () => void;
  handleSessionExpired: () => void;
}

async function persistSession(res: AuthResponse, user: AuthUser) {
  await persistAuthResponse(res);
  await storage.setJSON(STORAGE_KEYS.user, user);
  await storage.set(STORAGE_KEYS.activeRole, user.role);
}

function responseRoles(res: { role: UserRole; roles?: UserRole[] }) {
  return res.roles?.length ? res.roles : [res.role];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  activeRole: null,
  availableRoles: [],

  bootstrap: async () => {
    const BOOTSTRAP_TIMEOUT_MS = 8_000;

    const run = async () => {
      const refreshToken = await storage.get(STORAGE_KEYS.refreshToken);
      const user = await storage.getJSON<AuthUser>(STORAGE_KEYS.user);
      const storedRole = (await storage.get(STORAGE_KEYS.activeRole)) as UserRole | null;

      if (!refreshToken || !user) {
        set({ status: 'unauthenticated', user: null, activeRole: null, availableRoles: [] });
        return;
      }

      const accessToken = await ensureValidAccessToken(false);
      if (!accessToken) {
        throw new Error('Session refresh failed');
      }

      const me = await authApi.me();
      const refreshedUser: AuthUser = {
        userId: me.userId,
        email: me.email,
        role: me.role as UserRole,
        roles: responseRoles({ role: me.role as UserRole, roles: me.roles }),
      };
      await storage.setJSON(STORAGE_KEYS.user, refreshedUser);
      const nextActiveRole = storedRole && refreshedUser.roles.includes(storedRole) ? storedRole : refreshedUser.role;
      set({
        status: 'authenticated',
        user: refreshedUser,
        availableRoles: refreshedUser.roles,
        activeRole: nextActiveRole,
      });
    };

    try {
      await Promise.race([
        run(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth bootstrap timeout')), BOOTSTRAP_TIMEOUT_MS),
        ),
      ]);
    } catch {
      await clearStoredSession();
      set({ status: 'unauthenticated', user: null, activeRole: null, availableRoles: [] });
    }
  },

  login: async (emailOrDisplayName, password) => {
    await clearStoredSession();

    const deviceId = await getDeviceId();
    const loginId = emailOrDisplayName.trim();
    const payload: LoginPayload = {
      login: loginId.includes('@') ? loginId.toLowerCase() : loginId,
      password,
      deviceId,
      deviceName: getDeviceName(),
    };
    const res = await authApi.login(payload);
    const user: AuthUser = {
      userId: res.userId,
      email: res.email ?? emailOrDisplayName.trim(),
      role: res.role,
      roles: responseRoles(res),
    };
    await persistSession(res, user);
    await useRegistrationRoleStore.getState().clear();
    set({
      status: 'authenticated',
      user,
      activeRole: res.role,
      availableRoles: user.roles,
    });
    realtimeService.resume();
    void realtimeService.reconnect();
    return user;
  },

  register: async (input) => {
    const deviceId = await getDeviceId();
    const res = await authApi.register({ ...input, deviceId, deviceName: getDeviceName() });
    const user: AuthUser = {
      userId: res.userId,
      email: input.email,
      role: res.role,
      roles: responseRoles(res),
    };
    await persistSession(res, user);
    await useRegistrationRoleStore.getState().clear();
    set({
      status: 'authenticated',
      user,
      activeRole: res.role,
      availableRoles: user.roles,
    });
    realtimeService.resume();
    void realtimeService.reconnect();
    return user;
  },

  logout: async () => {
    try {
      await presenceApi.offline();
    } catch {
      // ignore network errors on offline
    }
    await realtimeService.shutdown();
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    await clearStoredSession();
    await useRegistrationRoleStore.getState().clear();
    resetNotificationSession();
    resetPresenceStore();
    set({ status: 'unauthenticated', user: null, activeRole: null, availableRoles: [] });
  },

  setActiveRole: async (role) => {
    if (!get().availableRoles.includes(role)) return;
    const current = get().user;
    if (current?.roles.includes(role)) {
      const deviceId = await getDeviceId();
      const res = await authApi.switchRole(role, deviceId, getDeviceName());
      const user: AuthUser = {
        userId: res.userId,
        email: res.email ?? current.email,
        role: res.role,
        roles: responseRoles(res),
      };
      await persistSession(res, user);
      set({ user, activeRole: res.role, availableRoles: user.roles });
      realtimeService.resume();
      void realtimeService.reconnect();
      return;
    }
    await storage.set(STORAGE_KEYS.activeRole, role);
    set({ activeRole: role });
  },

  enableAllRolesPreview: () => {
    const { user } = get();
    if (!user) return;
    set({ availableRoles: ALL_ROLES });
  },

  handleSessionExpired: () => {
    void realtimeService.shutdown();
    resetNotificationSession();
    resetPresenceStore();
    set({ status: 'unauthenticated', user: null, activeRole: null, availableRoles: [] });
  },
}));
