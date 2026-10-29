import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerApi } from '../../src/api/owner';
import { useOwner } from '../../src/stores/owner';
import { WorkQueue } from '../../src/features/owner/WorkQueue';
import {
  AppHeader,
  Card,
  ErrorNotice,
  GlassSurface,
  MiroirButton,
  Screen,
  SelectionChip,
  StatusBadge,
  SurfaceIconButton,
} from '../../src/components/ui';
import { colors, radii, typography } from '../../src/theme/tokens';

type OwnerTab = 'overview' | 'products' | 'analytics' | 'profile';

export default function OwnerCenter() {
  const owner = useOwner();
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');

  const shops = useQuery({
    queryKey: ['owner', owner.token, 'shops'],
    queryFn: () => ownerApi.shops(owner.token),
    enabled: !!owner.token,
  });

  const shop = shops.data?.[0];
  const isPremium = !!owner.owner?.subscription?.isPremium || owner.owner?.subscription?.status === 'active';

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Owner Center"
          subtitle={shop?.name || owner.owner?.name || 'Shop owner'}
          showBack
          onBack={() => router.replace('/account')}
          rightAction={
            <StatusBadge
              status={isPremium ? 'active' : 'pending'}
              label={isPremium ? 'Pro' : 'Standard'}
            />
          }
        />
      }
      contentStyle={{ padding: 18, gap: 16 }}
    >
      <ErrorNotice
        message={owner.error || shops.error?.message}
        retry={() => void shops.refetch()}
      />

      {/* Segmented Tabs Header */}
      <View style={styles.tabsHeader}>
        <SelectionChip
          label="Overview"
          selected={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <SelectionChip
          label="Products"
          selected={activeTab === 'products'}
          onPress={() => setActiveTab('products')}
        />
        <SelectionChip
          label="Analytics"
          selected={activeTab === 'analytics'}
          onPress={() => setActiveTab('analytics')}
        />
        <SelectionChip
          label="Profile"
          selected={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
      </View>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <View style={{ gap: 16 }}>
          <WorkQueue />
          {/* Shop Banner Card */}
          {shops.isLoading ? (
            <ActivityIndicator color={colors.accentStrong} />
          ) : shop ? (
            <GlassSurface radius={24} padding={18}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={typography.headlineSmall}>{shop.name}</Text>
                  <Text style={[typography.bodyMedium, { color: colors.muted }]} numberOfLines={2}>
                    {shop.description || 'Welcome to your shop management center.'}
                  </Text>
                  {shop.contact?.address && (
                    <Text style={[typography.bodySmall, { marginTop: 4 }]}>
                      {shop.contact.address}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ marginTop: 14 }}>
                <MiroirButton
                  label="Edit shop"
                  icon="edit"
                  isSecondary
                  onPress={() => router.push('/owner/shop')}
                />
              </View>
            </GlassSurface>
          ) : (
            <Card style={{ alignItems: 'center', padding: 24, gap: 12 }}>
              <MaterialIcons name="storefront" size={48} color={colors.mutedSoft} />
              <Text style={typography.titleLarge}>No shop set up yet</Text>
              <Text style={[typography.bodyMedium, { textAlign: 'center' }]}>
                Create your shop profile to start publishing products.
              </Text>
              <MiroirButton
                label="Create shop"
                icon="add-business"
                onPress={() => router.push('/owner/shop')}
              />
            </Card>
          )}

          {/* Quick Workspace Actions Grid */}
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Shop Workspace</Text>
            <View style={styles.grid}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Shop orders"
                onPress={() => router.push('/owner/orders')}
                style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.8 }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#E4F1D7' }]}>
                  <MaterialIcons name="shopping-bag" size={24} color="#3D6325" />
                </View>
                <Text style={styles.gridLabel}>Shop orders</Text>
                <Text style={styles.gridSub}>Fulfillment</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Customer messages"
                onPress={() => router.push('/owner/chat')}
                style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.8 }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#E8F0FE' }]}>
                  <MaterialIcons name="chat" size={24} color="#1967D2" />
                </View>
                <Text style={styles.gridLabel}>Customer messages</Text>
                <Text style={styles.gridSub}>Conversations</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Shop returns & refunds"
                onPress={() => router.push('/owner/returns')}
                style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.8 }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="assignment-return" size={24} color="#92400E" />
                </View>
                <Text style={styles.gridLabel}>Shop returns & refunds</Text>
                <Text style={styles.gridSub}>Disputes</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Shop notifications"
                onPress={() => router.push('/owner/notifications')}
                style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.8 }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialIcons name="notifications" size={24} color="#6B21A8" />
                </View>
                <Text style={styles.gridLabel}>Shop notifications</Text>
                <Text style={styles.gridSub}>Alerts</Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Links Cluster for backward compatibility & easy access */}
          <View style={{ gap: 8, marginTop: 4 }}>
            <MiroirButton
              label="Manage products"
              icon="inventory"
              isSecondary
              onPress={() => router.push('/owner/products')}
            />
            <MiroirButton
              label="Dashboard & analytics"
              icon="insights"
              isSecondary
              onPress={() => router.push('/owner/dashboard')}
            />
            <MiroirButton
              label="Shop access"
              icon="workspace-premium"
              isSecondary
              onPress={() => router.push('/owner/payments')}
            />
          </View>
        </View>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <View style={{ gap: 16 }}>
          <GlassSurface radius={24} padding={18}>
            <Text style={typography.titleLarge}>Product Management</Text>
            <Text style={[typography.bodyMedium, { color: colors.muted, marginVertical: 6 }]}>
              Create, edit, and organize variants, prices, and stock levels for your catalog.
            </Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              <MiroirButton
                label="Manage products"
                icon="list"
                onPress={() => router.push('/owner/products')}
              />
              <MiroirButton
                label="Create new product"
                icon="add"
                isSecondary
                onPress={() => router.push('/owner/products/new')}
              />
            </View>
          </GlassSurface>
        </View>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 'analytics' && (
        <View style={{ gap: 16 }}>
          <GlassSurface radius={24} padding={18}>
            <Text style={typography.titleLarge}>Dashboard & Analytics</Text>
            <Text style={[typography.bodyMedium, { color: colors.muted, marginVertical: 6 }]}>
              Explore real-time data on product views, order volume, payments, and customer feedback.
            </Text>
            <View style={{ marginTop: 8 }}>
              <MiroirButton
                label="Dashboard & analytics"
                icon="insights"
                onPress={() => router.push('/owner/dashboard')}
              />
            </View>
          </GlassSurface>
        </View>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <View style={{ gap: 16 }}>
          <GlassSurface radius={24} padding={18}>
            <Text style={typography.titleLarge}>Owner Account</Text>
            <View style={{ gap: 4, marginTop: 8 }}>
              <Text style={typography.bodyLarge}>{owner.owner?.name}</Text>
              <Text style={[typography.bodyMedium, { color: colors.muted }]}>
                {owner.owner?.email}
              </Text>
              <Text style={[typography.bodySmall, { marginTop: 4 }]}>
                Subscription status:{' '}
                <Text style={{ fontWeight: '700', color: isPremium ? colors.success : colors.ink }}>
                  {owner.owner?.subscription?.status || 'standard'}
                </Text>
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 18 }}>
              <MiroirButton
                label="Shop access"
                icon="workspace-premium"
                isSecondary
                onPress={() => router.push('/owner/payments')}
              />
              <MiroirButton
                label="Refresh shop access"
                icon="refresh"
                isSecondary
                onPress={() => void owner.refresh()}
              />
              <MiroirButton
                label="Customer account"
                icon="switch-account"
                isSecondary
                onPress={() => router.replace('/account')}
              />
              <MiroirButton
                label="Sign out owner"
                icon="logout"
                isSecondary
                onPress={() => void owner.logout()}
              />
              <MiroirButton label="Delete shop owner account" icon="delete-forever" isSecondary onPress={() => router.push('/delete-owner-account')}/>
            </View>
          </GlassSurface>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsHeader: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.ink,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  gridSub: {
    fontSize: 11.5,
    color: colors.muted,
  },
});
