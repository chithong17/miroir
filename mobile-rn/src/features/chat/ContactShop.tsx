import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../api/chat';
import { useSession } from '../../stores/session';
import { Button, ErrorNotice } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';
import { commerceLayout } from '../../theme/commerce';
export function ContactShop({shopId, productId, orderId, compact = false}: {shopId?: string; productId?: string; orderId?: string; compact?: boolean}) {
  const token = useSession(s => s.token);
  const open = useMutation({mutationFn: async () => {if (!token) throw new Error('Sign in from Account to contact this shop.'); return chatApi.open('user', token, orderId ? {orderId} : {shopId});}, onSuccess: c => router.push({pathname: '/chat/[id]', params: {id: c.id, ...(orderId ? {contextType: 'order', contextId: orderId} : productId ? {contextType: 'product', contextId: productId} : {})}})});
  return <>{compact ? <Pressable accessibilityRole="button" accessibilityLabel="Contact shop" accessibilityState={{ disabled: open.isPending }} disabled={open.isPending} style={{ minWidth: commerceLayout.target, minHeight: commerceLayout.target, padding: spacing.md, alignItems: 'center', justifyContent: 'center' }} onPress={() => open.mutate()}><MaterialIcons name="chat-bubble-outline" size={22} color={colors.primary}/></Pressable> : <Button title="Contact shop" secondary busy={open.isPending} onPress={() => open.mutate()}/>}<ErrorNotice message={open.error?.message}/></>;
}
