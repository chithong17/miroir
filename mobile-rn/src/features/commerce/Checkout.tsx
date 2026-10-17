import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi } from '../../api/commerce';
import { useSession, queryClient } from '../../stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  MiroirButton,
  RadioRow,
  Screen,
  SelectionChip,
} from '../../components/ui';
import { colors, typography } from '../../theme/tokens';
import { money } from '../marketplace/Marketplace';

export function Checkout() {
  const token = useSession(s => s.token);
  const [selected, setSelected] = useState('');
  const [methods, setMethods] = useState<Record<string, string>>({});
  const key = useRef('');

  const cart = useQuery({
    queryKey: ['cart', token],
    queryFn: () => commerceApi.cart(token),
    enabled: !!token,
  });

  const addresses = useQuery({
    queryKey: ['addresses', token],
    queryFn: () => commerceApi.addresses(token),
    enabled: !!token,
  });

  const defaultAddress = addresses.data?.find(a => a.isDefault);
  const addressId = selected || cart.data?.addressId || defaultAddress?.id || addresses.data?.[0]?.id || '';

  const checkout = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Please sign in.');
      if (!addressId) throw new Error('Choose a delivery address first.');
      if (!cart.data?.itemCount) throw new Error('Your bag is empty.');

      if (!key.current) {
        key.current = `rn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const paymentMethods = Object.fromEntries(
        cart.data.groups.map(g => [g.shop.id, methods[g.shop.id] || 'cash'])
      );

      return commerceApi.checkout(token, {
        addressId,
        paymentMethods,
        idempotencyKey: key.current,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.replace('/orders');
    },
  });

  const c = cart.data;

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Checkout"
          showBack
          onBack={() => router.replace('/cart')}
        />
      }
      footer={
        c ? (
          <View style={styles.footerBar}>
            <View style={styles.footerRow}>
              <Text style={styles.footerTotalLabel}>Total</Text>
              <Text style={styles.footerTotalValue}>{money(c.subtotal)}</Text>
            </View>
            <MiroirButton
              label={checkout.isPending ? 'Placing order...' : 'Place order'}
              icon="check-circle-outline"
              busy={checkout.isPending}
              disabled={!c.itemCount || !addressId || checkout.isPending}
              onPress={() => checkout.mutate()}
            />
          </View>
        ) : null
      }
      contentStyle={{ padding: 20, gap: 20 }}
    >
      <ErrorNotice
        message={cart.error?.message || addresses.error?.message}
        retry={() => {
          void cart.refetch();
          void addresses.refetch();
        }}
      />
      <ErrorNotice message={checkout.error?.message} />

      {cart.isLoading || addresses.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          {/* Delivery Address Section */}
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={typography.titleLarge}>Delivery address</Text>
              <Pressable onPress={() => router.push('/addresses')}>
                <Text style={styles.linkText}>Manage</Text>
              </Pressable>
            </View>

            {addresses.data?.length === 0 ? (
              <Card style={{ alignItems: 'center', padding: 24, gap: 12 }}>
                <MaterialIcons name="add-location-alt" size={40} color={colors.mutedSoft} />
                <Text style={typography.bodyMedium}>No delivery address saved yet.</Text>
                <MiroirButton
                  label="Add an address"
                  isSecondary
                  onPress={() => router.push('/addresses')}
                />
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {addresses.data?.map(a => (
                  <RadioRow
                    key={a.id}
                    title={`${a.recipientName} · ${a.phone}`}
                    subtitle={a.fullAddress}
                    selected={a.id === addressId}
                    onSelect={() => setSelected(a.id)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Payment Method Section */}
          <View style={{ gap: 14 }}>
            <Text style={typography.titleLarge}>Payment method</Text>

            {c?.groups.map(group => {
              const currentMethod = methods[group.shop.id] || 'cash';
              return (
                <Card key={group.shop.id} style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="store" size={18} color={colors.accentStrong} />
                    <Text style={typography.titleMedium}>{group.shop.name}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <SelectionChip
                      label="Cash on delivery"
                      icon="payments"
                      selected={currentMethod === 'cash'}
                      onPress={() =>
                        setMethods(prev => ({ ...prev, [group.shop.id]: 'cash' }))
                      }
                    />

                    {group.shop.bankTransferAvailable && (
                      <SelectionChip
                        label="Bank transfer"
                        icon="account-balance"
                        selected={currentMethod === 'bank_transfer'}
                        onPress={() =>
                          setMethods(prev => ({
                            ...prev,
                            [group.shop.id]: 'bank_transfer',
                          }))
                        }
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 14,
    color: colors.accentStrong,
    fontWeight: '700',
  },
  footerBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotalLabel: {
    ...typography.titleLarge,
  },
  footerTotalValue: {
    ...typography.headlineSmall,
    color: colors.ink,
  },
});
