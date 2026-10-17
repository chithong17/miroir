import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../api/chat';
import { useSession } from '../../stores/session';
import { Button, ErrorNotice } from '../../components/ui';
export function ContactShop({shopId, productId, orderId}: {shopId?: string; productId?: string; orderId?: string}) {
  const token = useSession(s => s.token);
  const open = useMutation({mutationFn: async () => {if (!token) throw new Error('Please sign in to contact this shop.'); return chatApi.open('user', token, orderId ? {orderId} : {shopId});}, onSuccess: c => router.push({pathname: '/chat/[id]', params: {id: c.id, ...(orderId ? {contextType: 'order', contextId: orderId} : productId ? {contextType: 'product', contextId: productId} : {})}})});
  return <><Button title="Contact shop" secondary busy={open.isPending} onPress={() => open.mutate()}/><ErrorNotice message={open.error?.message}/></>;
}
