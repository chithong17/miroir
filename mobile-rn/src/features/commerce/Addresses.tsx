import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi, Location } from '../../api/commerce';
import { useSession, queryClient } from '../../stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  ModalSheet,
  Screen,
  StatusBadge,
  SurfaceIconButton,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';

function LocationPickerModal({
  title,
  visible,
  items,
  selectedCode,
  onSelect,
  onClose,
  isLoading = false,
}: {
  title: string;
  visible: boolean;
  items?: Location[];
  selectedCode?: string;
  onSelect: (item: Location) => void;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState('');

  const filtered = items?.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerBackdrop}>
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.pickerHeader}>
            <Text style={typography.titleLarge}>Select {title}</Text>
            <SurfaceIconButton icon="close" size={36} onPress={onClose} />
          </View>

          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color={colors.mutedSoft} />
            <TextInput
              placeholder={`Search ${title}...`}
              placeholderTextColor={colors.mutedSoft}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {!!search && (
              <Pressable onPress={() => setSearch('')}>
                <MaterialIcons name="cancel" size={18} color={colors.mutedSoft} />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color={colors.accentStrong} />
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 8, gap: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.length === 0 ? (
                <Text style={[typography.bodyMedium, { textAlign: 'center', paddingVertical: 20 }]}>
                  No {title} found.
                </Text>
              ) : (
                filtered.map(i => {
                  const isSelected = i.code === selectedCode;
                  return (
                    <Pressable
                      key={i.code}
                      onPress={() => {
                        onSelect(i);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.pickerItem,
                        isSelected && styles.pickerItemSelected,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextSelected,
                        ]}
                      >
                        {i.name}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check" size={18} color={colors.accentStrong} />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function Addresses() {
  const token = useSession(s => s.token);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');

  const [province, setProvince] = useState<Location | null>(null);
  const [district, setDistrict] = useState<Location | null>(null);
  const [ward, setWard] = useState<Location | null>(null);

  // Sub-picker modals
  const [pickingType, setPickingType] = useState<'province' | 'district' | 'ward' | null>(null);

  const addresses = useQuery({
    queryKey: ['addresses', token],
    queryFn: () => commerceApi.addresses(token),
    enabled: !!token,
  });

  const provinces = useQuery({
    queryKey: ['provinces'],
    queryFn: commerceApi.provinces,
  });

  const districts = useQuery({
    queryKey: ['districts', province?.code],
    queryFn: () => commerceApi.districts(province!.code),
    enabled: !!province?.code,
  });

  const wards = useQuery({
    queryKey: ['wards', district?.code],
    queryFn: () => commerceApi.wards(district!.code),
    enabled: !!district?.code,
  });

  const mutation = useMutation({
    mutationFn: async ({ action, id }: { action: string; id?: string }) => {
      if (!token) throw new Error('Please sign in.');
      if (action === 'default') return commerceApi.defaultAddress(token, id!);
      if (action === 'delete') return commerceApi.deleteAddress(token, id!);

      if (
        !province ||
        !district ||
        !ward ||
        !recipientName.trim() ||
        !phone.trim() ||
        !addressLine.trim()
      ) {
        throw new Error('Complete the recipient and delivery address.');
      }

      return commerceApi.createAddress(token, {
        label: label.trim() || 'Home',
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        provinceCode: province.code,
        districtCode: district.code,
        wardCode: ward.code,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setModalOpen(false);
      // Reset form
      setLabel('Home');
      setRecipientName('');
      setPhone('');
      setAddressLine('');
      setProvince(null);
      setDistrict(null);
      setWard(null);
    },
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Delivery addresses"
          showBack
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          rightAction={
            <SurfaceIconButton
              icon="add-location-alt"
              size={40}
              onPress={() => setModalOpen(true)}
            />
          }
        />
      }
      contentStyle={{ padding: 20, gap: 16 }}
    >
      <ErrorNotice
        message={
          addresses.error?.message ||
          provinces.error?.message ||
          districts.error?.message ||
          wards.error?.message
        }
      />

      {addresses.isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : addresses.data?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="location-on" size={48} color={colors.mutedSoft} />
          <Text style={typography.titleLarge}>No saved addresses yet</Text>
          <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
            Add an address to make checkout faster.
          </Text>
          <MiroirButton
            label="Add an address"
            icon="add-location-alt"
            onPress={() => setModalOpen(true)}
          />
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 2 }}>
            <Text style={typography.titleMedium}>Saved places</Text>
            <Text style={[typography.bodySmall, { color: colors.muted }]}>
              Choose a delivery address at checkout.
            </Text>
          </View>

          {addresses.data?.map(a => (
            <Card
              key={a.id}
              style={[
                styles.addressCard,
                a.isDefault && { borderColor: colors.mossSoft, borderWidth: 1.5 },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.labelPill}>
                    <Text style={styles.labelPillText}>{a.label || 'Address'}</Text>
                  </View>
                  {a.isDefault && (
                    <StatusBadge status="active" label="Default" />
                  )}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete address"
                  disabled={mutation.isPending}
                  onPress={() => mutation.mutate({ action: 'delete', id: a.id })}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <MaterialIcons name="delete-outline" size={22} color={colors.muted} />
                </Pressable>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={[typography.titleMedium, { color: colors.ink }]}>
                  {a.recipientName} · {a.phone}
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.muted }]} numberOfLines={3}>
                  {a.fullAddress}
                </Text>
              </View>

              {!a.isDefault && (
                <View style={{ marginTop: 4 }}>
                  <MiroirButton
                    label="Set as default"
                    isSecondary
                    busy={mutation.isPending}
                    onPress={() => mutation.mutate({ action: 'default', id: a.id })}
                  />
                </View>
              )}
            </Card>
          ))}

          <MiroirButton
            label="Add new address"
            icon="add"
            isSecondary
            onPress={() => setModalOpen(true)}
          />
        </View>
      )}

      {/* Add Address Modal Sheet */}
      <ModalSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a new address"
      >
        <Field
          label="Address label"
          placeholder="Home, Work, Apartment..."
          value={label}
          onChangeText={setLabel}
        />

        <Field
          label="Recipient name"
          placeholder="e.g. Nguyen Van A"
          value={recipientName}
          onChangeText={setRecipientName}
        />

        <Field
          label="Phone number"
          keyboardType="phone-pad"
          placeholder="0901234567"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Location Dropdown Pickers */}
        <View style={{ gap: 10 }}>
          <Text style={styles.pickerSectionLabel}>Delivery Location</Text>

          {/* Province Selector */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Province"
            onPress={() => setPickingType('province')}
            style={styles.locationSelectorRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorSub}>Province / City</Text>
              <Text style={[styles.selectorVal, !province && { color: colors.mutedSoft }]}>
                {province ? province.name : 'Select Province'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </Pressable>

          {/* District Selector */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select District"
            disabled={!province}
            onPress={() => setPickingType('district')}
            style={[styles.locationSelectorRow, !province && { opacity: 0.5 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorSub}>District</Text>
              <Text style={[styles.selectorVal, !district && { color: colors.mutedSoft }]}>
                {district ? district.name : 'Select District'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </Pressable>

          {/* Ward Selector */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Ward"
            disabled={!district}
            onPress={() => setPickingType('ward')}
            style={[styles.locationSelectorRow, !district && { opacity: 0.5 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorSub}>Ward / Commune</Text>
              <Text style={[styles.selectorVal, !ward && { color: colors.mutedSoft }]}>
                {ward ? ward.name : 'Select Ward'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </Pressable>
        </View>

        <Field
          label="Street address"
          placeholder="House number, building, street..."
          value={addressLine}
          onChangeText={setAddressLine}
        />

        <ErrorNotice message={mutation.error?.message} />

        <MiroirButton
          label="Save address"
          busy={mutation.isPending}
          onPress={() => mutation.mutate({ action: 'create' })}
        />
      </ModalSheet>

      {/* Nested Location Pickers */}
      <LocationPickerModal
        title="Province"
        visible={pickingType === 'province'}
        items={provinces.data}
        selectedCode={province?.code}
        isLoading={provinces.isLoading}
        onSelect={item => {
          setProvince(item);
          setDistrict(null);
          setWard(null);
        }}
        onClose={() => setPickingType(null)}
      />

      <LocationPickerModal
        title="District"
        visible={pickingType === 'district'}
        items={districts.data}
        selectedCode={district?.code}
        isLoading={districts.isLoading}
        onSelect={item => {
          setDistrict(item);
          setWard(null);
        }}
        onClose={() => setPickingType(null)}
      />

      <LocationPickerModal
        title="Ward"
        visible={pickingType === 'ward'}
        items={wards.data}
        selectedCode={ward?.code}
        isLoading={wards.isLoading}
        onSelect={item => setWard(item)}
        onClose={() => setPickingType(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
    gap: 12,
  },
  addressCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelPill: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  pickerSectionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.muted,
  },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: radii.field,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selectorSub: {
    fontSize: 11,
    color: colors.mutedSoft,
    fontWeight: '500',
  },
  selectorVal: {
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '600',
    marginTop: 2,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 33, 15, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginVertical: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: radii.field,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 4,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  pickerItemSelected: {
    backgroundColor: colors.accentSoft,
  },
  pickerItemText: {
    fontSize: 14.5,
    color: colors.ink,
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: colors.accentStrong,
  },
});
