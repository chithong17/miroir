import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
const translations = {
  en: {home:'Discover',saved:'Saved',orders:'Orders',account:'Account',language:'Language',english:'English',vietnamese:'Vietnamese',login:'Sign in / create account',logout:'Sign out'},
  vi: {home:'Khám phá',saved:'Đã lưu',orders:'Đơn hàng',account:'Tài khoản',language:'Ngôn ngữ',english:'Tiếng Anh',vietnamese:'Tiếng Việt',login:'Đăng nhập / tạo tài khoản',logout:'Đăng xuất'},
};
export type Language = keyof typeof translations;
export const useLanguage = create<{language:Language;error:string;restore:() => Promise<void>;setLanguage:(language:Language) => Promise<void>}>((set) => ({language:'en',error:'',
  restore:async () => {try {const value = await AsyncStorage.getItem('language_code');if (value === 'en' || value === 'vi') set({language:value});} catch(e) {set({error:e instanceof Error ? e.message : 'Unable to load language.'});}},
  setLanguage:async language => {try {await AsyncStorage.setItem('language_code',language);set({language,error:''});} catch(e) {set({error:e instanceof Error ? e.message : 'Unable to save language.'});}},
}));
export function useTranslation() {const language = useLanguage(s => s.language);return (key:keyof typeof translations.en) => translations[language][key];}
