import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { socketBaseUrl } from '../../api/client';
import { ChatActor } from '../../api/chat';
import { queryClient } from '../../stores/session';
export function useChatSocket(actor: ChatActor, token: string) {
  useFocusEffect(useCallback(() => {
    if (!token) return;
    const socket = io(`${socketBaseUrl}/chat`, {auth: {actorType: actor, token}, transports: ['websocket','polling'], autoConnect: false, reconnection: true});
    const refresh = () => {void queryClient.invalidateQueries({queryKey: ['chat', actor, token]});};
    for (const event of ['chat:message.created','chat:conversation.updated','chat:read','chat:unread.updated']) socket.on(event, refresh);
    socket.on('connect', refresh);
    if (AppState.currentState === 'active') socket.connect();
    const sub = AppState.addEventListener('change', state => {if (state === 'active') socket.connect(); else socket.disconnect();});
    return () => {sub.remove(); socket.removeAllListeners(); socket.disconnect();};
  }, [actor, token]));
}
