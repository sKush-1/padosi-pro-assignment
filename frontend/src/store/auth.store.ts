import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthUser, TokenStorage } from '@/services/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;

  // actions
  hydrate: () => Promise<void>;
  setAuth: (tokens: { access_token: string; refresh_token: string }, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await TokenStorage.getAccess();
      if (token) {
        const res = await authApi.me();
        set({ user: res.data, accessToken: token, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      await TokenStorage.clear();
      set({ user: null, accessToken: null, isHydrated: true });
    }
  },

  setAuth: async ({ access_token, refresh_token }, user) => {
    await TokenStorage.set(access_token, refresh_token);
    set({ user, accessToken: access_token });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await TokenStorage.clear();
    set({ user: null, accessToken: null });
  },

  setUser: (user) => set({ user }),
}));
