import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ownerCommerceApi } from '../../api/ownerCommerce';
import { chatApi } from '../../api/chat';
import { useOwner } from '../../stores/owner';
import { ErrorNotice } from '../../components/ui';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { commerceLayout } from '../../theme/commerce';

export function WorkQueue() {
  const token = useOwner(s => s.token);
  const orders = useQuery({ queryKey: ['owner', token, 'orders'], queryFn: () => ownerCommerceApi.orders(token), enabled: !!token, staleTime: 0 });
  const inbox = useQuery({ queryKey: ['chat', 'shop', token, 'inbox'], queryFn: () => chatApi.inbox('shop', token), enabled: !!token, staleTime: 0 });
  const waiting = orders.data?.filter(o => o.orderStatus === 'pending_confirmation').length;
  const packing = orders.data?.filter(o => ['confirmed', 'preparing'].includes(o.orderStatus)).length;
  const items = [
    { label: 'Awaiting confirmation', value: waiting, path: '/owner/orders' as const },
    { label: 'To prepare or ship', value: packing, path: '/owner/orders' as const },
    { label: 'Unread messages', value: inbox.data?.totalUnread, path: '/owner/chat' as const },
  ];
  return <View style={{ gap: spacing.md }}>
    <Text style={typography.titleLarge}>Your next actions</Text>
    <Text style={typography.bodyMedium}>Follow up on orders and customer questions in your boutique.</Text>
    {(orders.isPending || inbox.isPending) && <ActivityIndicator accessibilityLabel="Loading shop tasks" color={colors.primary}/>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`${item.label}: ${item.value ?? 'unavailable'}`} onPress={() => router.push(item.path)}
        style={{ flex: 1, minWidth: 140, minHeight: commerceLayout.target, gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.panel, borderRadius: radii.field, borderWidth: 1, borderColor: colors.line }}>
        <Text style={typography.headlineMedium}>{item.value ?? '—'}</Text><Text style={typography.titleMedium}>{item.label}</Text>
      </Pressable>)}
    </View>
    <ErrorNotice message={orders.error?.message || inbox.error?.message} retry={() => { void orders.refetch(); void inbox.refetch(); }}/>
  </View>;
}
