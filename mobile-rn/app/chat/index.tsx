import React from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { chatApi } from '../../src/api/chat';
import { useSession } from '../../src/stores/session';
import { useOwner } from '../../src/stores/owner';
import { useChatSocket } from '../../src/features/chat/useChatSocket';
import { AppHeader, ErrorNotice, ListItemRow, MiroirButton, Screen } from '../../src/components/ui';
import { colors, typography } from '../../src/theme/tokens';

export default function Inbox() {
  const pathname = usePathname();
  const actor = pathname.startsWith('/owner') ? 'shop' : 'user';
  const customerToken = useSession(s => s.token);
  const ownerToken = useOwner(s => s.token);
  const token = actor === 'shop' ? ownerToken : customerToken;

  useChatSocket(actor, token);

  const result = useQuery({
    queryKey: ['chat', actor, token, 'inbox'],
    queryFn: () => chatApi.inbox(actor, token),
    enabled: !!token,
  });

  const title = actor === 'shop' ? 'Shop messages' : 'Messages';

  const renderLeading = (name: string, logoUrl?: string) => {
    if (logoUrl) {
      return <Image source={{ uri: logoUrl }} style={styles.avatar} resizeMode="cover" />;
    }
    const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
    );
  };

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title={title}
          showBack
          onBack={() => router.replace(actor === 'shop' ? '/owner' : '/account')}
          rightAction={
            result.data?.totalUnread ? (
              <View style={styles.unreadHeaderBadge}>
                <Text style={styles.unreadHeaderBadgeText}>
                  {result.data.totalUnread} new
                </Text>
              </View>
            ) : null
          }
        />
      }
      contentStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 10 }}
    >
      {!token ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="lock-outline" size={48} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>Sign in to view messages</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Connect with {actor === 'shop' ? 'customers' : 'shop owners'} and discuss orders.
          </Text>
          <MiroirButton
            label="Sign in"
            onPress={() => router.replace(actor === 'shop' ? '/owner' : '/account')}
          />
        </View>
      ) : result.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : result.error ? (
        <ErrorNotice message={result.error.message} retry={() => void result.refetch()} />
      ) : result.data?.conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="chat-bubble-outline" size={48} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>No conversations yet</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Your conversations with {actor === 'shop' ? 'customers' : 'shops'} will appear here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {result.data?.conversations.map(c => (
            <ListItemRow
              key={c.id}
              leading={renderLeading(c.counterpart.name, c.counterpart.logoUrl)}
              title={c.counterpart.name}
              subtitle={c.lastMessage?.preview || 'Start a conversation'}
              badge={c.unreadCount > 0 ? c.unreadCount : undefined}
              selected={c.unreadCount > 0}
              trailing={
                <MaterialIcons name="chevron-right" size={22} color={colors.mutedSoft} />
              }
              onPress={() =>
                router.push(actor === 'shop' ? `/owner/chat/${c.id}` : `/chat/${c.id}`)
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  unreadHeaderBadge: {
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
