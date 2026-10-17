import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi, CartItem } from '../../api/commerce';
import { useSession, queryClient } from '../../stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  MiroirButton,
  QuantityStepper,
  Screen,
} from '../../components/ui';
import { colors, typography } from '../../theme/tokens';
import { money } from '../marketplace/Marketplace';

export function Cart() {
  const token = useSession(s => s.token);

  const cart = useQuery({
    queryKey: ['cart', token],
    queryFn: () => commerceApi.cart(token),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: ({ item, quantity }: { item: CartItem; quantity: number }) =>
      quantity === 0
        ? commerceApi.remove(token, item)
        : commerceApi.update(token, item, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const c = cart.data;
  const hasItems = !!(c && c.itemCount > 0);
  const hasUnavailable = !!c?.groups.some(g => g.items.some(i => !i.available));

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Your bag"
          showBack
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          rightAction={
            hasItems ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{c.itemCount} items</Text>
              </View>
            ) : null
          }
        />
      }
      footer={
        hasItems ? (
          <View style={styles.checkoutFooter}>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(c.subtotal)}</Text>
            </View>
            <MiroirButton
              label={hasUnavailable ? 'Some items unavailable' : 'Checkout'}
              icon="lock-outline"
              disabled={hasUnavailable || mutation.isPending}
              onPress={() => router.push('/checkout')}
            />
          </View>
        ) : null
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      {!token ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="lock-outline" size={48} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>Sign in to view your bag</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Save items, view current selections, and proceed to checkout seamlessly.
          </Text>
          <MiroirButton label="Sign in" onPress={() => router.replace('/account')} />
        </View>
      ) : cart.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : !hasItems ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-bag" size={54} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>Your bag is empty</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Find something you love in the marketplace and try it on in the Studio.
          </Text>
          <MiroirButton
            label="Explore marketplace"
            icon="storefront"
            onPress={() => router.replace('/')}
          />
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          <ErrorNotice message={cart.error?.message} retry={() => void cart.refetch()} />
          <ErrorNotice message={mutation.error?.message} />

          {c.groups.map(group => (
            <View key={group.shop.id} style={{ gap: 10 }}>
              <View style={styles.shopHeaderRow}>
                <MaterialIcons name="store" size={18} color={colors.accentStrong} />
                <Text style={styles.shopNameText}>{group.shop.name}</Text>
              </View>

              {group.items.map(item => {
                const variantDetails = [item.variant?.color, item.variant?.size]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <Card key={`${item.productId}-${item.variantId}`} style={styles.cartTile}>
                    <View style={styles.tileImageWrapper}>
                      {item.product.imageUrl ? (
                        <Image
                          source={{ uri: item.product.imageUrl }}
                          style={styles.tileImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialIcons name="checkroom" size={28} color={colors.mutedSoft} />
                      )}
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.tileTitle} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      {variantDetails ? (
                        <Text style={styles.tileVariant}>{variantDetails}</Text>
                      ) : null}
                      <Text style={styles.tilePrice}>{money(item.lineTotal)}</Text>
                      {!item.available && (
                        <Text style={styles.tileUnavailable}>Out of stock</Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Remove item"
                        disabled={mutation.isPending}
                        onPress={() => mutation.mutate({ item, quantity: 0 })}
                        style={({ pressed }) => pressed && { opacity: 0.6 }}
                      >
                        <MaterialIcons name="delete-outline" size={20} color={colors.muted} />
                      </Pressable>

                      <QuantityStepper
                        value={item.quantity}
                        min={1}
                        max={item.variant?.stockQuantity || 10}
                        onChange={val => mutation.mutate({ item, quantity: val })}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
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
  shopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  shopNameText: {
    ...typography.titleMedium,
    color: colors.ink,
  },
  cartTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 12,
  },
  tileImageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  tileVariant: {
    fontSize: 12.5,
    color: colors.muted,
  },
  tilePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  tileUnavailable: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  checkoutFooter: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.titleLarge,
  },
  totalValue: {
    ...typography.headlineSmall,
    color: colors.ink,
  },
});
