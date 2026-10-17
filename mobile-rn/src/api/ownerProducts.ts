import { request } from './client';
import { CatalogProduct, CatalogVariant } from './catalog';
export interface OwnerVariant extends CatalogVariant {costPrice?: number | null; fitMeasurements?: Record<string, number>}
export interface OwnerProduct extends Omit<CatalogProduct, 'variants'> {status: string; availability: string; imagePublicId: string; variants: OwnerVariant[]}
export const ownerProductsApi = {
  list: async (token: string, status = '') => (await request<{products: OwnerProduct[]}>('GET', '/shop-products', token, undefined, status ? {status} : undefined)).products,
  detail: async (token: string, id: string) => (await request<{product: OwnerProduct}>('GET', `/shop-products/${encodeURIComponent(id)}`, token)).product,
  save: (token: string, id: string | undefined, data: Record<string, unknown>) => request<{product: OwnerProduct}>(id ? 'PUT' : 'POST', id ? `/shop-products/${encodeURIComponent(id)}` : '/shop-products', token, data),
  action: (token: string, id: string, action: 'archive' | 'restore' | 'trash') => request(action === 'trash' ? 'DELETE' : 'PATCH', `/shop-products/${encodeURIComponent(id)}${action === 'trash' ? '' : `/${action}`}`, token),
};
