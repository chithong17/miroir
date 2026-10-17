import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { commerceApi } from '../../src/api/commerce';
import { returnsApi } from '../../src/api/returns';
import { UploadAsset } from '../../src/api/contracts';
import { useSession, queryClient } from '../../src/stores/session';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  MiroirButton,
  QuantityStepper,
  Screen,
} from '../../src/components/ui';
import { ImageAttachments } from '../../src/components/ImageAttachments';
import { colors, typography } from '../../src/theme/tokens';
import { money } from '../../src/features/marketplace/Marketplace';

export default function CreateReturn() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const token = useSession(s => s.token);

  const orders = useQuery({
    queryKey: ['orders', token],
    queryFn: () => commerceApi.orders(token),
    enabled: !!token,
  });

  const order = orders.data?.find(o => o.id === orderId);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [images, setImages] = useState<UploadAsset[]>([]);
  const [fields, setFields] = useState({
    reason: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Order not found.');
      const items = order.items.flatMap(item => {
        const qty = quantities[`${item.productId}:${item.variantId}`] || 0;
        if (!Number.isInteger(qty) || qty < 0 || qty > item.quantity) {
          throw new Error(`Choose a valid return quantity for ${item.name}.`);
        }
        return qty > 0
          ? [{ productId: item.productId, variantId: item.variantId, quantity: qty }]
          : [];
      });

      if (!items.length) {
        throw new Error('Select at least one item to return.');
      }
      if (Object.values(fields).some(value => !value.trim())) {
        throw new Error('Complete the return reason and refund account.');
      }

      return returnsApi.create(token, orderId, { ...fields, items }, images);
    },
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: ['returns'] });
      router.replace(`/returns/${result.return.id}`);
    },
  });

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Request a return"
          subtitle={order ? `Order ${order.orderCode}` : undefined}
          showBack
          onBack={() => router.replace('/orders')}
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice message={orders.error?.message} />

      {order && (
        <Card style={styles.sectionCard}>
          <Text style={typography.titleMedium}>Choose items to return</Text>
          <Text style={[typography.bodySmall, { color: colors.muted }]}>
            Specify how many units of each item you wish to send back.
          </Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            {order.items.map(item => {
              const key = `${item.productId}:${item.variantId}`;
              const qty = quantities[key] || 0;

              return (
                <View key={key} style={styles.itemRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {[item.color, item.size].filter(Boolean).join(' · ')} (Purchased: {item.quantity})
                    </Text>
                    <Text style={styles.itemPrice}>{money(item.unitPrice)} each</Text>
                  </View>

                  <QuantityStepper
                    value={qty}
                    min={0}
                    max={item.quantity}
                    onChange={val => setQuantities(prev => ({ ...prev, [key]: val }))}
                  />
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Return Reason */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Reason for return</Text>
        <Field
          label="Why are you returning these items?"
          placeholder="e.g. Size didn't fit, wrong color, damaged package..."
          value={fields.reason}
          onChangeText={text => setFields(prev => ({ ...prev, reason: text }))}
          multiline
        />
      </Card>

      {/* Refund Bank Account */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Refund Bank Account</Text>
        <Field
          label="Bank Name"
          placeholder="e.g. Vietcombank, MB Bank, Techcombank"
          value={fields.bankName}
          onChangeText={text => setFields(prev => ({ ...prev, bankName: text }))}
        />
        <Field
          label="Account Number"
          keyboardType="number-pad"
          placeholder="e.g. 1029384756"
          value={fields.accountNumber}
          onChangeText={text => setFields(prev => ({ ...prev, accountNumber: text }))}
        />
        <Field
          label="Account Holder"
          placeholder="e.g. NGUYEN VAN A"
          value={fields.accountHolder}
          onChangeText={text => setFields(prev => ({ ...prev, accountHolder: text }))}
        />
      </Card>

      {/* Proof of issue attachments */}
      <Card style={styles.sectionCard}>
        <Text style={typography.titleMedium}>Proof of issue</Text>
        <Text style={[typography.bodySmall, { color: colors.muted }]}>
          Attach up to 3 photos of the items and tag (optional but recommended).
        </Text>
        <ImageAttachments
          images={images}
          onChange={setImages}
          max={3}
          disabled={mutation.isPending}
        />
      </Card>

      <ErrorNotice message={mutation.error?.message} />

      <MiroirButton
        label="Submit return request"
        icon="send"
        busy={mutation.isPending}
        disabled={!order}
        onPress={() => mutation.mutate()}
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
});
