import { useMutation } from '@tanstack/react-query';
import { request,apiBaseUrl } from '../../api/client';
import { Body,Button,Card,ErrorNotice } from '../../components/ui';
export function HealthCheck() {
  const health=useMutation({mutationFn:() => request<{success:boolean;message?:string}>('GET','/health')});
  return <Card><Button title="Run Health Check" secondary busy={health.isPending} onPress={() => health.mutate()}/><Body>{apiBaseUrl}</Body><ErrorNotice message={health.error?.message}/>{health.data && <Body>{health.data.message || (health.data.success ? 'Backend is available.' : 'Backend reported a problem.')}</Body>}</Card>;
}
