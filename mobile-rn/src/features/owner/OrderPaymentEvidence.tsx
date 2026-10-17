import { useState } from 'react';
import { Image } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { OwnerOrder,ownerCommerceApi } from '../../api/ownerCommerce';
import { UploadAsset } from '../../api/contracts';
import { useOwner } from '../../stores/owner';
import { queryClient } from '../../stores/session';
import { Body,Button,Card,ErrorNotice,Field,Heading } from '../../components/ui';
import { ImageAttachments } from '../../components/ImageAttachments';
export function OrderPaymentEvidence({order}: {order:OwnerOrder}) {
  const token=useOwner(s => s.token);const [images,setImages]=useState<UploadAsset[]>([]);const [note,setNote]=useState('');
  const mutation=useMutation({mutationFn:async () => {if (!images[0]) throw new Error('Attach the refund transfer receipt.');return ownerCommerceApi.payment(token,order.id,'mark_refunded',note,images[0]);},onSuccess:async () => {await queryClient.invalidateQueries({queryKey:['owner',token,'orders']});setImages([]);}});
  if (!order.paymentProof && !order.refund && order.paymentStatus !== 'refund_pending') return null;
  return <Card>{order.paymentProof?.imageUrl && <><Heading>Customer transfer receipt</Heading><Image source={{uri:order.paymentProof.imageUrl}} style={{width:'100%',height:240}} resizeMode="contain"/></>}{order.refund?.proof?.imageUrl && <><Heading>Refund receipt</Heading><Image source={{uri:order.refund.proof.imageUrl}} style={{width:'100%',height:240}} resizeMode="contain"/><Body>{order.refund.note}</Body></>}{order.paymentStatus === 'refund_pending' && <><Heading>Record order refund</Heading><Body>After returning the payment, attach the transfer receipt.</Body><Field label="Refund note" value={note} onChangeText={setNote}/><ImageAttachments max={1} images={images} onChange={setImages} disabled={mutation.isPending}/><Button title="Mark order refunded" busy={mutation.isPending} onPress={() => mutation.mutate()}/></>}<ErrorNotice message={mutation.error?.message}/></Card>;
}
