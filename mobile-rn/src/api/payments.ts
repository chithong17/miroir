import { request } from './client';
export interface PaymentPlan {code: string; name: string; accountType: string; amount?: number; price?: number; currency: string; durationDays: number; features: string[]}
export interface PaymentOrder {orderCode: string | number; status: string; checkoutUrl?: string}
interface CreateResponse {success: boolean; checkoutUrl?: string; order: PaymentOrder}
export function paymentPaid(order: PaymentOrder) {return order.status?.toLowerCase() === 'paid';}
export function paymentTerminal(order: PaymentOrder) {return ['paid','cancelled','canceled','expired','failed'].includes(order.status?.toLowerCase());}
export function validCheckoutUrl(url?: string) {
  if (!url) return false;
  try {return new URL(url).protocol === 'https:';} catch {return false;}
}
export const paymentApi = {
  plans: async () => (await request<{plans: PaymentPlan[]}>('GET', '/payments/plans')).plans,
  create: (token: string, planCode: string) => request<CreateResponse>('POST', '/payments/create', token, {planCode}),
  status: async (token: string, orderCode: string) => (await request<{order: PaymentOrder}>('GET', `/payments/status/${encodeURIComponent(orderCode)}`, token)).order,
  me: (token: string) => request('GET', '/payments/me', token),
};
