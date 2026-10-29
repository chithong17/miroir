import { Tabs } from 'expo-router';
import { BottomNav } from '../../src/components/BottomNav';
export default function TabLayout() {
  return <Tabs tabBar={() => <BottomNav/>} screenOptions={{headerShown:false,lazy:true}}>
    <Tabs.Screen name="index"/>
    <Tabs.Screen name="saved"/>
    <Tabs.Screen name="orders"/>
    <Tabs.Screen name="account"/>
  </Tabs>;
}
