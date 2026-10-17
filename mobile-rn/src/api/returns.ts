import { appendAsset, request } from './client';
import { UploadAsset } from './contracts';
export interface ReturnAttachment {imageUrl: string; publicId: string}
export interface ReturnRequest {id: string; orderId: string; orderCode: string; status: string; reason: string; refundAmount: number; createdAt: string; returnInstructions?: string; decision?: {reason: string}; attachments: string[]; items: {productId: string; variantId: string; name: string; quantity: number; lineTotal: number}[]; shipment?: {trackingCode: string; attachments: ReturnAttachment[]}; refund?: {reference: string; proof?: ReturnAttachment; note?: string}; history?: {status: string; note: string; createdAt: string}[]}
export interface ReturnPayload {items: {productId: string; variantId: string; quantity: number}[]; reason: string; bankName: string; accountNumber: string; accountHolder: string}
const id = encodeURIComponent;
export const returnsApi = {
  list: async (token: string) => (await request<{returns: ReturnRequest[]}>('GET', '/orders/returns/me', token)).returns,
  detail: async (token: string, returnId: string) => {
    const raw = (await request<{return: Omit<ReturnRequest, 'attachments'> & {attachments: (string | ReturnAttachment)[]}}>('GET', `/orders/returns/me/${id(returnId)}`, token)).return;
    return {...raw, attachments: (raw.attachments || []).map(image => typeof image === 'string' ? image : image.imageUrl)} as ReturnRequest;
  },
  create: async (token: string, orderId: string, payload: ReturnPayload, images: UploadAsset[]) => {
    const form = new FormData(); form.append('items', JSON.stringify(payload.items));
    for (const key of ['reason','bankName','accountNumber','accountHolder'] as const) form.append(key, payload[key].trim());
    for (const image of images.slice(0,3)) await appendAsset(form, 'images', image);
    return request<{return: ReturnRequest}>('POST', `/orders/returns/me/${id(orderId)}`, token, form);
  },
  shipment: async (token: string, returnId: string, trackingCode: string, images: UploadAsset[]) => {
    const form = new FormData(); form.append('trackingCode', trackingCode.trim());
    for (const image of images.slice(0,3)) await appendAsset(form, 'images', image);
    return request('POST', `/orders/returns/${id(returnId)}/shipment`, token, form);
  },
  escalate: (token: string, returnId: string, message: string) => request('POST', `/orders/returns/${id(returnId)}/disputes`, token, {message: message.trim()}),
};
