import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { catalogApi, CatalogProduct } from '../../api/catalog';
import { useSession } from '../../stores/session';
import {
  ErrorNotice,
  Field,
  GlassSurface,
  MiroirButton,
  Screen,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';
import { useTryOn } from '../try-on/state';

export const money = (value: number) => {
  const rounded = Math.round(Number(value) || 0).toString();
  const buffer: string[] = [];
  for (let i = 0; i < rounded.length; i++) {
    const reverseIndex = rounded.length - i;
    buffer.push(rounded[i]);
    if (reverseIndex > 1 && reverseIndex % 3 === 1) {
      buffer.push('.');
    }
  }
  return `${buffer.join('')} VND`;
};

const CATEGORIES = ['All', 'Casual', 'Party', 'Minimal', 'Street', 'Formal'];

export function ProductCard({
  product,
  onOpen,
}: {
  product: CatalogProduct;
  onOpen?: () => void;
}) {
  const handleOpen = onOpen || (() => router.push(`/product/${product.id}`));

  return (
    <View style={marketStyles.productCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.name}
        onPress={handleOpen}
        style={({ pressed }) => [pressed && { opacity: 0.92 }]}
      >
        <View style={marketStyles.productImageWrapper}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={marketStyles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={marketStyles.imagePlaceholder}>
              <MaterialIcons name="checkroom" size={36} color={colors.mutedSoft} />
            </View>
          )}
        </View>

        <View style={{ marginTop: 9, minHeight: 76 }}>
          <Text numberOfLines={2} style={marketStyles.productName}>
            {product.name}
          </Text>
          <Text numberOfLines={1} style={marketStyles.shopName}>
            {product.shop?.name || 'Shop'}
          </Text>
          <Text numberOfLines={1} style={marketStyles.price}>
            {money(product.price)}
          </Text>
        </View>
      </Pressable>

      <MiroirButton
        label="Try on"
        icon="checkroom"
        onPress={() => {
          useTryOn.getState().prefill(product);
          router.navigate('/try-on');
        }}
        style={marketStyles.tryOnButton}
      />
    </View>
  );
}

