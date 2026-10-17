import { Image } from 'react-native';
import { ReturnRequest } from '../../api/returns';
import { Body, Card, Heading } from '../../components/ui';
export function ReturnEvidence({request}: {request: ReturnRequest}) {
  const images = [...(request.attachments || []), ...(request.shipment?.attachments || []), ...(request.refund?.proof ? [request.refund.proof] : [])];
  return <Card><Heading>Return evidence</Heading>{images.map((image,i) => <Image key={i} source={{uri: typeof image === 'string' ? image : image.imageUrl}} style={{width: '100%', height: 240}} resizeMode="contain"/>)}{request.refund?.note && <Body>{request.refund.note}</Body>}</Card>;
}
