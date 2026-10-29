import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, ErrorNotice, MiroirButton, Screen } from '../src/components/ui';
import { operatorName, privacyPolicyUrl, supportEmail } from '../src/config/support';
import { spacing, typography } from '../src/theme/tokens';
import { commerceLayout } from '../src/theme/commerce';

export default function Support() {
  const [error, setError] = useState('');
  async function email() {
    setError('');
    try { await Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent('Miroir support')}`); }
    catch { setError(`Unable to open your email app. You can email ${supportEmail} directly.`); }
  }
  return <Screen header={<AppHeader title="Miroir support" showBack onBack={() => router.canGoBack() ? router.back() : router.replace('/account')}/>}
    contentStyle={{ width: '100%', maxWidth: commerceLayout.formMax, alignSelf: 'center', padding: spacing.xl, gap: spacing.xl }}>
    <View style={{ gap: spacing.sm }}><Text style={typography.headlineSmall}>How can we help?</Text><Text selectable style={typography.bodyLarge}>{supportEmail}</Text><Text style={typography.bodyMedium}>Contact us for account access, data requests, app issues, or concerns about a shop.</Text></View>
    <Text style={typography.bodyMedium}>Miroir is operated by {operatorName}.</Text>
    <Text style={typography.bodyLarge}>For a product or delivery question, contact the boutique from the product or order page. For returns, open the relevant order and use the return request flow.</Text>
    <Text style={typography.bodyMedium}>When contacting support, include your account email and order code if relevant. Never send your password, verification code, or complete bank card details.</Text>
    <MiroirButton label="Email Miroir support" icon="mail-outline" onPress={() => void email()}/>
    <ErrorNotice message={error}/>
    <MiroirButton label="Privacy & terms" isSecondary onPress={() => router.push('/terms')}/>
    <MiroirButton label="Delete shop owner account" isSecondary onPress={() => router.push('/delete-owner-account')}/>
    <MiroirButton label="Website privacy policy" isSecondary onPress={() => { void Linking.openURL(privacyPolicyUrl).catch(() => setError(`Unable to open the policy. Visit ${privacyPolicyUrl} in your browser.`)); }}/>
  </Screen>;
}
