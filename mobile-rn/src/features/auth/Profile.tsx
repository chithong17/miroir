import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { customerApi } from '../../api/customer';
import { useSession } from '../../stores/session';
import { AppHeader, ErrorNotice, Field, MiroirButton, Screen } from '../../components/ui';
import { spacing, typography } from '../../theme/tokens';
import { commerceLayout } from '../../theme/commerce';

export function Profile() {
  const { user, token, setUser } = useSession();
  const [preferences, setPreferences] = useState(user?.profile.stylePreferences?.join(', ') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true); setError(''); setSaved(false);
    try { setUser(await customerApi.profile(token, { stylePreferences: preferences.split(',').map(s => s.trim()).filter(Boolean) })); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save preferences.'); }
    finally { setBusy(false); }
  }
  return <Screen header={<AppHeader title="Your account" showBack onBack={() => router.canGoBack() ? router.back() : router.replace('/account')}/>}
    contentStyle={{ width: '100%', maxWidth: commerceLayout.formMax, alignSelf: 'center', padding: spacing.xl, gap: spacing.xl }}>
    {!user ? <><Text style={typography.titleLarge}>Sign in to manage your account</Text><MiroirButton label="Account" onPress={() => router.replace('/account')}/></> : <>
      <View style={{ gap: spacing.sm }}><Text style={typography.headlineSmall}>{user.name}</Text><Text style={typography.bodyLarge}>{user.email}</Text><Text style={typography.bodyMedium}>Manage delivery details in Addresses and follow purchases in Orders.</Text></View>
      <Field label="Favorite styles (optional)" placeholder="Linen, minimal, everyday" value={preferences} onChangeText={setPreferences}/>
      <ErrorNotice message={error}/>{saved && <Text accessibilityRole="alert" style={typography.bodyLarge}>Preferences saved.</Text>}
      <MiroirButton label="Save preferences" busy={busy} onPress={() => void save()}/>
      <MiroirButton label="Delivery addresses" isSecondary onPress={() => router.push('/addresses')}/>
    </>}
  </Screen>;
}
