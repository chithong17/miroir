import { useEffect,useState } from 'react';
import { Text,View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { colors } from '../theme/tokens';
export function NetworkMonitor() {
  const [offline,setOffline]=useState(false);
  useEffect(() => NetInfo.addEventListener(state => {
    const connected=state.isConnected !== false && state.isInternetReachable !== false;
    onlineManager.setOnline(connected);setOffline(!connected);
  }),[]);
  return offline ? <View accessibilityRole="alert" style={{backgroundColor:colors.accentSoft,padding:12,alignItems:'center'}}><Text style={{color:colors.ink}}>You are offline. Reconnect to refresh your content.</Text></View> : null;
}
