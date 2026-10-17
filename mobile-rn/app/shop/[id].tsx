import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { catalogApi } from '../../src/api/catalog';
import { useSession } from '../../src/stores/session';
import { AppHeader, Card, ErrorNotice, MiroirButton, Screen } from '../../src/components/ui';
import { ProductCard } from '../../src/features/marketplace/Marketplace';
import { colors, radii, typography } from '../../src/theme/tokens';

export default function ShopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSession(s => s.token);
  const [page, setPage] = useState(1);

  const shop = useQuery({
    queryKey: ['catalog-shop', id, token],
    queryFn: () => catalogApi.shop(id, token),
  });

  const products = useQuery({
    queryKey: ['catalog-shop-products', id, page, token],
    queryFn: () => catalogApi.products({ shopId: id, page }, token),
  });

  const s = shop.data;

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title={s?.name || 'Shop'}
          showBack
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          rightAction={
            s ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Message shop"
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: s.id },
                  })
                }
                style={styles.headerChatBtn}
              >
                <MaterialIcons name="chat-bubble-outline" size={20} color={colors.accentStrong} />
              </Pressable>
            ) : null
          }
        />
      }
      contentStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 18 }}
    >
      <ErrorNotice
        message={shop.error?.message || products.error?.message}
        retry={() => {
          void shop.refetch();
          void products.refetch();
        }}
      />

      {shop.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : s ? (
        <View style={{ gap: 16 }}>
          {/* Shop Header Identity Card */}
          <Card style={styles.shopCard}>
            {s.coverUrl ? (
              <Image source={{ uri: s.coverUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : null}

            <View style={styles.identityRow}>
              <View style={styles.logoWrapper}>
                {s.logoUrl ? (
                  <Image source={{ uri: s.logoUrl }} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <MaterialIcons name="storefront" size={36} color={colors.mutedSoft} />
                )}
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text style={typography.headlineSmall}>{s.name}</Text>
                {s.slug ? (
                  <Text style={[typography.bodyMedium, { color: colors.muted }]}>@{s.slug}</Text>
                ) : null}
              </View>
            </View>

            {s.description ? (
              <Text style={[typography.bodyMedium, { color: colors.ink, lineHeight: 22 }]}>
                {s.description}
              </Text>
            ) : null}

            {/* Contact details */}
            <View style={{ gap: 6, marginTop: 4 }}>
              {s.contact?.address ? (
                <View style={styles.contactRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.muted} />
                  <Text style={styles.contactText}>{s.contact.address}</Text>
                </View>
              ) : null}

              {s.contact?.phone ? (
                <View style={styles.contactRow}>
                  <MaterialIcons name="phone" size={16} color={colors.muted} />
                  <Text style={styles.contactText}>{s.contact.phone}</Text>
                </View>
              ) : null}

              {s.contact?.email ? (
                <View style={styles.contactRow}>
                  <MaterialIcons name="email" size={16} color={colors.muted} />
                  <Text style={styles.contactText}>{s.contact.email}</Text>
                </View>
              ) : null}
            </View>

            {/* Message shop button */}
            <MiroirButton
              label="Message shop"
              icon="chat-bubble-outline"
              isSecondary
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: s.id },
                })
              }
            />
          </Card>

          {/* Shop Catalog Collection */}
          <View style={{ gap: 12 }}>
            <View style={styles.collectionHeaderRow}>
              <Text style={typography.titleLarge}>Shop collection</Text>
              {products.data?.pagination ? (
                <Text style={styles.paginationText}>
                  {products.data.pagination.total} pieces
                </Text>
              ) : null}
            </View>

            {products.isLoading ? (
              <ActivityIndicator color={colors.accentStrong} />
            ) : products.data?.products.length === 0 ? (
              <Text style={[typography.bodyMedium, { color: colors.muted, textAlign: 'center', paddingVertical: 20 }]}>
                No products available in this shop yet.
              </Text>
            ) : (
              <View style={styles.productsGrid}>
                {products.data?.products.map(p => (
                  <View key={p.id} style={styles.gridColumn}>
                    <ProductCard product={p} />
                  </View>
                ))}
              </View>
            )}

            {/* Pagination Controls */}
            {products.data && products.data.pagination.totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <MiroirButton
                  label="Previous"
                  isSecondary
                  disabled={page <= 1}
                  onPress={() => setPage(page - 1)}
                />
                <Text style={typography.bodyMedium}>
                  Page {page} of {products.data.pagination.totalPages}
                </Text>
                <MiroirButton
                  label="Next"
                  isSecondary
                  disabled={page >= products.data.pagination.totalPages}
                  onPress={() => setPage(page + 1)}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  headerChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    marginBottom: 6,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12.5,
    color: colors.muted,
    flex: 1,
  },
  collectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridColumn: {
    width: '48%',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
