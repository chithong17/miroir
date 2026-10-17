import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { returnsApi } from '../../src/api/returns';
import { useSession } from '../../src/stores/session';
import {
  AppHeader,
  Body,
  Button,
  Card,
  ErrorNotice,
  GlassPill,
  Heading,
  MiroirButton,
  Screen,
  StatusBadge,
  SurfaceIconButton,
} from '../../src/components/ui';
import { colors, radii, typography } from '../../src/theme/tokens';
import { money } from '../../src/features/marketplace/Marketplace';

export default function Returns() {
  const token = useSession((s) => s.token);
  const result = useQuery({
    queryKey: ['returns', token],
    queryFn: () => returnsApi.list(token),
    enabled: !!token,
  });

  return (
    <Screen
      header={
        <AppHeader
          title="Returns & refunds"
          subtitle="Manage your return requests and track refunds"
          showBack
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/orders');
            }
          }}
          rightAction={
            <SurfaceIconButton
              icon="receipt-long"
              size={40}
              onPress={() => router.replace('/orders')}
            />
          }
        />
      }
    >
      <ErrorNotice message={result.error?.message} retry={() => void result.refetch()} />

      {/* Empty State matching Flutter */}
      {result.data?.length === 0 && (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons
              name="assignment-return"
              size={42}
              color={colors.accentStrong}
            />
          </View>
          <Text style={styles.emptyTitle}>No returns requested</Text>
          <Text style={styles.emptySubtitle}>
            When you request returns on eligible delivered orders, they will appear here.
          </Text>
          <View style={{ width: '100%', marginTop: 18 }}>
            <MiroirButton
              label="View my orders"
              icon="shopping-bag"
              isSecondary
              onPress={() => router.replace('/orders')}
            />
          </View>
        </Card>
      )}

      {/* Returns List */}
      <View style={{ gap: 14 }}>
        {result.data?.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`Return order ${r.orderCode}`}
            onPress={() => router.push(`/returns/${r.id}`)}
          >
            <Card style={styles.returnCard}>
              <View style={styles.returnHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCode}>Order #{r.orderCode}</Text>
                  <Text style={styles.refundAmount}>
                    Refund amount: <Text style={styles.amountBold}>{money(r.refundAmount)}</Text>
                  </Text>
                </View>
                <StatusBadge status={r.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.reasonRow}>
                <MaterialIcons name="info-outline" size={16} color={colors.muted} />
                <Text style={styles.reasonText} numberOfLines={2}>
                  Reason: {r.reason || 'No specific reason provided'}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <MiroirButton
                  label="View return"
                  icon="chevron-right"
                  isSecondary
                  onPress={() => router.push(`/returns/${r.id}`)}
                />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Navigation to orders */}
      <View style={{ marginTop: 24, marginBottom: 12 }}>
        <MiroirButton
          label="Back to orders"
          icon="receipt-long"
          isSecondary
          onPress={() => router.replace('/orders')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  returnCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  refundAmount: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  amountBold: {
    fontWeight: '700',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonText: {
    fontSize: 13,
    color: colors.ink,
    flex: 1,
  },
  actionRow: {
    marginTop: 12,
  },
});
