import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { returnsApi } from '../../src/api/returns';
import { UploadAsset } from '../../src/api/contracts';
import { useSession, queryClient } from '../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  GlassSurface,
  MiroirButton,
  Screen,
  StatusBadge,
} from '../../src/components/ui';
import { ImageAttachments } from '../../src/components/ImageAttachments';
import { money } from '../../src/features/marketplace/Marketplace';
import { ReturnEvidence } from '../../src/features/commerce/ReturnEvidence';
import { colors, typography } from '../../src/theme/tokens';

export default function ReturnDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSession(s => s.token);
  const [tracking, setTracking] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<UploadAsset[]>([]);

  const result = useQuery({
    queryKey: ['return', id, token],
    queryFn: () => returnsApi.detail(token, id),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: async (action: 'shipment' | 'escalate') => {
      if (action === 'shipment') {
        if (!tracking.trim() || !images.length) {
          throw new Error('Enter a tracking code and attach at least one shipping receipt image.');
        }
        return returnsApi.shipment(token, id, tracking.trim(), images);
      }
      if (!message.trim()) {
        throw new Error('Describe the issue for support.');
      }
      return returnsApi.escalate(token, id, message.trim());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['return', id] });
      await queryClient.invalidateQueries({ queryKey: ['returns'] });
      setImages([]);
    },
  });

  const r = result.data;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const canEscalate =
    r &&
    (r.status === 'rejected' ||
      (r.status === 'requested' && now - Date.parse(r.createdAt) >= 72 * 60 * 60 * 1000));

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Return details"
          subtitle={r ? `Order ${r.orderCode}` : undefined}
          showBack
          onBack={() => router.replace('/returns')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice message={result.error?.message} retry={() => void result.refetch()} />
      <ErrorNotice message={mutation.error?.message} />

      {result.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : !r ? (
        <View style={styles.loadingContainer}>
          <Text style={typography.bodyLarge}>Return request not found.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Summary Glass Card */}
          <GlassSurface radius={24} padding={18}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={typography.headlineSmall}>Order #{r.orderCode}</Text>
                <Text style={[typography.bodyMedium, { color: colors.muted }]}>
                  {r.reason}
                </Text>
              </View>
              <Text style={styles.refundAmountText}>{money(r.refundAmount)}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <StatusBadge status={r.status} />
            </View>
          </GlassSurface>

          {/* Shop Decision Details */}
          {r.decision?.reason ? (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="gavel" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Shop Decision</Text>
              </View>
              <Text style={typography.bodyLarge}>{r.decision.reason}</Text>
            </Card>
          ) : null}

          {/* Return Instructions (if shop accepted and provided address/instructions) */}
          {r.returnInstructions ? (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="info-outline" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Return Instructions</Text>
              </View>
              <Text style={typography.bodyMedium}>{r.returnInstructions}</Text>
            </Card>
          ) : null}

          {/* Items returned */}
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="inventory" size={20} color={colors.accentStrong} />
              <Text style={typography.titleMedium}>Returned Items</Text>
            </View>
            <View style={{ gap: 8 }}>
              {r.items.map(item => (
                <View key={`${item.productId}-${item.variantId}`} style={styles.itemRow}>
                  <Text style={[typography.bodyMedium, { flex: 1, fontWeight: '700' }]}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={[typography.bodyMedium, { fontWeight: '700' }]}>
                    {money(item.lineTotal)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Proof Evidence Preview */}
          <ReturnEvidence request={r} />

          {/* Return Shipment Info */}
          {r.shipment ? (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="local-shipping" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Return Shipment</Text>
              </View>
              <Text style={typography.bodyMedium}>
                Tracking Code: <Text style={{ fontWeight: '700' }}>{r.shipment.trackingCode}</Text>
              </Text>
            </Card>
          ) : null}

          {/* Submit Return Shipment Form */}
          {r.status === 'approved' && !r.shipment && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="send" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Send Your Return</Text>
              </View>
              <Text style={[typography.bodySmall, { color: colors.muted }]}>
                Ship the package to the shop's address and submit the tracking code below.
              </Text>
              <Field
                label="Tracking Code"
                placeholder="e.g. GHN12345678"
                value={tracking}
                onChangeText={setTracking}
              />
              <ImageAttachments
                images={images}
                onChange={setImages}
                disabled={mutation.isPending}
              />
              <MiroirButton
                label="Submit shipment"
                busy={mutation.isPending}
                onPress={() => mutation.mutate('shipment')}
              />
            </Card>
          )}

          {/* Escalate / Dispute to Miroir Support */}
          {canEscalate && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="support-agent" size={20} color={colors.error} />
                <Text style={typography.titleMedium}>Ask Miroir Support to Review</Text>
              </View>
              <Text style={[typography.bodySmall, { color: colors.muted }]}>
                If you have an unresolved disagreement with the shop, our team will review the evidence.
              </Text>
              <Field
                label="Describe the issue"
                placeholder="Details for support..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <MiroirButton
                label="Open dispute"
                busy={mutation.isPending}
                onPress={() => mutation.mutate('escalate')}
              />
            </Card>
          )}

          {/* Status History Timeline */}
          {r.history && r.history.length > 0 && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="timeline" size={20} color={colors.accentStrong} />
                <Text style={typography.titleMedium}>Return Timeline</Text>
              </View>
              <View style={{ gap: 10, paddingLeft: 6 }}>
                {r.history.map((event, i) => (
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  refundAmountText: {
    fontSize: 18,
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
    justifyContent: 'space-between',
    paddingVertical: 4,
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
