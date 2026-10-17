import { appendAsset, request } from './client';
import { Subscription, UploadAsset } from './contracts';
export interface Owner {id: string; name: string; email: string; status: string; subscription?: Subscription}
export interface OwnerAuth {success: boolean; token: string; owner: Owner; message?: string}
export interface OwnerShop {id: string; name: string; slug: string; description: string; logoUrl: string; coverUrl: string; contact?: {address?: string; email?: string; phone?: string}}
export const ownerApi = {
  login: (email: string, password: string) => request<OwnerAuth>('POST', '/shop-auth/login', undefined, {email: email.trim(), password}),
  register: (name: string, email: string, password: string) => request<OwnerAuth>('POST', '/shop-auth/register', undefined, {name: name.trim(), email: email.trim(), password}),
  shops: async (token: string) => (await request<{shops: OwnerShop[]}>('GET', '/shops/me', token)).shops,
  saveShop: (token: string, shopId: string | undefined, payload: Omit<OwnerShop, 'id'>) => request<{shop: OwnerShop}>(shopId ? 'PUT' : 'POST', shopId ? `/shops/${encodeURIComponent(shopId)}` : '/shops', token, payload),
  subscription: (token: string) => request<{subscription: Subscription}>('GET', '/payments/me', token),
  upload: async (token: string, asset: UploadAsset) => {
    const form = new FormData(); await appendAsset(form, 'image', asset);
    return request<{imageUrl: string; imagePublicId: string}>('POST', '/shop-products/upload-image', token, form);
  },
};
