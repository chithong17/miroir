import { useEffect } from 'react';
import { AppState, ActivityIndicator } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient, useSession } from '../src/stores/session';
import { Entry } from '../src/features/auth/Entry';
import { Screen } from '../src/components/ui';
import { useLanguage } from '../src/stores/language';
import { NetworkMonitor } from '../src/components/NetworkMonitor';

import { apiBaseUrl } from '../src/api/client';

export default function Layout() {
  const session = useSession();
  const publicPage = ['/terms', '/support', '/delete-owner-account'].includes(usePathname());
  useEffect(() => {
    void useSession.getState().restore();
    void useLanguage.getState().restore();

    // 1. Startup Warmup: Wake up Render backend immediately if sleeping
    void fetch(`${apiBaseUrl}/health`).catch(() => {});

    // 2. Foreground Keep-Alive: Ping every 8 minutes while active so Render never sleeps
    const keepAliveInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void fetch(`${apiBaseUrl}/health`).catch(() => {});
      }
    }, 8 * 60 * 1000);

    const subscription = AppState.addEventListener('change', state => {
      focusManager.setFocused(state === 'active');
      if (state === 'active') {
        void useSession.getState().refresh();
        void fetch(`${apiBaseUrl}/health`).catch(() => {});
      }
    });
    return () => {
      subscription.remove();
      clearInterval(keepAliveInterval);
    };
  }, []);
  return <SafeAreaProvider><QueryClientProvider client={queryClient}><StatusBar style="dark"/>
    <NetworkMonitor/>
    {session.restoring ? <Screen><ActivityIndicator/></Screen> : !session.user && !session.guest && !publicPage ? <Entry/> : <Stack key={session.user?.id || 'guest'} screenOptions={{headerShown:false}}/>}
  </QueryClientProvider></SafeAreaProvider>;
}
