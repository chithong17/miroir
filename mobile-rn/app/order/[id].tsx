import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi } from '../../src/api/commerce';
import { UploadAsset } from '../../src/api/contracts';
import { useSession, queryClient } from '../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  GlassSurface,
  MiroirButton,
  ModalSheet,
  Screen,
  StatusBadge,
} from '../../src/components/ui';
import { ImageAttachments } from '../../src/components/ImageAttachments';
import { ContactShop } from '../../src/features/chat/ContactShop';
import { money } from '../../src/features/marketplace/Marketplace';
import { colors, radii, typography } from '../../src/theme/tokens';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSession(s => s.token);
  const [images, setImages] = useState<UploadAsset[]>([]);
  const [reason, setReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const result = useQuery({
    queryKey: ['order', id, token],
    queryFn: () => commerceApi.detail(token, id),
    enabled: !!token,
  });

  const action = useMutation({
    mutationFn: (type: 'transfer' | 'cancel') =>
      type === 'transfer'
        ? commerceApi.reportTransfer(token, id, images[0])
        : reason.trim()
        ? commerceApi.cancel(token, id, reason.trim())
        : Promise.reject(new Error('Enter a cancellation reason.')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order', id] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setImages([]);
      setCancelModalOpen(false);
      setReason('');
    },
  });

  const o = result.data;

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Order details"
          subtitle={o ? `Order ${o.orderCode}` : undefined}
          showBack
          onBack={() => router.replace('/orders')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice message={result.error?.message} retry={() => void result.refetch()} />
      <ErrorNotice message={action.error?.message} />

      {result.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : !o ? (
        <View style={styles.emptyContainer}>
          <Text style={typography.bodyLarge}>Order not found.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Order Summary Glass Card */}
          <GlassSurface radius={24} padding={18}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={typography.headlineSmall}>{o.shopSnapshot?.name || 'Shop'}</Text>
                <Text style={[typography.bodySmall, { color: colors.muted }]}>
                  Order #{o.orderCode} · {new Date(o.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.totalText}>{money(o.total)}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <StatusBadge status={o.orderStatus} />
              <StatusBadge status={o.paymentStatus} />
              <StatusBadge status={o.paymentMethod} />
            </View>
          </GlassSurface>

          {/* Delivery Recipient Card */}
          {o.recipient && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="local-shipping" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Delivery Information</Text>
              </View>
              <View style={{ gap: 3 }}>
                <Text style={typography.bodyLarge}>
                  {o.recipient.name} · {o.recipient.phone}
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.muted }]}>
                  {o.recipient.fullAddress}
                </Text>
                {o.recipient.note ? (
                  <Text style={[typography.bodySmall, { color: colors.mutedSoft, marginTop: 2 }]}>
                    Note: {o.recipient.note}
                  </Text>
                ) : null}
              </View>
            </Card>
          )}

          {/* Items Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="inventory-2" size={20} color={colors.accentStrong} />
              <Text style={typography.titleMedium}>Items ({o.items.length})</Text>
            </View>

            <View style={{ gap: 12 }}>
              {o.items.map(item => (
                <View key={`${item.productId}:${item.variantId}`} style={styles.itemRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialIcons name="checkroom" size={24} color={colors.mutedSoft} />
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
          </Card>

          {/* Bank Transfer Details (if applicable) */}
          {o.paymentMethod === 'bank_transfer' && o.paymentSnapshot && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="account-balance" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Bank Transfer Payment</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={typography.bodyMedium}>
                  Bank: <Text style={{ fontWeight: '700' }}>{o.paymentSnapshot.bankName}</Text>
                </Text>
                <Text style={typography.bodyMedium}>
                  Account: <Text style={{ fontWeight: '700' }}>{o.paymentSnapshot.accountNumber}</Text> ({o.paymentSnapshot.accountHolder})
                </Text>
                <Text style={typography.bodyMedium}>
                  Transfer memo: <Text style={{ fontWeight: '700' }}>{o.orderCode}</Text>
                </Text>
              </View>

              {o.paymentSnapshot.qrImageUrl ? (
                <View style={{ alignItems: 'center', marginVertical: 8 }}>
                  <Image
                    source={{ uri: o.paymentSnapshot.qrImageUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={[typography.bodySmall, { color: colors.muted }]}>
                    Scan to pay with banking app
                  </Text>
                </View>
              ) : null}

              {['awaiting_transfer', 'pending_verification'].includes(o.paymentStatus) && (
                <View style={{ gap: 10, marginTop: 8 }}>
                  <Text style={typography.titleMedium}>Upload payment receipt</Text>
                  <ImageAttachments
                    images={images}
                    onChange={setImages}
                    max={1}
                    disabled={action.isPending}
                  />
                  <MiroirButton
                    label="I have transferred"
                    icon="check"
                    busy={action.isPending}
                    disabled={!images.length}
                    onPress={() => action.mutate('transfer')}
                  />
                </View>
              )}
            </Card>
          )}

          {/* Transfer Receipt Preview */}
          {o.paymentProof?.imageUrl && (
            <Card style={styles.sectionCard}>
              <Text style={typography.titleMedium}>Transfer Receipt Proof</Text>
              <Image
                source={{ uri: o.paymentProof.imageUrl }}
                style={{ width: '100%', height: 220, borderRadius: 14 }}
                resizeMode="contain"
              />
            </Card>
          )}

          {/* Contact Shop Action */}
          <ContactShop orderId={o.id} />

          {/* Order Actions */}
          {o.orderStatus === 'delivered' && (
            <MiroirButton
              label="Request return"
              icon="assignment-return"
              isSecondary
              onPress={() =>
                router.push({
                  pathname: '/returns/create',
                  params: { orderId: o.id },
                })
              }
            />
          )}

          {['pending_confirmation', 'confirmed', 'preparing', 'shipping'].includes(o.orderStatus) && (
            <MiroirButton
              label="Cancel order"
              isSecondary
              onPress={() => setCancelModalOpen(true)}
            />
          )}

          {/* Order Status History Timeline */}
          {o.statusHistory && o.statusHistory.length > 0 && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="timeline" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Order Timeline</Text>
              </View>
              <View style={{ gap: 12, paddingLeft: 8 }}>
                {o.statusHistory.map((event, i) => (
                  <View key={i} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.timelineStatus}>{event.status.replace(/_/g, ' ')}</Text>
                      {event.note ? <Text style={styles.timelineNote}>{event.note}</Text> : null}
                      <Text style={styles.timelineDate}>
                        {new Date(event.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      )}

      {/* Cancel Order Modal */}
      <ModalSheet
        visible={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order"
      >
        <Text style={typography.bodyMedium}>
          Please share a reason for cancelling this order:
        </Text>
        <Field
          label="Cancellation reason"
          placeholder="e.g. Changed my mind..."
          value={reason}
          onChangeText={setReason}
          multiline
        />
        <MiroirButton
          label="Confirm cancellation"
          busy={action.isPending}
          onPress={() => action.mutate('cancel')}
        />
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.panel,
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 12.5,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentStrong,
    marginTop: 6,
  },
  timelineStatus: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
    textTransform: 'capitalize',
  },
  timelineNote: {
    fontSize: 12.5,
    color: colors.muted,
  },
  timelineDate: {
    fontSize: 11,
    color: colors.mutedSoft,
  },
});
