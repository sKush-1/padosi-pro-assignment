import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:4000/api/v1`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';
};

const BASE_URL = getBaseUrl();

// ─── Token storage ────────────────────────────────────────────────────────────
export const TokenStorage = {
  async getAccess(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch {
      return null;
    }
  },
  async getRefresh(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  },
  async set(access: string, refresh: string): Promise<void> {
    try {
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
    } catch {
      // ignore
    }
  },
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch {
      // ignore
    }
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
interface ApiResponse<T = unknown> {
  error: boolean;
  message: string;
  data: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = await TokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Something went wrong');
  }

  return json;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  business_name: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export const authApi = {
  register: (email: string, password: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<AuthTokens>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendOtp: (email: string) =>
    request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (email: string, password: string) =>
    request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }, true),

  me: () =>
    request<AuthUser>('/auth/me', { method: 'GET' }, true),
};

// ─── User API ─────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  name: string;
  phone: string;
  address: string;
  business_name?: string;
}

export const userApi = {
  getProfile: () =>
    request<AuthUser>('/user/profile', { method: 'GET' }, true),

  updateProfile: (payload: ProfilePayload) =>
    request<AuthUser>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, true),
};

// ─── Tasks API ────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  name: string;
  category: string;
  short_description: string;
}

export const tasksApi = {
  list: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<{ tasks: Task[]; count: number }>(`/tasks${qs}`, { method: 'GET' });
  },

  categories: () =>
    request<{ categories: string[] }>('/tasks/categories', { method: 'GET' }),

  selectTasks: (task_ids: string[]) =>
    request<{ selected_count: number }>('/tasks/select', {
      method: 'POST',
      body: JSON.stringify({ task_ids }),
    }, true),

  myTasks: () =>
    request<{ tasks: Task[]; count: number }>('/tasks/my-tasks', { method: 'GET' }, true),
};
