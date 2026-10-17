import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerCommerceApi } from '../../src/api/ownerCommerce';
import { ReturnRequest } from '../../src/api/returns';
import { UploadAsset } from '../../src/api/contracts';
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
import { ImageAttachments } from '../../src/components/ImageAttachments';
import { ReturnEvidence } from '../../src/features/commerce/ReturnEvidence';
import { money } from '../../src/features/marketplace/Marketplace';
import { colors, radii, typography } from '../../src/theme/tokens';

function ReturnCard({
  item,
}: {
  item: ReturnRequest & {
    refundAccount?: { bankName: string; accountNumber: string; accountHolder: string };
  };
}) {
  const token = useOwner(s => s.token);
  const [text, setText] = useState('');
  const [images, setImages] = useState<UploadAsset[]>([]);

  const mutation = useMutation({
    mutationFn: async (action: string) => {
      if (action === 'approve' || action === 'reject') {
        if (!text.trim()) {
          throw new Error(
            action === 'approve'
              ? 'Enter return shipping instructions.'
              : 'Enter a rejection reason.'
          );
        }
        return ownerCommerceApi.decide(token, item.id, action === 'approve', text.trim());
      }
      if (action === 'receive') return ownerCommerceApi.receive(token, item.id);
      if (!images[0]) throw new Error('Attach refund transfer proof.');
      return ownerCommerceApi.refund(token, item.id, text.trim(), images[0]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['owner', token, 'returns'] });
      setImages([]);
      setText('');
    },
  });

  return (
    <Card style={styles.returnCard}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typography.titleLarge}>Return for #{item.orderCode}</Text>
          <Text style={[typography.bodyMedium, { color: colors.muted }]}>{item.reason}</Text>
        </View>
        <Text style={styles.refundAmountText}>{money(item.refundAmount)}</Text>
      </View>

      <StatusBadge status={item.status} />

      {/* Items List */}
      <View style={styles.itemsBox}>
        {item.items.map(i => (
          <View key={`${i.productId}:${i.variantId}`} style={styles.itemRow}>
            <Text style={[typography.bodyMedium, { flex: 1, fontWeight: '600' }]} numberOfLines={1}>
              {i.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.muted }]}>
              Qty: {i.quantity}
            </Text>
          </View>
        ))}
      </View>

      {/* Evidence */}
      <ReturnEvidence request={item} />

      {/* Refund Destination Account */}
      {item.refundAccount && (
        <View style={styles.accountBox}>
          <Text style={styles.accountTitle}>Customer Refund Account:</Text>
          <Text style={styles.accountDetails}>
            {item.refundAccount.bankName} · {item.refundAccount.accountNumber} ({item.refundAccount.accountHolder})
          </Text>
        </View>
      )}

      {item.returnInstructions ? (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Return Instructions Provided:</Text>
          <Text style={styles.instructionBody}>{item.returnInstructions}</Text>
        </View>
      ) : null}

      {item.shipment && (
        <View style={styles.shipmentBox}>
          <MaterialIcons name="local-shipping" size={16} color={colors.accentStrong} />
          <Text style={styles.shipmentText}>
            Tracking: <Text style={{ fontWeight: '700' }}>{item.shipment.trackingCode}</Text>
          </Text>
        </View>
      )}

      {/* Decision / Note input */}
      {['requested', 'refund_pending'].includes(item.status) && (
        <Field
          label={
            item.status === 'requested'
              ? 'Return shipping instructions (or rejection reason)'
              : 'Refund transaction note / reference'
          }
          placeholder="e.g. Please ship back via GHN to..."
          value={text}
          onChangeText={setText}
          multiline
        />
      )}

      {item.status === 'refund_pending' && (
        <View style={{ gap: 8 }}>
          <Text style={typography.titleMedium}>Attach Bank Transfer Proof</Text>
          <ImageAttachments
            images={images}
            onChange={setImages}
            max={1}
            disabled={mutation.isPending}
          />
        </View>
      )}

      <ErrorNotice message={mutation.error?.message} />

      {/* Action Buttons */}
      <View style={{ gap: 8, marginTop: 4 }}>
        {item.status === 'requested' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <MiroirButton
                label="Approve return"
                busy={mutation.isPending}
                onPress={() => mutation.mutate('approve')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MiroirButton
                label="Reject return"
                isSecondary
                busy={mutation.isPending}
                onPress={() => mutation.mutate('reject')}
              />
            </View>
          </View>
        )}

        {item.status === 'return_shipped' && (
          <MiroirButton
            label="Confirm returned goods received"
            icon="inventory"
            busy={mutation.isPending}
            onPress={() => mutation.mutate('receive')}
          />
        )}

        {item.status === 'refund_pending' && (
          <MiroirButton
            label="Record refund with proof"
            icon="receipt-long"
            busy={mutation.isPending}
            onPress={() => mutation.mutate('refund')}
          />
        )}
      </View>
    </Card>
  );
}

export default function OwnerReturns() {
  const token = useOwner(s => s.token);
  const result = useQuery({
    queryKey: ['owner', token, 'returns'],
    queryFn: () => ownerCommerceApi.returns(token),
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Shop returns"
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
          <MaterialIcons name="assignment-return" size={54} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>No return requests</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            When customers request a return or refund, it will be managed here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {result.data?.map(item => (
            <ReturnCard key={item.id} item={item} />
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
  returnCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  refundAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
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
  },
  accountBox: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  accountTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedSoft,
  },
  accountDetails: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  instructionBox: {
    backgroundColor: '#F4F6F9',
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  instructionBody: {
    fontSize: 13,
    color: colors.ink,
  },
  shipmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    padding: 10,
    borderRadius: 12,
  },
  shipmentText: {
    fontSize: 13,
    color: colors.ink,
  },
});