export function Marketplace({initialView='products'}:{initialView?:'products'|'outfits'|'favorites'}) {
  const { token, user } = useSession();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [view, setView] = useState<'products' | 'outfits' | 'favorites'>(initialView);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [gender, setGender] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    gender: '',
    minPrice: '',
    maxPrice: '',
  });
  const [page, setPage] = useState(1);
  const [filterError, setFilterError] = useState('');

  function applyFilters(categoryOverride?: string) {
    const minNum = minPrice.trim() ? Number(minPrice) : undefined;
    const maxNum = maxPrice.trim() ? Number(maxPrice) : undefined;
    if (
      (minNum !== undefined && (!Number.isFinite(minNum) || minNum < 0)) ||
      (maxNum !== undefined && (!Number.isFinite(maxNum) || maxNum < 0)) ||
      (minNum !== undefined && maxNum !== undefined && minNum > maxNum)
    ) {
      setFilterError('Enter a valid price range.');
      return;
    }

    setFilterError('');
    const resolvedCat =
      categoryOverride !== undefined
        ? categoryOverride === 'All'
          ? ''
          : categoryOverride
        : selectedCategoryIndex === 0
        ? categoryInput
        : CATEGORIES[selectedCategoryIndex];

    setAppliedFilters({
      search,
      category: resolvedCat,
      gender,
      minPrice,
      maxPrice,
    });
    setPage(1);
    setShowFilters(false);
  }

  function handleCategorySelect(index: number) {
    setSelectedCategoryIndex(index);
    applyFilters(CATEGORIES[index]);
  }

  const result = useQuery({
    queryKey: ['catalog', view, appliedFilters, page, token],
    queryFn: async () => {
      if (view === 'favorites') {
        return {
          products: await catalogApi.favorites(token),
          pagination: { page: 1, totalPages: 1, total: 0 },
        };
      }
      return view === 'outfits'
        ? catalogApi.outfits({ ...appliedFilters, page }, token)
        : catalogApi.products({ ...appliedFilters, page }, token);
    },
    enabled: view !== 'favorites' || !!token,
  });

  const greetingTitle = user?.name
    ? `Hello, ${user.name.split(' ')[0]}`
    : 'Hello';
  const avatarLabel = user?.name ? user.name[0].toUpperCase() : 'M';
  const totalCount = result.data?.pagination?.total ?? (result.data && 'products' in result.data ? result.data.products.length : 0);

  return (
    <Screen contentStyle={marketStyles.content}>
      {initialView === 'favorites' && <MiroirButton label="Account" icon="chevron-left" isSecondary onPress={() => router.back()}/>}
      {/* 1. Header with greeting and action cluster */}
      <View style={marketStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={marketStyles.greetingTitle}>{greetingTitle}</Text>
          <Text style={marketStyles.welcomeSub}>
            Welcome back to MIROIR
          </Text>
        </View>

        {/* Action cluster: Messages, Notifications, Bag */}
        <View style={marketStyles.actionCluster}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Messages"
            onPress={() => router.push('/chat')}
            style={marketStyles.clusterBtn}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={20}
              color={colors.ink}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
            style={marketStyles.clusterBtn}
          >
            <MaterialIcons
              name="notifications-none"
              size={20}
              color={colors.ink}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My bag"
            onPress={() => router.push('/cart')}
            style={marketStyles.clusterBtn}
          >
            <MaterialIcons
              name="shopping-bag"
              size={20}
              color={colors.ink}
            />
          </Pressable>
        </View>

        {/* Avatar bubble */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account"
          onPress={() => router.navigate('/account')}
          style={marketStyles.avatarBubble}
        >
          <Text style={marketStyles.avatarText}>{avatarLabel}</Text>
        </Pressable>
      </View>

      {/* 2. Search & Filter Bar */}
      <GlassSurface radius={24} padding={12} blurIntensity={18}>
        <View style={marketStyles.searchRow}>
          <View style={marketStyles.searchInputWrapper}>
            <MaterialIcons
              name="search"
              size={20}
              color={colors.mutedSoft}
              style={{ marginLeft: 14 }}
            />
            <TextInput
              placeholder="Search products"
              placeholderTextColor={colors.mutedSoft}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={() => applyFilters()}
              style={marketStyles.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showFilters ? 'Hide filters' : 'Filters'}
            onPress={() => setShowFilters(!showFilters)}
            style={marketStyles.filterToggle}
          >
            <MaterialIcons
              name={showFilters ? 'close' : 'tune'}
              size={22}
              color={colors.ink}
            />
          </Pressable>
        </View>

        {showFilters && (
          <View style={marketStyles.expandedFilters}>
            <Field
              label="Category"
              value={categoryInput}
              placeholder="e.g. Linen shirt, Dress"
              onChangeText={setCategoryInput}
            />
            <Field
              label="Gender"
              value={gender}
              placeholder="female / male / unisex"
              onChangeText={setGender}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Minimum price"
                  value={minPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  onChangeText={setMinPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Maximum price"
                  value={maxPrice}
                  keyboardType="numeric"
                  placeholder="1000000"
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>
            <ErrorNotice message={filterError} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <MiroirButton
                  label="Apply filters"
                  icon="tune"
                  onPress={() => applyFilters()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MiroirButton
                  label="Clear"
                  isSecondary
                  onPress={() => {
                    setSearch('');
                    setCategoryInput('');
                    setGender('');
                    setMinPrice('');
                    setMaxPrice('');
                    setFilterError('');
                    setSelectedCategoryIndex(0);
                    setAppliedFilters({
                      search: '',
                      category: '',
                      gender: '',
                      minPrice: '',
                      maxPrice: '',
                    });
                    setPage(1);
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </GlassSurface>

      {/* 3. Shopping Promo Banner matching Flutter */}
      <View style={marketStyles.promoCard}>
        <Image
          source={require('../../../assets/images/shop-2.png')}
          style={[StyleSheet.absoluteFill, {width: '100%', height: '100%'}]}
          resizeMode="cover"
        />
      </View>

      {/* 4. Horizontal Categories matching Flutter ChoiceChips */}
      <View style={marketStyles.categorySection}>
        <View style={marketStyles.sectionHeaderRow}>
          <Text style={marketStyles.sectionTitle}>Explore products</Text>
          <Text style={marketStyles.sectionMeta}>Swipe</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={marketStyles.categoryScroll}
        >
          {CATEGORIES.map((cat, idx) => {
            const isSelected = idx === selectedCategoryIndex;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={cat}
                onPress={() => handleCategorySelect(idx)}
                style={[
                  marketStyles.categoryChip,
                  isSelected
                    ? marketStyles.categoryChipActive
                    : marketStyles.categoryChipInactive,
                ]}
              >
                <Text
                  style={[
                    marketStyles.categoryChipText,
                    { color: isSelected ? '#FFFFFF' : colors.ink },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. View Switcher Tabs: Products / Outfits / Favorites */}
      <View style={marketStyles.viewSwitcherRow}>
        {(['products', 'outfits', 'favorites'] as const).map((v) => {
          const isActive = view === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={v}
              onPress={() => {
                setView(v);
                setPage(1);
              }}
              style={[
                marketStyles.viewSwitchBtn,
                isActive && marketStyles.viewSwitchBtnActive,
              ]}
            >
              <Text
                style={[
                  marketStyles.viewSwitchText,
                  { color: isActive ? '#FFFFFF' : colors.ink },
                ]}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 6. Section Title & Count */}
      <View style={marketStyles.sectionHeaderRow}>
        <Text style={marketStyles.sectionTitle}>
          {view === 'favorites'
            ? 'Your saved pieces'
            : view === 'outfits'
            ? 'Complete the look'
            : 'All products'}
        </Text>
        <Text style={marketStyles.sectionMeta}>{totalCount} items</Text>
      </View>

      {view === 'favorites' && !token && (
        <GlassSurface radius={20} padding={16}>
          <Text style={{ color: colors.muted }}>
            Sign in to save your favorite pieces.
          </Text>
        </GlassSurface>
      )}

      {result.isPending && result.fetchStatus !== 'idle' && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentStrong} size="large" />
        </View>
      )}

      <ErrorNotice
        message={result.error?.message}
        retry={() => void result.refetch()}
      />

      {/* 7. Product Grid or Outfit Grid */}
      {result.data &&
        ('products' in result.data ? (
          <View style={marketStyles.grid}>
            {result.data.products.map((product) => (
              <View key={product.id} style={marketStyles.gridCol}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {result.data.outfits.map((outfit) => (
              <GlassSurface key={outfit.id} radius={24} padding={18}>
                <Text style={typography.titleLarge}>{outfit.title}</Text>
                {outfit.imageUrl && (
                  <Image
                    source={{ uri: outfit.imageUrl }}
                    style={{
                      width: '100%',
                      height: 220,
                      borderRadius: 18,
                      marginTop: 10,
                    }}
                    resizeMode="cover"
                  />
                )}
                <Text style={[typography.bodyMedium, { marginTop: 8 }]}>
                  {outfit.description}
                </Text>
                <View style={{ marginTop: 12, gap: 12 }}>
                  {outfit.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </View>
              </GlassSurface>
            ))}
          </View>
        ))}

      {result.data &&
        (('products' in result.data
          ? result.data.products.length
          : result.data.outfits.length) === 0) && (
          <GlassSurface radius={22} padding={20}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>
              No products found. Try adjusting your filters.
            </Text>
          </GlassSurface>
        )}

      {/* 8. Pagination */}
      {result.data && (result.data.pagination?.totalPages ?? 1) > 1 && (
        <View style={marketStyles.paginationRow}>
          <View style={{ flex: 1 }}>
            <MiroirButton
              label="Previous"
              icon="arrow-back"
              isSecondary
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
            />
          </View>
          <Text style={marketStyles.pageIndicator}>
            {page} / {result.data.pagination.totalPages}
          </Text>
          <View style={{ flex: 1 }}>
            <MiroirButton
              label="Next"
              icon="arrow-forward"
              disabled={page >= result.data.pagination.totalPages}
              onPress={() => setPage(page + 1)}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const marketStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130, // Space for floating bottom navigation
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingTitle: {
    ...typography.headlineSmall,
    color: colors.ink,
  },
  welcomeSub: {
    ...typography.bodyMedium,
    color: colors.muted,
    marginTop: 2,
  },
  accessibleSub: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 4,
    height: 48,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  clusterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.line,
    height: 50,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    color: colors.ink,
    fontSize: 15,
  },
  filterToggle: {
    width: 50,
    height: 50,
    borderRadius: radii.field,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedFilters: {
    marginTop: 14,
    gap: 12,
  },
  promoCard: {
    width: '100%',
    height: 180,
    borderRadius: radii.largeCard,
    overflow: 'hidden',
    backgroundColor: colors.elevated,
  },
  categorySection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.ink,
  },
  sectionMeta: {
    ...typography.bodySmall,
    color: colors.mutedSoft,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  categoryChipActive: {
    backgroundColor: colors.glassSelected,
  },
  categoryChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: colors.glassStrong,
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  viewSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  viewSwitchBtnActive: {
    backgroundColor: colors.glassSelected,
  },
  viewSwitchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCol: {
    width: '48%',
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    shadowColor: 'rgba(14, 20, 32, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(231, 238, 220, 0.6)',
  },
  productImageWrapper: {
    width: '100%',
    aspectRatio: 1.18,
    borderRadius: 18,
    backgroundColor: colors.canvasStrong,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 18,
  },
  shopName: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.2,
    marginTop: 6,
  },
  tryOnButton: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: radii.pill,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
});
