import { useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ownerApi } from '../../api/owner';
import { useOwner } from '../../stores/owner';
import { Button, Card, ErrorNotice } from '../../components/ui';
export function UploadImage({label, uri, onUpload}: {label: string; uri?: string; onUpload: (result: {imageUrl: string; imagePublicId: string}) => void}) {
  const token = useOwner(s => s.token); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function pick() {
    setBusy(true); setError('');
    try {const selected = await ImagePicker.launchImageLibraryAsync({mediaTypes: ['images'], quality: 0.85}); if (selected.canceled) return; const a = selected.assets[0]; const result = await ownerApi.upload(token, {uri: a.uri, name: a.fileName || 'shop-image.jpg', mimeType: a.mimeType || 'image/jpeg', file: a.file}); if (useOwner.getState().token === token) onUpload(result);}
    catch(e) {setError(e instanceof Error ? e.message : 'Unable to upload image.');}
    finally {setBusy(false);}
  }
  return <Card>{!!uri && <Image source={{uri}} style={{width: '100%', height: 200}} resizeMode="contain"/>}<Button title={label} secondary busy={busy} onPress={() => void pick()}/><ErrorNotice message={error}/></Card>;
}
