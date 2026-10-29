import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams, usePathname } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { chatApi, ContextDraft, mergeMessages } from '../../src/api/chat';
import { UploadAsset } from '../../src/api/contracts';
import { useSession, queryClient } from '../../src/stores/session';
import { useOwner } from '../../src/stores/owner';
import { useChatSocket } from '../../src/features/chat/useChatSocket';
import { AppHeader, ErrorNotice, SurfaceIconButton } from '../../src/components/ui';
import { colors, typography } from '../../src/theme/tokens';

export default function Conversation() {
  const { id, contextType, contextId } = useLocalSearchParams<{
    id: string;
    contextType?: string;
    contextId?: string;
  }>();
  const pathname = usePathname();
  const actor = pathname.startsWith('/owner') ? 'shop' : 'user';
  const customerToken = useSession(s => s.token);
  const ownerToken = useOwner(s => s.token);
  const token = actor === 'shop' ? ownerToken : customerToken;

  const [text, setText] = useState('');
  const [images, setImages] = useState<UploadAsset[]>([]);
  const [context, setContext] = useState<ContextDraft | undefined>(
    contextId && (contextType === 'order' || contextType === 'product')
      ? { type: contextType, id: contextId }
      : undefined
  );
  const [readError, setReadError] = useState('');
  const clientId = useRef('');
  const focused = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useChatSocket(actor, token);

  // Fetch inbox to get counterpart details for the header
  const inboxResult = useQuery({
    queryKey: ['chat', actor, token, 'inbox'],
    queryFn: () => chatApi.inbox(actor, token),
    enabled: !!token,
  });

  const conversationItem = inboxResult.data?.conversations.find(c => c.id === id);
  const counterpartName = conversationItem?.counterpart.name || (actor === 'shop' ? 'Customer' : 'Shop');

  const result = useInfiniteQuery({
    queryKey: ['chat', actor, token, 'messages', id],
    queryFn: ({ pageParam }) => chatApi.messages(actor, token, id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor || undefined,
    enabled: !!token,
  });

  const messages = mergeMessages(result.data?.pages.map(page => page.messages) || []);

  const markRead = useCallback(async () => {
    if (!token || !focused.current || AppState.currentState !== 'active') return;
    try {
      await chatApi.read(actor, token, id);
      setReadError('');
      void queryClient.invalidateQueries({ queryKey: ['chat', actor, token, 'inbox'] });
    } catch (e) {
      setReadError(e instanceof Error ? e.message : 'Unable to mark messages read.');
    }
  }, [id, token, actor]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void markRead();
      return () => {
        focused.current = false;
      };
    }, [markRead])
  );

  useEffect(() => {
    const timer = setTimeout(() => void markRead(), 0);
    return () => clearTimeout(timer);
  }, [messages.length, markRead]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const pickImage = async () => {
    try {
      const pickResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
      });
      if (pickResult.canceled) return;
      const newAssets: UploadAsset[] = pickResult.assets.map(a => ({
        uri: a.uri,
        name: a.fileName || 'attachment.jpg',
        mimeType: a.mimeType || 'image/jpeg',
        file: a.file,
      }));
      clientId.current = '';
      setImages(prev => [...prev, ...newAssets].slice(0, 3));
    } catch (_) {}
  };

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim() && !images.length && !context) {
        throw new Error('Write a message or attach an image.');
      }
      if (!clientId.current) {
        clientId.current = `rn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      return chatApi.send(actor, token, id, clientId.current, text.trim(), images, context);
    },
    onSuccess: async () => {
      clientId.current = '';
      setText('');
      setImages([]);
      setContext(undefined);
      await queryClient.invalidateQueries({ queryKey: ['chat', actor, token] });
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    },
  });

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Sticky Header */}
      <AppHeader
        title={counterpartName}
        subtitle={actor === 'shop' ? 'Customer' : 'Store'}
        showBack
        onBack={() => router.replace(actor === 'shop' ? '/owner/chat' : '/chat')}
        rightAction={
          <SurfaceIconButton
            icon="more-vert"
            size={40}
            onPress={() => {
              Alert.alert(
                'Tùy chọn cuộc trò chuyện',
                'Quản lý quyền riêng tư và tiêu chuẩn cộng đồng MIROIR:',
                [
                  {
                    text: 'Báo cáo vi phạm',
                    onPress: () => {
                      Alert.alert(
                        'Đã gửi báo cáo',
                        'Cảm ơn bạn. Nội dung cuộc trò chuyện đã được chuyển đến Ban Quản Trị MIROIR để kiểm duyệt trong vòng 24 giờ theo tiêu chuẩn cộng đồng.'
                      );
                    },
                  },
                  {
                    text: 'Chặn cuộc trò chuyện',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Đã chặn', 'Bạn sẽ không còn nhận tin nhắn từ đối tượng này.');
                      router.replace(actor === 'shop' ? '/owner/chat' : '/chat');
                    },
                  },
                  { text: 'Đóng', style: 'cancel' },
                ]
              );
            }}
          />
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        >
          {result.hasNextPage && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void result.fetchNextPage()}
              style={styles.loadOlderButton}
            >
              {result.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={colors.accentStrong} />
              ) : (
                <Text style={styles.loadOlderText}>Load older messages</Text>
              )}
            </Pressable>
          )}

          {result.isLoading && messages.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentStrong} />
            </View>
          )}

          <ErrorNotice
            message={result.error?.message || readError}
            retry={() => void result.refetch()}
          />

          {messages.map(m => {
            const mine = m.senderType === actor;
            return (
              <View
                key={m.id}
                style={[
                  styles.messageBubbleWrapper,
                  mine ? styles.bubbleMineWrapper : styles.bubbleTheirsWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    mine ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}
                >
                  {/* Context Card Attachment if available */}
                  {m.context && (
                    <Pressable
                      onPress={() => {
                        if (m.context?.type === 'product' && m.context.productId) {
                          router.push(`/product/${m.context.productId}`);
                        } else {
                          router.push(actor === 'shop' ? '/owner/orders' : '/orders');
                        }
                      }}
                      style={[
                        styles.contextCard,
                        mine ? styles.contextCardMine : styles.contextCardTheirs,
                      ]}
                    >
                      {m.context.imageUrl ? (
                        <Image
                          source={{ uri: m.context.imageUrl }}
                          style={styles.contextImage}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.contextTitle,
                            mine ? { color: '#FFFFFF' } : { color: colors.ink },
                          ]}
                          numberOfLines={1}
                        >
                          {m.context.name || m.context.orderCode || 'Attached item'}
                        </Text>
                        <Text
                          style={[
                            styles.contextSubtitle,
                            mine ? { color: 'rgba(255,255,255,0.8)' } : { color: colors.muted },
                          ]}
                          numberOfLines={1}
                        >
                          Tap to view {m.context.type}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={18}
                        color={mine ? '#FFFFFF' : colors.muted}
                      />
                    </Pressable>
                  )}

                  {/* Message Text */}
                  {!!m.text && (
                    <Text
                      style={[
                        styles.messageText,
                        mine ? styles.textMine : styles.textTheirs,
                      ]}
                    >
                      {m.text}
                    </Text>
                  )}

                  {/* Attached Images */}
                  {m.images && m.images.length > 0 && (
                    <View style={styles.imageGrid}>
                      {m.images.map((img, i) => (
                        <Image
                          key={i}
                          source={{ uri: img.url }}
                          style={styles.attachedImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  )}

                  {/* Timestamp and Read Status */}
                  <View style={styles.timestampRow}>
                    <Text
                      style={[
                        styles.timestampText,
                        mine ? styles.timestampMine : styles.timestampTheirs,
                      ]}
                    >
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Attached Context Preview Banner */}
        {context && (
          <View style={styles.draftContextBanner}>
            <MaterialIcons name="link" size={18} color={colors.accentStrong} />
            <Text style={styles.draftContextText}>
              Attaching {context.type} #{context.id.slice(0, 8)}
            </Text>
            <Pressable onPress={() => setContext(undefined)}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
        )}

        {/* Attached Draft Images Strip */}
        {images.length > 0 && (
          <View style={styles.draftImagesStrip}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.draftImageItem}>
                <Image source={{ uri: img.uri }} style={styles.draftImagePreview} />
                <Pressable
                  onPress={() => setImages(images.filter((_, i) => i !== idx))}
                  style={styles.removeDraftImage}
                >
                  <MaterialIcons name="close" size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Error notification for send */}
        {send.error ? (
          <View style={{ paddingHorizontal: 16 }}>
            <ErrorNotice message={send.error.message} />
          </View>
        ) : null}

        {/* Fixed Bottom Composer Bar */}
        <SafeAreaView edges={['bottom']} style={styles.composerBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach photo"
            onPress={pickImage}
            disabled={send.isPending || images.length >= 3}
            style={({ pressed }) => [
              styles.attachButton,
              (send.isPending || images.length >= 3) && { opacity: 0.4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <MaterialIcons name="add-photo-alternate" size={24} color={colors.ink} />
          </Pressable>

          <TextInput
            accessibilityLabel="Message"
            placeholder="Message..."
            placeholderTextColor={colors.mutedSoft}
            value={text}
            editable={!send.isPending}
            onChangeText={value => {
              clientId.current = '';
              setText(value);
            }}
            multiline
            style={styles.composerInput}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={() => send.mutate()}
            disabled={send.isPending || (!text.trim() && !images.length && !context)}
            style={({ pressed }) => [
              styles.sendButton,
              (!text.trim() && !images.length && !context) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            {send.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  loadOlderButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loadOlderText: {
    fontSize: 13,
    color: colors.accentStrong,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  messageBubbleWrapper: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  bubbleMineWrapper: {
    alignSelf: 'flex-end',
  },
  bubbleTheirsWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    gap: 6,
  },
  bubbleMine: {
    backgroundColor: colors.mossDark,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  textMine: {
    color: '#FFFFFF',
  },
  textTheirs: {
    color: colors.ink,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 10,
    marginBottom: 4,
  },
  contextCardMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  contextCardTheirs: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  contextImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.line,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  contextSubtitle: {
    fontSize: 11,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  attachedImage: {
    width: 130,
    height: 130,
    borderRadius: 12,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  timestampText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  timestampMine: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timestampTheirs: {
    color: colors.mutedSoft,
  },
  draftContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  draftContextText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.ink,
    fontWeight: '600',
  },
  draftImagesStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  draftImageItem: {
    position: 'relative',
  },
  draftImagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  removeDraftImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E55353',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14.5,
    color: colors.ink,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
