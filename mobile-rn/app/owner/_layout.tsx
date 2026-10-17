import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useOwner } from '../../src/stores/owner';
import { OwnerAuthScreen } from '../../src/features/owner/OwnerAuth';
import { Screen } from '../../src/components/ui';
export default function OwnerLayout() {
  const owner = useOwner(); useEffect(() => {void useOwner.getState().restore();}, []);
  return owner.restoring ? <Screen><ActivityIndicator/></Screen> : !owner.token ? <OwnerAuthScreen/> : <Stack screenOptions={{headerShown: false}}/>;
}
