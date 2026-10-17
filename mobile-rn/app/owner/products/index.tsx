import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerProductsApi } from '../../../src/api/ownerProducts';
import { useOwner } from '../../../src/stores/owner';
import { queryClient } from '../../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  MiroirButton,
  Screen,
  SelectionChip,
  StatusBadge,
} from '../../../src/components/ui';
import { money } from '../../../src/features/marketplace/Marketplace';
import { colors, radii, typography } from '../../../src/theme/tokens';

export default function Products() {
  const token = useOwner(s => s.token);
  const [status, setStatus] = useState('');

  const products = useQuery({
    queryKey: ['owner', token, 'products', status],
    queryFn: () => ownerProductsApi.list(token, status),
  });

  const action = useMutation({
    mutationFn: ({
      id,
      action: act,
    }: {
      id: string;
      action: 'archive' | 'restore' | 'trash';
    }) => ownerProductsApi.action(token, id, act),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['owner', token, 'products'] }),
  });

  const filters = [
    { label: 'All products', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
    { label: 'Trashed', value: 'trashed' },
  ];

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Shop products"
          showBack
          onBack={() => router.replace('/owner')}
          rightAction={
            <MiroirButton
              label="Create product"
              icon="add"
              onPress={() => router.push('/owner/products/edit')}
            />
          }
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      {/* Horizontal Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {filters.map(f => (
          <SelectionChip
            key={f.value}
            label={f.label}
            selected={status === f.value}
            onPress={() => setStatus(f.value)}
          />
        ))}
      </ScrollView>

      <ErrorNotice
        message={products.error?.message || action.error?.message}
        retry={() => void products.refetch()}
      />

      {products.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : products.data?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inventory-2" size={54} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>No products in this view</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Add clothing items, set size variants, and publish to the marketplace.
          </Text>
          <MiroirButton
            label="Create product"
            icon="add"
            onPress={() => router.push('/owner/products/edit')}
          />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {products.data?.map(p => {
            const isArchivedOrTrashed = ['archived', 'trashed'].includes(p.status);

            return (
              <Card key={p.id} style={styles.productCard}>
                <View style={styles.productRow}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <MaterialIcons name="checkroom" size={28} color={colors.mutedSoft} />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.productPrice}>{money(p.price)}</Text>
                    <StatusBadge status={p.status} />
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                  <View style={{ flex: 1.2 }}>
                    <MiroirButton
                      label="Edit product"
                      icon="edit"
                      isSecondary
                      onPress={() =>
                        router.push({
                          pathname: '/owner/products/edit',
                          params: { id: p.id },
                        })
                      }
                    />
                  </View>

                  {isArchivedOrTrashed ? (
                    <View style={{ flex: 1 }}>
                      <MiroirButton
                        label="Restore to draft"
                        isSecondary
                        busy={action.isPending}
                        onPress={() => action.mutate({ id: p.id, action: 'restore' })}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <MiroirButton
                        label="Archive"
                        isSecondary
                        busy={action.isPending}
                        onPress={() => action.mutate({ id: p.id, action: 'archive' })}
                      />
                    </View>
                  )}

                  {p.status !== 'trashed' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Move to trash"
                      disabled={action.isPending}
                      onPress={() => action.mutate({ id: p.id, action: 'trash' })}
                      style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.6 }]}
                    >
                      <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    gap: 8,
    paddingVertical: 2,
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
  productCard: {
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  trashBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
