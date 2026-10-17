import { appendAsset, request } from './client';
import { Order } from './commerce';
import { ReturnRequest, ReturnAttachment } from './returns';
import { UploadAsset } from './contracts';
export interface OwnerOrder extends Order {recipient?: {name: string; phone: string; fullAddress: string}; paymentProof?: ReturnAttachment; refund?: {proof?: ReturnAttachment;note?: string}}
export const nextOrderStatuses: Record<string, string[]> = {pending_confirmation: ['confirmed','cancelled'], confirmed: ['preparing','cancelled'], preparing: ['shipping','cancelled'], shipping: ['delivered','cancelled']};
export const ownerCommerceApi = {
  orders: async (token: string) => (await request<{orders: OwnerOrder[]}>('GET', '/shop-orders', token)).orders,
  status: (token: string, id: string, status: string, reason: string) => request('PATCH', `/shop-orders/${encodeURIComponent(id)}/status`, token, {status,reason: reason.trim()}),
  cancellation: (token: string, id: string, approved: boolean, reason: string) => request('PATCH', `/shop-orders/${encodeURIComponent(id)}/cancellation`, token, {approved,reason: reason.trim()}),
  payment: async (token: string, id: string, action: string, reason: string, image?: UploadAsset) => {
    const form = new FormData(); form.append('action',action); form.append('reason',reason.trim()); if (image) await appendAsset(form,'image',image);
    return request('PATCH', `/shop-orders/${encodeURIComponent(id)}/payment`,token,form);
  },
  returns: async (token: string) => {
    const result = await request<{returns: (Omit<ReturnRequest,'attachments'> & {attachments: (string | ReturnAttachment)[]; refundAccount?: {bankName: string; accountNumber: string; accountHolder: string}})[]}>('GET', '/shop-orders/returns',token);
    return result.returns.map(r => ({...r,attachments: (r.attachments || []).map(a => typeof a === 'string' ? a : a.imageUrl)}));
  },
  decide: (token: string,id: string,approved: boolean,text: string) => request('PATCH', `/shop-orders/returns/${encodeURIComponent(id)}/decision`, token, {approved,reason: approved ? '' : text.trim(),instructions: approved ? text.trim() : ''}),
  receive: (token: string,id: string) => request('PATCH', `/shop-orders/returns/${encodeURIComponent(id)}/received`,token),
  refund: async (token: string,id: string,note: string,image: UploadAsset) => {
    const form = new FormData(); form.append('note',note.trim()); await appendAsset(form,'images',image);
    return request('PATCH', `/shop-orders/returns/${encodeURIComponent(id)}/refund`,token,form);
  },
};
