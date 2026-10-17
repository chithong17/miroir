import { create } from 'axios';
import { Platform } from 'react-native';
import { ApiError, UploadAsset } from './contracts';
import { notifyUnauthorized } from './authEvents';

export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api')).replace(/\/$/, '');
export const socketBaseUrl = process.env.EXPO_PUBLIC_SOCKET_URL || apiBaseUrl.replace(/\/api$/, '');
export const http = create({ baseURL: apiBaseUrl, timeout: 90000 });

http.interceptors.response.use(response => response, error => {
  const body = error.response?.data;
  return Promise.reject(new ApiError(body?.message || body?.error || error.message || 'Connection failed. Please try again.', error.response?.status, body?.code));
});

export async function request<T>(method: string, path: string, token?: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
  try {
    const result = await http.request<T>({ method, url: path, data, params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return result.data;
  } catch (error) {
    if (token && error instanceof ApiError && error.unauthorized) notifyUnauthorized(token);
    throw error;
  }
}

export async function appendAsset(form: FormData, field: string, asset: UploadAsset) {
  if (Platform.OS === 'web') {
    const blob = asset.file || await (await fetch(asset.uri)).blob();
    form.append(field, blob, asset.name);
  } else {
    form.append(field, { uri: asset.uri, name: asset.name, type: asset.mimeType } as unknown as Blob);
  }
}
