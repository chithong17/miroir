import { request, appendAsset } from './client';
import { AuthResult, CustomerUser, UploadAsset } from './contracts';

export const customerApi = {
  login: (email: string, password: string) => request<AuthResult>('POST', '/user-auth/login', undefined, { email: email.trim(), password }),
  register: (name: string, email: string, password: string) => request<AuthResult>('POST', '/user-auth/register', undefined, { name: name.trim(), email: email.trim(), password }),
  me: async (token: string) => (await request<{user: CustomerUser}>('GET', '/user-auth/me', token)).user,
  profile: async (token: string, payload: Record<string, unknown>) => (await request<{user: CustomerUser}>('PUT', '/users/me/profile', token, payload)).user,
  skipProfile: async (token: string) => (await request<{user: CustomerUser}>('PATCH', '/users/me/profile/skip', token)).user,
  uploadPhoto: async (token: string, asset: UploadAsset) => {
    const form = new FormData();
    await appendAsset(form, 'image', asset);
    return (await request<{user: CustomerUser}>('POST', '/users/me/profile-photo', token, form)).user;
  },
  toggleFavorite: (token: string, id: string) => request<{favoriteProductIds: string[]}>('POST', `/users/me/favorites/${encodeURIComponent(id)}/toggle`, token),
  requestReset: (email: string, accountType: 'user' | 'shop_owner') => request('POST', '/auth/password-reset/request', undefined, {email: email.trim(), accountType}),
  verifyReset: (email: string, otp: string, accountType: 'user' | 'shop_owner') => request('POST', '/auth/password-reset/verify', undefined, {email: email.trim(), otp: otp.trim(), accountType}),
  confirmReset: (email: string, otp: string, password: string, accountType: 'user' | 'shop_owner') => request('POST', '/auth/password-reset/confirm', undefined, {email: email.trim(), otp: otp.trim(), newPassword: password, accountType}),
  deleteAccount: (token: string) => request<{ success: boolean; message?: string }>('DELETE', '/users/me/account', token),
};
