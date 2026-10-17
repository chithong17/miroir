import { appendAsset, request } from './client';
import { UploadAsset } from './contracts';
export type ChatActor = 'user' | 'shop';
export interface Conversation {id: string; counterpart: {id: string; name: string; logoUrl?: string}; lastMessage?: {preview: string}; unreadCount: number; userLastReadAt?: string; shopLastReadAt?: string}
export interface Message {id: string; clientMessageId?: string; senderType: string; text: string; images: {url: string}[]; createdAt: string; context?: {type: string; productId?: string; orderId?: string; name?: string; orderCode?: string; imageUrl?: string; price?: number; total?: number}}
export interface ContextDraft {type: 'product' | 'order'; id: string}
const root = (actor: ChatActor) => actor === 'shop' ? '/shop-chat' : '/chat';
const path = (actor: ChatActor, id: string) => `${root(actor)}/conversations/${encodeURIComponent(id)}`;
export const chatApi = {
  inbox: (actor: ChatActor, token: string) => request<{conversations: Conversation[]; totalUnread: number}>('GET', `${root(actor)}/conversations`, token),
  open: async (actor: ChatActor, token: string, body: {shopId?: string; orderId?: string}) => (await request<{conversation: Conversation}>('POST', `${root(actor)}/conversations`, token, body)).conversation,
  messages: (actor: ChatActor, token: string, id: string, before?: string) => request<{messages: Message[]; nextCursor?: string}>('GET', `${path(actor,id)}/messages`, token, undefined, before ? {before} : undefined),
  read: (actor: ChatActor, token: string, id: string) => request('PATCH', `${path(actor,id)}/read`, token),
  send: async (actor: ChatActor, token: string, id: string, clientMessageId: string, text: string, images: UploadAsset[], context?: ContextDraft) => {
    const form = new FormData(); form.append('clientMessageId', clientMessageId);
    if (text.trim()) form.append('text', text.trim());
    if (context) {form.append('contextType', context.type); form.append('contextId', context.id);}
    for (const image of images.slice(0,3)) await appendAsset(form, 'images', image);
    return (await request<{message: Message}>('POST', `${path(actor,id)}/messages`, token, form)).message;
  },
};
export function mergeMessages(pages: Message[][]) {
  const byId = new Map<string, Message>();
  for (const page of pages) for (const message of page) byId.set(message.id, message);
  return [...byId.values()].sort((a,b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}
