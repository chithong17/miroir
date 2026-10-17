import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { CatalogProduct, CatalogVariant } from '../../api/catalog';
import { commerceApi } from '../../api/commerce';
import { useSession, queryClient } from '../../stores/session';
import {
  ErrorNotice,
  MiroirButton,
  ModalSheet,
  QuantityStepper,
  SelectionChip,
} from '../../components/ui';
import { colors, typography } from '../../theme/tokens';

export function AddToCartSheet({
  visible,
  onClose,
  product,
}: {
  visible: boolean;
  onClose: () => void;
  product: CatalogProduct;
}) {
  const token = useSession(s => s.token);
  const variants = product.variants?.filter(v => v.active !== false && v.stockQuantity > 0) || [];
  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(
    variants[0] || null
  );
  const [quantity, setQuantity] = useState(1);

  const add = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Please sign in to add items to your bag.');
      if (!selectedVariant) throw new Error('Choose a size and color.');
      if (quantity < 1 || quantity > selectedVariant.stockQuantity) {
        throw new Error('Choose a valid quantity within available stock.');
      }
      return commerceApi.add(token, product.id, selectedVariant.id, quantity);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Choose a variant">
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={typography.titleMedium}>{product.name}</Text>
          <Text style={[typography.bodySmall, { color: colors.muted }]}>
            Select your preferred size and color
          </Text>
        </View>

        {variants.length === 0 ? (
          <Text style={[typography.bodyMedium, { color: colors.error }]}>
            This item is currently out of stock.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Available variants</Text>
            <View style={styles.variantWrap}>
              {variants.map(v => {
                const isSelected = selectedVariant?.id === v.id;
                const label = [v.color, v.size].filter(Boolean).join(' · ') || v.sku;
                return (
                  <SelectionChip
                    key={v.id}
                    label={`${label} (${v.stockQuantity})`}
                    selected={isSelected}
                    onPress={() => {
                      setSelectedVariant(v);
                      if (quantity > v.stockQuantity) {
                        setQuantity(1);
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {selectedVariant && (
          <View style={styles.quantityRow}>
            <View style={{ gap: 2 }}>
              <Text style={styles.sectionLabel}>Quantity</Text>
              <Text style={[typography.bodySmall, { color: colors.mutedSoft }]}>
                {selectedVariant.stockQuantity} in stock
              </Text>
            </View>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={selectedVariant.stockQuantity}
            />
          </View>
        )}

        <ErrorNotice message={add.error?.message} />

        {add.isSuccess ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ Added to your bag</Text>
            </View>
            <MiroirButton
              label="View bag"
              isSecondary
              onPress={() => {
                onClose();
                router.push('/cart');
              }}
            />
          </View>
        ) : (
          <MiroirButton
            label="Add to bag"
            icon="shopping-bag"
            busy={add.isPending}
            disabled={!variants.length}
            onPress={() => add.mutate()}
          />
        )}
      </View>
    </ModalSheet>
  );
}

// Backward-compatible default export
export function AddToCart({ product }: { product: CatalogProduct }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const variants = product.variants?.filter(v => v.active !== false && v.stockQuantity > 0) || [];

  return (
    <View style={styles.container}>
      <MiroirButton
        label={variants.length ? 'Add to bag' : 'Out of stock'}
        icon="shopping-bag"
        disabled={variants.length === 0}
        onPress={() => setSheetOpen(true)}
      />
      <AddToCartSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={product}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  variantWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  successBox: {
    backgroundColor: colors.accentSoft,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  successText: {
    color: '#3D6325',
    fontWeight: '700',
    fontSize: 14,
  },
});
