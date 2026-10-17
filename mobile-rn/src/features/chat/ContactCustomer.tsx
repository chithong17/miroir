import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../api/chat';
import { useOwner } from '../../stores/owner';
import { Button, ErrorNotice } from '../../components/ui';
export function ContactCustomer({orderId}: {orderId: string}) {
  const token = useOwner(s => s.token);
  const open = useMutation({mutationFn: () => chatApi.open('shop',token,{orderId}),onSuccess: c => router.push({pathname:'/owner/chat/[id]',params:{id:c.id,contextType:'order',contextId:orderId}})});
  return <><Button title="Message customer" secondary busy={open.isPending} onPress={() => open.mutate()}/><ErrorNotice message={open.error?.message}/></>;
}
