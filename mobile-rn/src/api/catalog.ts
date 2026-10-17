import { request } from './client';
export interface CatalogShop {id: string; name: string; slug?: string; description: string; logoUrl: string; coverUrl: string; contact?: {address: string; email: string; phone: string}}
export interface CatalogVariant {id: string; sku: string; size: string; color: string; stockQuantity: number; active: boolean}
export interface CatalogProduct {id: string; name: string; description: string; category: string; gender: string; price: number; imageUrl: string; colors: string[]; sizes: string[]; variants: CatalogVariant[]; material: string; fitType: string; styleTags: string[]; occasionTags: string[]; shop?: CatalogShop; premiumShopDetailsRequired?: boolean}
export interface CatalogOutfit {id: string; title: string; description: string; imageUrl: string; products: CatalogProduct[]}
export interface Pagination {page: number; totalPages: number; total: number; limit: number}
export const catalogApi = {
  shop: async (id: string, token?: string) => (await request<{shop: CatalogShop}>('GET', `/catalog/shops/${encodeURIComponent(id)}`, token)).shop,
  products: (params: Record<string, unknown>, token?: string) => {
    const cleanParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) cleanParams[k] = v;
    }
    return request<{products: CatalogProduct[]; pagination: Pagination}>('GET', '/catalog/products', token, undefined, cleanParams);
  },
  outfits: (params: Record<string, unknown>, token?: string) => {
    const cleanParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) cleanParams[k] = v;
    }
    return request<{outfits: CatalogOutfit[]; pagination: Pagination}>('GET', '/catalog/outfits', token, undefined, cleanParams);
  },
  product: async (id: string, token?: string) => (await request<{product: CatalogProduct}>('GET', `/catalog/products/${encodeURIComponent(id)}`, token)).product,
  favorites: async (token: string) => (await request<{products: CatalogProduct[]}>('GET', '/users/me/favorites', token)).products,
  feedback: (id: string, token: string, rating: number, fitFeedback: string, comment: string) => request('POST', `/catalog/products/${encodeURIComponent(id)}/feedback`, token, {rating, fitFeedback, comment, context: 'product'}),
};
