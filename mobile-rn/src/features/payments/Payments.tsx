import React, { useState } from 'react';
import { Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSession } from '../../stores/session';
import { useOwner } from '../../stores/owner';
import { AppHeader, ErrorNotice, MiroirButton, Screen } from '../../components/ui';
import { spacing, typography } from '../../theme/tokens';
import { commerceLayout } from '../../theme/commerce';

// Keep old billing deep links useful without selling digital access through an external checkout.
export function Payments() {
  const ownerView = usePathname().startsWith('/owner');
  const customer = useSession();
  const owner = useOwner();
  const [busy, setBusy] = useState(false);
  const account = ownerView ? owner.owner : customer.user;
  async function refresh() { setBusy(true); try { await (ownerView ? owner.refresh() : customer.refresh()); } finally { setBusy(false); } }
  return <Screen header={<AppHeader title={ownerView ? 'Shop access' : 'Account access'} showBack onBack={() => router.replace(ownerView ? '/owner' : '/account')}/>}
    contentStyle={{ width: '100%', maxWidth: commerceLayout.formMax, alignSelf: 'center', padding: spacing.xl, gap: spacing.lg }}>
    <Text style={typography.headlineSmall}>{ownerView ? 'Your boutique workspace' : 'Your shopping account'}</Text>
    <Text style={typography.bodyLarge}>{ownerView ? 'Available shop tools depend on the access associated with your shop account.' : 'Browse boutiques, save pieces, message shops and manage your purchases.'}</Text>
    {ownerView && <Text style={typography.bodyMedium}>Access status: {account?.subscription?.isPremium ? 'Active' : 'Standard'}</Text>}
    <Text style={typography.bodyMedium}>There are no digital subscription purchases in this mobile release. Payment instructions for physical products appear with your order.</Text>
    <MiroirButton label="Refresh access" busy={busy} onPress={() => void refresh()}/>
    <ErrorNotice message={ownerView ? owner.error : customer.error}/>
  </Screen>;
}
