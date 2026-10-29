import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { request } from '../src/api/client';
import { useSession, queryClient } from '../src/stores/session';
import { AppHeader, Card, ErrorNotice, MiroirButton, Screen } from '../src/components/ui';
import { colors, radii, typography } from '../src/theme/tokens';

interface Notice {
  id: string;
  title: string;
  message: string;
  readAt?: string;
  orderId?: string;
}

export default function Notifications() {
  const token = useSession(s => s.token);

  const notices = useQuery({
    queryKey: ['notifications', token],
    queryFn: () =>
      request<{ notifications: Notice[]; unreadCount: number }>('GET', '/notifications', token),
    enabled: !!token,
  });

  const mark = useMutation({
    mutationFn: (id: string) =>
      request('PATCH', `/notifications/${encodeURIComponent(id)}/read`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notices.data?.unreadCount || 0;

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Notifications"
          showBack
          onBack={() => router.replace('/account')}
          rightAction={
            unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            ) : null
          }
        />
      }
      contentStyle={{ padding: 18, gap: 12 }}
    >
      <ErrorNotice
        message={notices.error?.message || mark.error?.message}
        retry={() => void notices.refetch()}
      />

      {notices.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : notices.data?.notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={54} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>You are all caught up</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            We’ll notify you when your orders update, items ship, or discounts drop.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {notices.data?.notifications.map(n => {
            const isUnread = !n.readAt;
            return (
              <Pressable
                key={n.id}
                accessibilityRole="button"
                onPress={() => {
                  if (isUnread) mark.mutate(n.id);
                  if (n.orderId) router.push('/orders');
                }}
                style={({ pressed }) => pressed && { opacity: 0.85 }}
              >
                <Card
                  style={[
                    styles.noticeCard,
                    isUnread && {
                      backgroundColor: colors.accentSoft,
                      borderColor: colors.mossSoft,
                    },
                  ]}
                >
                  <View style={styles.noticeHeader}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons
                        name={n.orderId ? 'receipt' : 'notifications'}
                        size={18}
                        color={colors.accentStrong}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.noticeTitle}>{n.title}</Text>
                      <Text style={styles.noticeMessage}>{n.message}</Text>
                    </View>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <View style={styles.actionsRow}>
                    {n.orderId ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View orders"
                        onPress={() => router.push('/orders')}
                        style={styles.actionChip}
                      >
                        <Text style={styles.actionChipText}>View order →</Text>
                      </Pressable>
                    ) : null}

                    {isUnread && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Mark as read"
                        onPress={() => mark.mutate(n.id)}
                        disabled={mark.isPending}
                        style={styles.actionChip}
                      >
                        <Text style={styles.actionChipMuted}>Mark read</Text>
                      </Pressable>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  unreadBadge: {
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCard: {
    padding: 16,
    borderRadius: 20,
    gap: 10,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  noticeTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  noticeMessage: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E55353',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  actionChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentStrong,
  },
  actionChipMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
});
