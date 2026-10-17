import { create } from 'zustand';
import { UploadAsset } from '../../api/contracts';
import { CatalogProduct } from '../../api/catalog';
import { appendAsset, request } from '../../api/client';
import { useSession } from '../../stores/session';

export type Slot = 'model' | 'dress' | 'upper' | 'lower';
interface TryOnState {
  type: 'dress' | 'upper_lower'; images: Partial<Record<Slot, UploadAsset>>;
  product: CatalogProduct | null; taskId: string; status: string; resultUrl: string; error: string; unread: boolean;
  setType: (type: 'dress' | 'upper_lower') => void;
  setImage: (slot: Slot, image: UploadAsset) => void;
  prefill: (product: CatalogProduct) => void;
  reset: () => void; submit: () => Promise<void>; poll: () => Promise<void>; markSeen: () => void;
}
let generation = 0;
let polling = false;
const initial = {type: 'dress' as const, images: {}, product: null, taskId: '', status: 'idle', resultUrl: '', error: '', unread: false};
export function validateTryOn(type: string, images: Partial<Record<Slot, UploadAsset>>, product: CatalogProduct | null): string {
  if (!images.model) return 'Please upload a full-body model image.';
  if (product) return '';
  if (type === 'dress' && !images.dress) return 'Dress mode requires a dress image.';
  if (type === 'upper_lower' && !images.upper && !images.lower) return 'Upper / Lower mode requires at least one garment image.';
  return '';
}
export const useTryOn = create<TryOnState>((set, get) => ({...initial,
  setType: type => set({type, product: null, images: {model: get().images.model}, error: '', resultUrl: ''}),
  setImage: (slot, image) => set({images: {...get().images, [slot]: image}, error: ''}),
  prefill: product => set({product, images: {model: get().images.model}, error: '', resultUrl: ''}),
  markSeen: () => set({unread: false}),
  reset: () => {generation++; polling = false; set(initial);},
  submit: async () => {
    const state = get(); if (['creating','processing','pending'].includes(state.status)) return;
    const token = useSession.getState().token;
    const error = !token ? 'Please sign in before starting a try-on.' : validateTryOn(state.type, state.images, state.product);
    if (error) {set({error}); return;}
    const run = ++generation;
    set({status: 'creating', error: '', resultUrl: '', taskId: '', unread: false});
    try {
      const form = new FormData();
      if (state.product) {form.append('productId', state.product.id); await appendAsset(form, 'image', state.images.model!);}
      else {
        form.append('tryOnType', state.type); form.append('batchSize', '1');
        for (const slot of ['model','dress','upper','lower'] as Slot[]) if (state.images[slot]) await appendAsset(form, `${slot}Image`, state.images[slot]!);
      }
      const response = await request<{success: boolean; taskId: string; message?: string}>('POST', state.product ? '/tryon/catalog' : '/tryon/custom', token, form);
      if (run !== generation || token !== useSession.getState().token) return;
      if (!response.success || !response.taskId) throw new Error(response.message || 'No try-on task was returned.');
      set({taskId: response.taskId, status: 'processing'}); void get().poll();
    } catch (e) {if (run === generation) set({status: 'failed', error: e instanceof Error ? e.message : 'Try-on failed.'});}
  },
  poll: async () => {
    const {taskId, status} = get(); if (polling || !taskId || !['processing','pending'].includes(status)) return;
    polling = true; const run = generation;
    try {
      const response = await request<{success: boolean; status: string; resultUrl?: string; errorMessage?: string}>('GET', `/tryon/${encodeURIComponent(taskId)}`);
      if (run !== generation) return;
      if (response.status === 'completed') {set({status: 'completed', resultUrl: response.resultUrl || '', unread: true, error: response.resultUrl ? '' : 'Task completed but no result URL was returned.'}); void useSession.getState().refresh();}
      else if (response.status === 'failed' || !response.success) set({status: 'failed', error: response.errorMessage || 'Try-on failed.'});
      else set({status: 'processing', error: ''});
    } catch (e) {if (run === generation) set({error: e instanceof Error ? e.message : 'Connection interrupted. Retrying…'});}
    finally {if (run === generation) polling = false;}
  },
}));
