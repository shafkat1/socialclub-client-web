import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config } from './config';

const ACCESS_TOKEN_KEY = 'access_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };
  const res = await fetch(`${config.apiBaseUrl}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (Array.isArray((data as any)?.message) && (data as any).message[0]) || (data as any).message || (data as any).error || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  signin(email: string, password: string) {
    return request<{ accessToken: string; refreshToken: string; user: any }>(`/auth/signin`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<any>(`/auth/me`);
  },
  config() {
    return request<any>(`/config`);
  },
  registerDevice(deviceToken: string, appVersion?: string) {
    return request<{ success: true }>(`/devices/register`, {
      method: 'POST',
      body: JSON.stringify({ deviceToken, platform: Platform.OS as 'ios' | 'android' | 'web', appVersion }),
    });
  },
};


