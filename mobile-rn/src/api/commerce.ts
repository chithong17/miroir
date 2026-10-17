import { appendAsset, request } from './client';
import { UploadAsset } from './contracts';
import { CatalogVariant } from './catalog';
export interface Address {id: string; label: string; recipientName: string; phone: string; fullAddress: string; isDefault: boolean}
export interface CartItem {productId: string; variantId: string; quantity: number; product: {name: string; imageUrl: string; price: number}; variant: CatalogVariant; available: boolean; lineTotal: number}
export interface Cart {id: string; addressId?: string; groups: {shop: {id: string; name: string; bankTransferAvailable: boolean}; items: CartItem[]; subtotal: number}[]; itemCount: number; subtotal: number}
export interface Order {id: string; orderCode: string; shopSnapshot: {name: string}; total: number; orderStatus: string; paymentStatus: string; paymentMethod: string; createdAt: string; items: {productId: string; variantId: string; name: string; imageUrl: string; quantity: number; size: string; color: string; unitPrice: number; lineTotal: number}[]}
export interface Location {code: string; name: string}
export interface OrderDetail extends Order {recipient?:{name:string;phone:string;fullAddress:string;note?:string};paymentSnapshot?:{bankName:string;accountHolder:string;accountNumber:string;qrImageUrl?:string};paymentProof?:{imageUrl:string};paymentRejectionReason?:string;paymentDueAt?:string;expiresAt?:string;statusHistory?:{status:string;note:string;createdAt:string}[]}
const id = encodeURIComponent;
export const commerceApi = {
  cart: async (token: string) => (await request<{cart: Cart}>('GET', '/users/me/cart', token)).cart,
  add: (token: string, productId: string, variantId: string, quantity: number) => request<{cart: Cart}>('POST', '/users/me/cart/items', token, {productId, variantId, quantity}),
  update: (token: string, item: CartItem, quantity: number) => request('PUT', `/users/me/cart/items/${id(item.productId)}/${id(item.variantId)}`, token, {quantity}),
  remove: (token: string, item: CartItem) => request('DELETE', `/users/me/cart/items/${id(item.productId)}/${id(item.variantId)}`, token),
  addresses: async (token: string) => (await request<{addresses: Address[]}>('GET', '/users/me/addresses', token)).addresses,
  createAddress: (token: string, payload: Record<string, unknown>) => request('POST', '/users/me/addresses', token, payload),
  defaultAddress: (token: string, addressId: string) => request('PATCH', `/users/me/addresses/${id(addressId)}/default`, token),
  deleteAddress: (token: string, addressId: string) => request('DELETE', `/users/me/addresses/${id(addressId)}`, token),
  provinces: async () => (await request<{provinces: Location[]}>('GET', '/locations/provinces')).provinces,
  districts: async (province: string) => (await request<{districts: Location[]}>('GET', `/locations/provinces/${id(province)}/districts`)).districts,
  wards: async (district: string) => (await request<{wards: Location[]}>('GET', `/locations/districts/${id(district)}/wards`)).wards,
  checkout: (token: string, payload: {addressId: string; paymentMethods: Record<string, string>; idempotencyKey: string}) => request<{orders: Order[]}>('POST', '/orders/checkout', token, payload),
  orders: async (token: string) => (await request<{orders: Order[]}>('GET', '/orders/me', token)).orders,
  detail: async (token:string, orderId:string) => (await request<{order:OrderDetail}>('GET',`/orders/me/${id(orderId)}`,token)).order,
  reportTransfer: async (token:string,orderId:string,image?:UploadAsset) => {const form = new FormData(); if (image) await appendAsset(form,'image',image); return request('POST',`/orders/me/${id(orderId)}/transfer-reported`,token,form);},
  cancel: (token: string, orderId: string, reason: string) => request('POST', `/orders/me/${id(orderId)}/cancel`, token, {reason}),
};
