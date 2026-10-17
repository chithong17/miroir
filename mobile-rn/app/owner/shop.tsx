import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerApi } from '../../src/api/owner';
import { useOwner } from '../../src/stores/owner';
import { queryClient } from '../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  Screen,
} from '../../src/components/ui';
import { UploadImage } from '../../src/features/owner/UploadImage';
import { colors, radii, typography } from '../../src/theme/tokens';

export default function ShopEditor() {
  const token = useOwner(s => s.token);
  const [fields, setFields] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    coverUrl: '',
    address: '',
    email: '',
    phone: '',
  });

  const shops = useQuery({
    queryKey: ['owner', token, 'shops'],
    queryFn: () => ownerApi.shops(token),
  });

  const shop = shops.data?.[0];
  const loadedId = useRef('');

  useEffect(() => {
    if (shop && loadedId.current !== shop.id) {
      loadedId.current = shop.id;
      setFields({
        name: shop.name,
        slug: shop.slug || '',
        description: shop.description || '',
        logoUrl: shop.logoUrl || '',
        coverUrl: shop.coverUrl || '',
        address: shop.contact?.address || '',
        email: shop.contact?.email || '',
        phone: shop.contact?.phone || '',
      });
    }
  }, [shop]);

  const save = useMutation({
    mutationFn: async () => {
      if (!fields.name.trim()) throw new Error('Enter a shop name.');
      return ownerApi.saveShop(token, shop?.id, {
        name: fields.name.trim(),
        slug: fields.slug.trim(),
        description: fields.description.trim(),
        logoUrl: fields.logoUrl,
        coverUrl: fields.coverUrl,
        contact: {
          address: fields.address.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner', token, 'shops'] }),
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title={shop ? 'Edit shop' : 'Create shop'}
          showBack
          onBack={() => router.replace('/owner')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice message={shops.error?.message} />

      {/* Visual Identity Section */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Visual Branding</Text>
        <UploadImage
          label="Upload shop logo"
          uri={fields.logoUrl}
          onUpload={image => setFields(prev => ({ ...prev, logoUrl: image.imageUrl }))}
        />
        <UploadImage
          label="Upload shop cover banner"
          uri={fields.coverUrl}
          onUpload={image => setFields(prev => ({ ...prev, coverUrl: image.imageUrl }))}
        />
      </Card>

      {/* Shop Details */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Shop Profile</Text>
        <Field
          label="Shop Name"
          placeholder="e.g. Atelier Nabii"
          value={fields.name}
          onChangeText={val => setFields(prev => ({ ...prev, name: val }))}
        />
        <Field
          label="Shop Slug"
          placeholder="e.g. nabii"
          autoCapitalize="none"
          value={fields.slug}
          onChangeText={val => setFields(prev => ({ ...prev, slug: val }))}
        />
        <Field
          label="Shop Description"
          placeholder="Tell customers about your brand ethos, cuts, and craftsmanship..."
          value={fields.description}
          onChangeText={val => setFields(prev => ({ ...prev, description: val }))}
          multiline
        />
      </Card>

      {/* Contact Details */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Contact & Location</Text>
        <Field
          label="Boutique Address"
          placeholder="e.g. 120 Pasteur, Ben Nghe, District 1, HCMC"
          value={fields.address}
          onChangeText={val => setFields(prev => ({ ...prev, address: val }))}
        />
        <Field
          label="Contact Email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="contact@atelier.com"
          value={fields.email}
          onChangeText={val => setFields(prev => ({ ...prev, email: val }))}
        />
        <Field
          label="Contact Phone"
          keyboardType="phone-pad"
          placeholder="e.g. 0909123456"
          value={fields.phone}
          onChangeText={val => setFields(prev => ({ ...prev, phone: val }))}
        />
      </Card>

      <ErrorNotice message={save.error?.message} />

      {save.isSuccess && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ Shop profile updated successfully.</Text>
        </View>
      )}

      <MiroirButton
        label="Save shop"
        icon="check"
        busy={save.isPending}
        disabled={shops.isPending || shops.isError}
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
