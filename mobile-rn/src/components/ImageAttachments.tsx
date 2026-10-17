import { useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UploadAsset } from '../api/contracts';
import { Button, Card, ErrorNotice } from './ui';
export function ImageAttachments({images, onChange, disabled = false, max = 3}: {images: UploadAsset[]; onChange: (images: UploadAsset[]) => void; disabled?: boolean; max?: number}) {
  const [error, setError] = useState('');
  async function pick() {
    try {setError(''); const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ['images'], quality: 0.85}); if (result.canceled) return; const a = result.assets[0]; onChange([...images, {uri: a.uri, name: a.fileName || 'attachment.jpg', mimeType: a.mimeType || 'image/jpeg', file: a.file}].slice(0, max));}
    catch(e) {setError(e instanceof Error ? e.message : 'Unable to select image.');}
  }
  return <>{images.map((image,i) => <Card key={`${image.uri}-${i}`}><Image source={{uri: image.uri}} style={{height: 180, width: '100%'}} resizeMode="contain"/><Button title={`Remove image ${i+1}`} disabled={disabled} secondary onPress={() => onChange(images.filter((_,index) => index !== i))}/></Card>)}<Button title={`Add photo (${images.length}/${max})`} disabled={disabled || images.length >= max} secondary onPress={() => void pick()}/><ErrorNotice message={error}/></>;
}
