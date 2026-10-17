import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { ownerApi, Owner, OwnerAuth } from '../api/owner';
import { ApiError } from '../api/contracts';
import { queryClient } from './session';
import { onUnauthorized } from '../api/authEvents';
interface OwnerState {restoring: boolean; token: string; owner: Owner | null; error: string; restore: () => Promise<void>; authenticate: (auth: OwnerAuth) => Promise<void>; refresh: () => Promise<void>; logout: () => Promise<void>}
const key = 'miroir.owner.credentials';
let browserCredentials: string | null = null;
const read = () => Platform.OS === 'web' ? Promise.resolve(browserCredentials) : SecureStore.getItemAsync(key);
const write = async (value: string | null) => {
  if (Platform.OS === 'web') browserCredentials = value;
  else if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
};
export const useOwner = create<OwnerState>((set, get) => ({restoring: true, token: '', owner: null, error: '',
  restore: async () => {
    try {const raw = await read(); if (raw) {const saved = JSON.parse(raw); if (typeof saved.token !== 'string' || !saved.owner?.id) throw new Error('Invalid owner session.'); set({token: saved.token, owner: saved.owner}); await get().refresh();}}
    catch(e) {set({error: e instanceof Error ? e.message : 'Unable to restore shop session.'});}
    finally {set({restoring: false});}
  },
  authenticate: async auth => {if (!auth.token || !auth.owner?.id) throw new Error(auth.message || 'Unable to sign in.'); await write(JSON.stringify({token: auth.token, owner: auth.owner})); queryClient.removeQueries({queryKey: ['owner']}); set({token: auth.token, owner: auth.owner, error: ''});},
  refresh: async () => {
    const token = get().token; if (!token) return;
    try {const response = await ownerApi.subscription(token); const owner = get().owner; if (token !== get().token || !owner) return; const updated = {...owner, subscription: response.subscription}; await write(JSON.stringify({token, owner: updated})); if (token === get().token) set({owner: updated, error: ''});}
    catch(e) {if (token !== get().token) return; if (e instanceof ApiError && e.unauthorized) await get().logout(); set({error: e instanceof Error ? e.message : 'Unable to refresh shop account.'});}
  },
  logout: async () => {set({token:'',owner:null,error:''});queryClient.removeQueries({queryKey:['owner']});queryClient.removeQueries({queryKey:['chat','shop']});await write(null);},
}));
onUnauthorized(token => {if (useOwner.getState().token === token) void useOwner.getState().logout().catch(() => {});});
