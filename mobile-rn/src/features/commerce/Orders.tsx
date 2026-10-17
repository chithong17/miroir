import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi } from '../../api/commerce';
import { returnsApi } from '../../api/returns';
import { useSession, queryClient } from '../../stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  ModalSheet,
  Screen,
  SelectionChip,
  StatusBadge,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';
import { money } from '../marketplace/Marketplace';
import { ContactShop } from '../chat/ContactShop';

export function Orders() {
  const token = useSession(s => s.token);
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const orders = useQuery({
    queryKey: ['orders', token],
    queryFn: () => commerceApi.orders(token),
    enabled: !!token,
  });

  const returns = useQuery({
    queryKey: ['returns', token],
    queryFn: () => returnsApi.list(token),
    enabled: !!token && activeTab === 'returns',
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      if (!reason.trim()) throw new Error('Enter a cancellation reason.');
      return commerceApi.cancel(token, id, reason.trim());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancellingOrderId(null);
      setReason('');
    },
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="My orders"
          showBack
          onBack={() => router.replace('/account')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      {/* Segmented Tab Bar */}
      <View style={styles.tabsRow}>
        <SelectionChip
          label="Orders"
          selected={activeTab === 'orders'}
          onPress={() => setActiveTab('orders')}
        />
        <SelectionChip
          label="Returns & refunds"
          selected={activeTab === 'returns'}
          onPress={() => setActiveTab('returns')}
        />
      </View>

      {!token ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="lock-outline" size={48} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>Sign in to view orders</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Track order status, manage delivery, and request returns easily.
          </Text>
          <MiroirButton label="Sign in" onPress={() => router.replace('/account')} />
        </View>
      ) : activeTab === 'orders' ? (
        /* ORDERS TAB */
        <View style={{ gap: 16 }}>
          <ErrorNotice message={orders.error?.message} retry={() => void orders.refetch()} />

          {orders.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentStrong} />
            </View>
          ) : orders.data?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={50} color={colors.mutedSoft} />
              <Text style={typography.titleLarge}>No orders yet</Text>
              <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
                Your completed checkout orders will appear here.
              </Text>
              <MiroirButton
                label="Explore marketplace"
                icon="storefront"
                onPress={() => router.replace('/')}
              />
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <View style={{ gap: 2 }}>
                <Text style={typography.titleMedium}>Order activity</Text>
                <Text style={[typography.bodySmall, { color: colors.muted }]}>
                  Track each shop order in one place.
                </Text>
              </View>

              {orders.data?.map(order => {
                const isDelivered = order.orderStatus === 'delivered';
                const isCancelable = [
                  'pending_confirmation',
                  'confirmed',
                  'preparing',
                  'shipping',
                ].includes(order.orderStatus);

                return (
                  <Card key={order.id} style={styles.orderCard}>
                    {/* Header Row */}
                    <View style={styles.orderCardHeader}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={typography.titleMedium}>
                          {order.shopSnapshot?.name || 'Shop'}
                        </Text>
                        <Text style={[typography.bodySmall, { color: colors.muted }]}>
                          Order {order.orderCode}
                        </Text>
                      </View>
                      <Text style={styles.orderTotalText}>{money(order.total)}</Text>
                    </View>

                    {/* Status Badges */}
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={order.orderStatus} />
                      <StatusBadge status={order.paymentStatus} />
                    </View>

                    {/* Items List */}
                    <View style={styles.itemsList}>
                      {order.items.map(item => (
                        <View
                          key={`${item.productId}-${item.variantId}`}
                          style={styles.itemRow}
                        >
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.itemThumb}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.itemThumbPlaceholder}>
                              <MaterialIcons name="checkroom" size={20} color={colors.mutedSoft} />
                            </View>
                          )}
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.itemMeta}>
                              {[item.color, item.size].filter(Boolean).join(' · ')} × {item.quantity}
                            </Text>
                          </View>
                          <Text style={styles.itemPrice}>{money(item.lineTotal)}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Actions Row */}
                    <View style={{ gap: 10, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <MiroirButton
                            label="Order details"
                            icon="receipt"
                            isSecondary
                            onPress={() => router.push(`/order/${order.id}`)}
                          />
                        </View>
                        {isDelivered && (
                          <View style={{ flex: 1 }}>
                            <MiroirButton
                              label="Request return"
                              icon="assignment-return"
                              isSecondary
                              onPress={() =>
                                router.push({
                                  pathname: '/returns/create',
                                  params: { orderId: order.id },
                                })
                              }
                            />
                          </View>
                        )}
                      </View>

                      <ContactShop orderId={order.id} />

                      {isCancelable && (
                        <MiroirButton
                          label="Cancel order"
                          isSecondary
                          onPress={() => setCancellingOrderId(order.id)}
                        />
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        /* RETURNS TAB */
        <View style={{ gap: 16 }}>
          <ErrorNotice message={returns.error?.message} retry={() => void returns.refetch()} />

          {returns.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentStrong} />
            </View>
          ) : returns.data?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment-return" size={50} color={colors.mutedSoft} />
              <Text style={typography.titleLarge}>No return requests</Text>
              <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
                Items returned for refund will be tracked here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ gap: 2 }}>
                <Text style={typography.titleMedium}>Return requests</Text>
                <Text style={[typography.bodySmall, { color: colors.muted }]}>
                  Manage your returned items and refunds.
                </Text>
              </View>

              {returns.data?.map(r => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/returns/${r.id}`)}
                  style={({ pressed }) => pressed && { opacity: 0.85 }}
                >
                  <Card style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={typography.titleMedium}>Order {r.orderCode}</Text>
                        <Text style={[typography.bodySmall, { color: colors.muted }]}>
                          {r.reason}
                        </Text>
                      </View>
                      <Text style={styles.orderTotalText}>{money(r.refundAmount)}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <StatusBadge status={r.status} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.linkText}>View details</Text>
                        <MaterialIcons name="chevron-right" size={18} color={colors.accentStrong} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Cancel Order Modal */}
      <ModalSheet
        visible={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        title="Cancel Order"
      >
        <Text style={typography.bodyMedium}>
          Please share a reason for cancelling this order so the shop is informed.
        </Text>
        <Field
          label="Cancellation reason"
          placeholder="e.g. Changed my mind, found another size..."
          value={reason}
          onChangeText={setReason}
          multiline
        />
        <ErrorNotice message={cancel.error?.message} />
        <MiroirButton
          label="Confirm cancellation"
          busy={cancel.isPending}
          onPress={() => cancellingOrderId && cancel.mutate(cancellingOrderId)}
        />
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  orderCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderTotalText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  itemsList: {
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.panel,
  },
  itemThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentStrong,
  },
});
