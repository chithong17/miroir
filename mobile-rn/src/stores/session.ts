import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { QueryClient } from '@tanstack/react-query';
import { customerApi } from '../api/customer';
import { ApiError, AuthResult, CustomerUser } from '../api/contracts';
import { onUnauthorized } from '../api/authEvents';

export const queryClient = new QueryClient({defaultOptions: {queries: {retry: 1, staleTime: 30000}, mutations: {retry: false}}});
const tokenKey = 'miroir.customer_token';
// Browser credentials stay in memory; native credentials use the OS keystore.
let browserToken: string | null = null;
const credentials = {
  read: () => Platform.OS === 'web' ? Promise.resolve(browserToken) : SecureStore.getItemAsync(tokenKey),
  write: async (token: string) => { if (Platform.OS === 'web') browserToken = token; else await SecureStore.setItemAsync(tokenKey, token); },
  clear: async () => { if (Platform.OS === 'web') browserToken = null; else await SecureStore.deleteItemAsync(tokenKey); },
};

interface SessionState {
  restoring: boolean; hasSeenOnboarding: boolean; guest: boolean;
  token: string; user: CustomerUser | null; error: string;
  restore: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  authenticate: (result: AuthResult) => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: CustomerUser) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  exitGuest: () => Promise<void>;
  expire: (token:string) => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  restoring: true, hasSeenOnboarding: false, guest: false, token: '', user: null, error: '',
  restore: async () => {
    set({restoring: true, error: ''});
    try {
      const [seen, guest, token] = await Promise.all([AsyncStorage.getItem('miroir.has_seen_onboarding'), AsyncStorage.getItem('miroir.customer_guest_mode'), credentials.read()]);
      set({hasSeenOnboarding: seen === 'true', guest: guest === 'true', token: token || ''});
      if (token) await get().refresh();
    } catch (e) { set({error: e instanceof Error ? e.message : 'Unable to restore session.'}); }
    finally { set({restoring: false}); }
  },
  completeOnboarding: async () => { await AsyncStorage.setItem('miroir.has_seen_onboarding', 'true'); set({hasSeenOnboarding: true}); },
  continueAsGuest: async () => {set({guest:true,token:'',user:null,error:''});queryClient.clear();await credentials.clear();await AsyncStorage.setItem('miroir.customer_guest_mode','true');},
  authenticate: async result => {
    if (!result.token || !result.user?.id) throw new ApiError('Invalid authentication response.');
    await credentials.write(result.token);
    await AsyncStorage.setItem('miroir.customer_guest_mode', 'false');
    queryClient.clear(); set({token: result.token, user: result.user, guest: false, error: ''});
  },
  refresh: async () => {
    const token = get().token;
    if (!token) return;
    try { const user = await customerApi.me(token); if (get().token === token) set({user, guest: false, error: ''}); }
    catch (error) {
      if (get().token !== token) return;
      if (error instanceof ApiError && error.unauthorized) {await get().expire(token);return;}
      set({error: error instanceof Error ? error.message : 'Unable to refresh your account.'});
    }
  },
  setUser: user => {if (get().token && get().user?.id === user.id) set({user});},
  logout: async () => get().continueAsGuest(),
  deleteAccount: async () => {
    const token = get().token;
    if (token) {
      try {
        await customerApi.deleteAccount(token);
      } catch {
        // proceed to clear local data
      }
    }
    await get().continueAsGuest();
  },
  exitGuest: async () => {await AsyncStorage.setItem('miroir.customer_guest_mode', 'false'); set({guest: false});},
  expire:async token => {
    if (get().token !== token) return;
    set({token:'',user:null,guest:false,error:'Your session expired. Please sign in again.'});queryClient.clear();
    await credentials.clear();await AsyncStorage.setItem('miroir.customer_guest_mode','false');
  },
}));
onUnauthorized(token => {if (useSession.getState().token === token) void useSession.getState().expire(token).catch(() => {});});
