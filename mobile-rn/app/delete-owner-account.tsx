import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ownerApi } from '../src/api/owner';
import { useOwner } from '../src/stores/owner';
import { useSession } from '../src/stores/session';
import { AppHeader, ErrorNotice, Field, MiroirButton, Screen } from '../src/components/ui';
import { commerceLayout } from '../src/theme/commerce';
import { colors, spacing, typography } from '../src/theme/tokens';

export default function DeleteOwnerAccount() {
  const [email, setEmail] = useState(useOwner.getState().owner?.email || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const remove = useMutation({
    mutationFn: async () => {
      if (!email.trim() || !password || confirmation !== 'DELETE') throw new Error('Enter your email, current password and DELETE to confirm.');
      const result = await ownerApi.deleteAccount(email, password, confirmation);
      if (!result.success) throw new Error(result.message || 'Your account was not deleted. Please try again.');
      return result;
    },
    onSuccess: async () => {
      setPassword(''); setConfirmation('');
      // An independently signed-in customer or a different owner must not be signed out.
      if (useOwner.getState().owner?.email.toLowerCase() === email.trim().toLowerCase()) await useOwner.getState().logout();
    },
  });
  async function finish() {
    if (!useSession.getState().user && !useSession.getState().guest) await useSession.getState().continueAsGuest();
    router.replace('/');
  }
  return <Screen header={<AppHeader title="Delete shop owner account" showBack onBack={() => router.canGoBack() ? router.back() : router.replace('/account')}/>}
    contentStyle={{ width: '100%', maxWidth: commerceLayout.formMax, alignSelf: 'center', padding: spacing.xl, gap: spacing.lg }}>
    {remove.isSuccess ? <>
      <Text accessibilityRole="alert" style={typography.headlineSmall}>Shop owner account deleted</Text>
      <Text style={typography.bodyLarge}>{remove.data.message}</Text>
      <MiroirButton label="Back to shopping" onPress={() => void finish()}/>
    </> : <>
      <Text style={typography.headlineSmall}>Permanently close your boutique account</Text>
      <Text style={typography.bodyLarge}>Your owner login is deleted, your boutique closes and its catalog is removed. This also works for a registration awaiting approval. This action cannot be undone.</Text>
      <Text style={typography.bodyMedium}>Order, payment, return and conversation records remain for transaction support and applicable obligations. Your independent customer account is unaffected. Known catalog uploads enter cleanup; images still referenced by retained records are preserved.</Text>
      <Field label="Owner account email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!remove.isPending}/>
      <Field label="Current owner password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!remove.isPending}/>
      <Field label="Type DELETE to confirm" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" autoCorrect={false} editable={!remove.isPending}/>
      <ErrorNotice message={remove.error?.message}/>
      <MiroirButton label="Permanently delete owner account" busy={remove.isPending} disabled={confirmation !== 'DELETE' || !email.trim() || !password} style={{ backgroundColor: colors.error }} onPress={() => remove.mutate()}/>
      <MiroirButton label="Contact support" isSecondary disabled={remove.isPending} onPress={() => router.push('/support')}/>
    </>}
  </Screen>;
}
