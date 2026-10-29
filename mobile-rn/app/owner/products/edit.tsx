import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerProductsApi } from '../../../src/api/ownerProducts';
import { useOwner } from '../../../src/stores/owner';
import { queryClient } from '../../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  Screen,
  SelectionChip,
} from '../../../src/components/ui';
import { UploadImage } from '../../../src/features/owner/UploadImage';
import { parseVariants, VariantDraft } from '../../../src/features/owner/productDraft';
import { colors, radii, typography } from '../../../src/theme/tokens';

const initial = {
  name: '',
  category: '',
  description: '',
  price: '',
  gender: 'unisex',
  availability: 'in_stock',
  status: 'draft',
  colors: '',
  sizes: '',
  styleTags: '',
  occasionTags: '',
  material: '',
  fitType: '',
  imageUrl: '',
  imagePublicId: '',
};

export default function ProductEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const token = useOwner(s => s.token);
  const [fields, setFields] = useState(initial);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [loaded, setLoaded] = useState('');

  const product = useQuery({
    queryKey: ['owner', token, 'product', id],
    queryFn: () => ownerProductsApi.detail(token, id!),
    enabled: !!id,
  });

  useEffect(() => {
    const p = product.data;
    if (!p || loaded === p.id) return;
    const timer = setTimeout(() => {
    setFields({
      ...initial,
      ...Object.fromEntries(
        Object.keys(initial).map(key => {
          const value = p[key as keyof typeof p];
          return [key, Array.isArray(value) ? value.join(', ') : String(value ?? '')];
        })
      ),
    });
    setVariants((p.variants || []).map(v => ({ ...v, stockQuantity: String(v.stockQuantity) })));
    setLoaded(p.id);
    }, 0);
    return () => clearTimeout(timer);
  }, [product.data, loaded]);

  const save = useMutation({
    mutationFn: async () => {
      for (const key of ['name', 'category', 'description']) {
        if (!fields[key as keyof typeof fields].trim()) {
          throw new Error(`Enter ${key}.`);
        }
      }
      const price = Number(fields.price);
      if (!fields.price.trim() || !Number.isFinite(price) || price < 0) {
        throw new Error('Enter a valid price.');
      }
      const payload: Record<string, unknown> = { ...fields, price };
      for (const key of ['colors', 'sizes', 'styleTags', 'occasionTags'] as const) {
        payload[key] = fields[key]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (variants.length || product.data?.variants.length) {
        payload.variants = parseVariants(variants);
      }
      return ownerProductsApi.save(token, id, payload);
    },
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: ['owner', token, 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['owner', token, 'product', id] });
      if (!id && result.product?.id) {
        router.replace({ pathname: '/owner/products/edit', params: { id: result.product.id } });
      }
    },
  });

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title={id ? 'Edit product' : 'New product'}
          showBack
          onBack={() => router.replace('/owner/products')}
        />
      }
      contentStyle={{ padding: 18, gap: 18 }}
    >
      <ErrorNotice message={product.error?.message} />

      {/* Image Upload */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Product Image</Text>
        <UploadImage
          label="Upload product photo"
          uri={fields.imageUrl}
          onUpload={image => setFields(prev => ({ ...prev, ...image }))}
        />
      </Card>

      {/* Basic Information */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Basic Information</Text>
        <Field
          label="Product Name"
          placeholder="e.g. Silk Wrap Midi Dress"
          value={fields.name}
          onChangeText={val => setFields(prev => ({ ...prev, name: val }))}
        />
        <Field
          label="Category"
          placeholder="e.g. Dresses, Tops, Outerwear"
          value={fields.category}
          onChangeText={val => setFields(prev => ({ ...prev, category: val }))}
        />
        <Field
          label="Price (VND)"
          keyboardType="numeric"
          placeholder="e.g. 450000"
          value={fields.price}
          onChangeText={val => setFields(prev => ({ ...prev, price: val }))}
        />
        <Field
          label="Description"
          placeholder="Details about cut, styling notes, and fabric feel..."
          value={fields.description}
          onChangeText={val => setFields(prev => ({ ...prev, description: val }))}
          multiline
        />
      </Card>

      {/* Gender & Visibility Selectors */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Target Gender</Text>
        <View style={styles.chipsRow}>
          {['female', 'male', 'unisex'].map(g => (
            <SelectionChip
              key={g}
              label={g}
              selected={fields.gender === g}
              onPress={() => setFields(prev => ({ ...prev, gender: g }))}
            />
          ))}
        </View>

        <Text style={[typography.titleMedium, { marginTop: 8 }]}>Catalog Visibility</Text>
        <View style={styles.chipsRow}>
          {['draft', 'published'].map(s => (
            <SelectionChip
              key={s}
              label={s}
              selected={fields.status === s}
              onPress={() => setFields(prev => ({ ...prev, status: s }))}
            />
          ))}
        </View>
      </Card>

      {/* Specifications & Tags */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Attributes & Fit</Text>
        <Field
          label="Colors (comma separated)"
          placeholder="e.g. Olive Green, Beige, Black"
          value={fields.colors}
          onChangeText={val => setFields(prev => ({ ...prev, colors: val }))}
        />
        <Field
          label="Sizes (comma separated)"
          placeholder="e.g. S, M, L, XL"
          value={fields.sizes}
          onChangeText={val => setFields(prev => ({ ...prev, sizes: val }))}
        />
        <Field
          label="Material"
          placeholder="e.g. 100% Linen, Silk, Cotton"
          value={fields.material}
          onChangeText={val => setFields(prev => ({ ...prev, material: val }))}
        />
        <Field
          label="Fit Type"
          placeholder="e.g. Regular, Slim, Oversized"
          value={fields.fitType}
          onChangeText={val => setFields(prev => ({ ...prev, fitType: val }))}
        />
        <Field
          label="Style Tags"
          placeholder="e.g. minimalist, vintage, evening"
          value={fields.styleTags}
          onChangeText={val => setFields(prev => ({ ...prev, styleTags: val }))}
        />
      </Card>

      {/* Variants & Stock */}
      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.titleMedium}>Variants & Stock</Text>
            <Text style={[typography.bodySmall, { color: colors.muted }]}>
              Define individual SKUs, size/color combinations, and inventory counts.
            </Text>
          </View>
          <MiroirButton
            label="Add variant"
            icon="add"
            isSecondary
            onPress={() =>
              setVariants([
                ...variants,
                { sku: '', color: '', size: '', stockQuantity: '0', active: true },
              ])
            }
          />
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          {variants.map((v, i) => (
            <Card key={v.id || `new-${i}`} style={styles.variantCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.variantCardHeader}>Variant #{i + 1}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove variant"
                  onPress={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </Pressable>
              </View>

              <View style={styles.variantFieldsRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="SKU"
                    placeholder="e.g. DRESS-GRN-M"
                    value={v.sku}
                    onChangeText={text => updateVariant(i, { sku: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Stock"
                    keyboardType="number-pad"
                    placeholder="e.g. 15"
                    value={v.stockQuantity}
                    onChangeText={text => updateVariant(i, { stockQuantity: text })}
                  />
                </View>
              </View>

              <View style={styles.variantFieldsRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Color"
                    placeholder="e.g. Olive"
                    value={v.color}
                    onChangeText={text => updateVariant(i, { color: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Size"
                    placeholder="e.g. M"
                    value={v.size}
                    onChangeText={text => updateVariant(i, { size: text })}
                  />
                </View>
              </View>

              <SelectionChip
                label={v.active ? 'Active in catalog' : 'Inactive'}
                selected={v.active}
                onPress={() => updateVariant(i, { active: !v.active })}
              />
            </Card>
          ))}
        </View>
      </Card>

      <ErrorNotice message={save.error?.message} />

      {save.isSuccess && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ Product saved successfully.</Text>
        </View>
      )}

      <MiroirButton
        label="Save product"
        icon="check"
        busy={save.isPending}
        disabled={!!id && (product.isPending || product.isError)}
        onPress={() => save.mutate()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  variantCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  variantCardHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  variantFieldsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  successBox: {
    backgroundColor: colors.accentSoft,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D6325',
  },
});
