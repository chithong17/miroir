import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { nextOrderStatuses, ownerCommerceApi, OwnerOrder } from '../../src/api/ownerCommerce';
import { useOwner } from '../../src/stores/owner';
import { queryClient } from '../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  Screen,
  StatusBadge,
} from '../../src/components/ui';
import { money } from '../../src/features/marketplace/Marketplace';
import { ContactCustomer } from '../../src/features/chat/ContactCustomer';
import { OrderPaymentEvidence } from '../../src/features/owner/OrderPaymentEvidence';
import { colors, radii, typography } from '../../src/theme/tokens';

function OrderCard({ order }: { order: OwnerOrder }) {
  const token = useOwner(s => s.token);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async ({
      action,
      value,
    }: {
      action: 'status' | 'cancel' | 'payment';
      value: string;
    }) => {
      if ((value === 'cancelled' || value === 'reject_transfer') && !reason.trim()) {
        throw new Error('Enter a reason first.');
      }
      if (action === 'status') return ownerCommerceApi.status(token, order.id, value, reason);
      if (action === 'cancel') return ownerCommerceApi.cancellation(token, order.id, value === 'approve', reason);
      return ownerCommerceApi.payment(token, order.id, value, reason);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner', token, 'orders'] }),
  });

  const nextStatuses = nextOrderStatuses[order.orderStatus] || [];
  const canConfirmPayment = ['cod_pending', 'awaiting_transfer', 'pending_verification'].includes(
    order.paymentStatus
  );
  const isVerificationPending = order.paymentStatus === 'pending_verification';

  return (
    <Card style={styles.orderCard}>
      {/* Top Header */}
      <View style={styles.orderHeaderRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typography.titleLarge}>Order #{order.orderCode}</Text>
          <Text style={[typography.bodySmall, { color: colors.muted }]}>
            {order.paymentMethod.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text style={styles.orderTotalText}>{money(order.total)}</Text>
      </View>

      {/* Badges */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge status={order.orderStatus} />
        <StatusBadge status={order.paymentStatus} />
      </View>

      {/* Recipient Details */}
      {order.recipient && (
        <View style={styles.recipientBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="person" size={16} color={colors.accentStrong} />
            <Text style={styles.recipientName}>
              {order.recipient.name} · {order.recipient.phone}
            </Text>
          </View>
          <Text style={styles.recipientAddress}>{order.recipient.fullAddress}</Text>
        </View>
      )}

      {/* Items List */}
      <View style={styles.itemsBox}>
        {order.items.map(item => (
          <View key={`${item.productId}:${item.variantId}`} style={styles.itemRow}>
            <Text style={[typography.bodyMedium, { flex: 1, fontWeight: '600' }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.muted }]}>
              {[item.color, item.size].filter(Boolean).join(' · ')} × {item.quantity}
            </Text>
          </View>
        ))}
      </View>

      {/* Payment Evidence */}
      <OrderPaymentEvidence order={order} />

      {/* Contact customer */}
      <ContactCustomer orderId={order.id} />

      {/* Action Reason Note Input (if status/cancel/reject actions available) */}
      {(nextStatuses.length > 0 || order.orderStatus === 'cancel_requested' || isVerificationPending) && (
        <Field
          label="Action reason / note (optional)"
          placeholder="e.g. Tracking code, package dispatched..."
          value={reason}
          onChangeText={setReason}
        />
      )}

      <ErrorNotice message={mutation.error?.message} />

      {/* Transition Action Buttons */}
      <View style={{ gap: 8, marginTop: 4 }}>
        {nextStatuses.map(status => (
          <MiroirButton
            key={status}
            label={`Mark ${status.replace(/_/g, ' ')}`}
            icon="update"
            isSecondary
            busy={mutation.isPending}
            onPress={() => mutation.mutate({ action: 'status', value: status })}
          />
        ))}

        {order.orderStatus === 'cancel_requested' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <MiroirButton
                label="Approve cancellation"
                busy={mutation.isPending}
                onPress={() => mutation.mutate({ action: 'cancel', value: 'approve' })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MiroirButton
                label="Reject cancellation"
                isSecondary
                busy={mutation.isPending}
                onPress={() => mutation.mutate({ action: 'cancel', value: 'reject' })}
              />
            </View>
          </View>
        )}

        {canConfirmPayment && (
          <MiroirButton
            label="Confirm payment received"
            icon="payments"
            busy={mutation.isPending}
            onPress={() => mutation.mutate({ action: 'payment', value: 'confirm_paid' })}
          />
        )}

        {isVerificationPending && (
          <MiroirButton
            label="Reject transfer"
            icon="cancel"
            isSecondary
            busy={mutation.isPending}
            onPress={() => mutation.mutate({ action: 'payment', value: 'reject_transfer' })}
          />
        )}
      </View>
    </Card>
  );
}

export default function OwnerOrders() {
  const token = useOwner(s => s.token);
  const result = useQuery({
    queryKey: ['owner', token, 'orders'],
    queryFn: () => ownerCommerceApi.orders(token),
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Shop orders"
          showBack
          onBack={() => router.replace('/owner')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice message={result.error?.message} retry={() => void result.refetch()} />

      {result.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : result.data?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={54} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>No orders yet</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            When customers place orders from your boutique, they will appear here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {result.data?.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
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
  orderCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderTotalText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  recipientBox: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  recipientName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  recipientAddress: {
    fontSize: 12.5,
    color: colors.muted,
  },
  itemsBox: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
