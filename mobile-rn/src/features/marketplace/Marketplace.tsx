import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { catalogApi, CatalogProduct } from '../../api/catalog';
import { useSession } from '../../stores/session';
import { ErrorNotice, Field, MiroirButton, Screen, SelectionChip } from '../../components/ui';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { commerceLayout, productColumns } from '../../theme/commerce';

export const money = (value: number) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} VND`;

export function ProductCard({ product, onOpen }: { product: CatalogProduct; onOpen?: () => void }) {
  const available = product.variants?.filter(v => v.active !== false && v.stockQuantity > 0) || [];
  const sizes = [...new Set(available.map(v => v.size).filter(Boolean))];
  const soldOut = !!product.variants?.length && !available.length;
  return <Pressable accessibilityRole="button" accessibilityLabel={product.name}
    onPress={onOpen || (() => router.push(`/product/${product.id}`))}
    style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
    <View style={styles.imageWrap}>
      {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
        : <MaterialIcons name="checkroom" size={40} color={colors.muted} />}
      {soldOut && <View style={styles.stockBadge}><Text style={typography.bodyMedium}>Sold out</Text></View>}
    </View>
    <View style={styles.productInfo}>
      <Text style={typography.bodyMedium} numberOfLines={1}>{product.shop?.name || 'Boutique collection'}</Text>
      <Text style={typography.titleMedium} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.price}>{money(product.price)}</Text>
      {!!product.material && <Text style={typography.bodyMedium} numberOfLines={1}>{product.material}</Text>}
      {!!sizes.length && <Text style={typography.bodyMedium} numberOfLines={1}>In stock: {sizes.join(' · ')}</Text>}
      <View style={styles.productLink}><Text style={styles.linkText}>View piece</Text><MaterialIcons name="arrow-forward" size={16} color={colors.primary}/></View>
    </View>
  </Pressable>;
}

export function Marketplace({ initialView = 'products' }: { initialView?: 'products' | 'favorites' }) {
  const { token, user, exitGuest } = useSession();
  const saved = initialView === 'favorites';
  const { width } = useWindowDimensions();
  const columns = productColumns(Math.min(width, commerceLayout.pageMax));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', minPrice: '', maxPrice: '' });
  const [filterError, setFilterError] = useState('');
  const [page, setPage] = useState(1);
  const result = useQuery({
    queryKey: ['catalog', saved ? 'favorites' : 'products', filters, page, token],
    queryFn: async () => saved
      ? { products: await catalogApi.favorites(token), pagination: undefined }
      : catalogApi.products({ ...filters, page }, token),
    enabled: !saved || !!token,
  });
  function apply() {
    const low = min.trim() ? Number(min) : undefined;
    const high = max.trim() ? Number(max) : undefined;
    if ((low !== undefined && (!Number.isFinite(low) || low < 0)) || (high !== undefined && (!Number.isFinite(high) || high < 0)) || (low !== undefined && high !== undefined && low > high)) {
      setFilterError('Enter a valid price range.'); return;
    }
    setFilterError(''); setPage(1);
    setFilters({ search: search.trim(), category: category.trim(), minPrice: min, maxPrice: max });
    setShowFilters(false);
  }
  function clear() {
    setSearch(''); setCategory(''); setMin(''); setMax(''); setFilterError(''); setPage(1);
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '' });
  }
  const pieces = result.data?.products || [];
  // These are real boutiques represented in the current results, never fabricated recommendations.
  const shops = [...new Map(pieces.filter(p => p.shop).map(p => [p.shop!.id, p.shop!])).values()];
  const filtered = Object.values(filters).some(Boolean);
  return <Screen contentStyle={styles.page}>
    <View style={styles.header}>
      <View style={styles.grow}>
        <Text style={styles.eyebrow}>MIROIR / BOUTIQUES</Text>
        <Text style={typography.headlineMedium}>{saved ? 'Your saved pieces' : 'Find your next favorite'}</Text>
        <Text style={typography.bodyMedium}>{saved ? 'Keep your shortlist close. Revisit a piece or ask its shop a question.' : user ? `Hello, ${user.name.split(' ')[0]}. Discover the shops behind the pieces.` : 'Distinct pieces. Real boutiques. Direct conversations.'}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Messages" style={styles.icon} onPress={() => router.push('/chat')}><MaterialIcons name="chat-bubble-outline" size={22} color={colors.ink}/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="My bag" style={styles.icon} onPress={() => router.push('/cart')}><MaterialIcons name="shopping-bag" size={22} color={colors.ink}/></Pressable>
    </View>
    {!saved && <>
      <View style={styles.searchRow}>
        <View style={styles.grow}><Field label="Search products" placeholder="Name, material or a piece you love" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={apply}/></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Filters" accessibilityState={{ expanded: showFilters }} style={styles.icon} onPress={() => setShowFilters(!showFilters)}><MaterialIcons name="tune" size={24} color={colors.ink}/></Pressable>
      </View>
      {showFilters && <View style={styles.filterPanel}>
        <Field label="Category" placeholder="Product category" value={category} onChangeText={setCategory}/>
        <View style={styles.row}><View style={styles.grow}><Field label="Minimum price" keyboardType="numeric" value={min} onChangeText={setMin}/></View><View style={styles.grow}><Field label="Maximum price" keyboardType="numeric" value={max} onChangeText={setMax}/></View></View>
        <ErrorNotice message={filterError}/><MiroirButton label="Apply filters" onPress={apply}/><MiroirButton label="Clear filters" isSecondary onPress={clear}/>
      </View>}
      {filtered && <View style={styles.row}><Text style={[typography.bodyMedium, styles.grow]}>Showing your search results</Text><SelectionChip label="Clear filters" onPress={clear}/></View>}
    </>}
    {saved && !token ? <View style={styles.empty}>
      <MaterialIcons name="favorite-border" size={40} color={colors.primary}/><Text style={typography.titleLarge}>Make a shortlist of your favorites</Text><Text style={typography.bodyLarge}>Sign in to save pieces and return to them later.</Text><MiroirButton label="Sign in" onPress={() => void exitGuest()}/><MiroirButton label="Explore boutiques" isSecondary onPress={() => router.navigate('/')}/>
    </View> : <>
      {result.isPending && <View accessibilityLabel="Loading products" style={styles.empty}><ActivityIndicator size="large" color={colors.primary}/><Text style={typography.bodyMedium}>Finding pieces from boutiques…</Text></View>}
      <ErrorNotice message={result.error?.message} retry={() => void result.refetch()}/>
      {!saved && shops.length > 0 && <View style={{ gap: spacing.md }}><Text style={typography.titleLarge}>Boutiques in this collection</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {shops.map(shop => <Pressable key={shop.id} accessibilityRole="button" accessibilityLabel={`Visit ${shop.name}`} style={styles.shop} onPress={() => router.push(`/shop/${shop.id}`)}><MaterialIcons name="storefront" size={20} color={colors.primary}/><Text style={typography.titleMedium}>{shop.name}</Text></Pressable>)}
      </ScrollView></View>}
      <View style={styles.row}><Text style={[typography.titleLarge, styles.grow]}>{saved ? 'Your shortlist' : 'Explore pieces'}</Text><Text style={typography.bodyMedium}>{result.data?.pagination?.total ?? pieces.length} pieces</Text></View>
      <View style={styles.grid}>{pieces.map(product => <View key={product.id} style={{ width: `${100 / columns}%`, padding: spacing.sm }}><ProductCard product={product}/></View>)}</View>
      {result.isSuccess && !pieces.length && <View style={styles.empty}><MaterialIcons name={saved ? 'favorite-border' : 'search-off'} size={40} color={colors.primary}/><Text style={typography.titleLarge}>{saved ? 'Your shortlist starts here' : 'No pieces found'}</Text><Text style={typography.bodyLarge}>{saved ? 'Open a product and tap its heart to save it.' : filtered ? 'Try another search or clear your filters.' : 'The boutiques have no published pieces to show right now.'}</Text><MiroirButton label={saved ? 'Explore boutiques' : filtered ? 'Clear filters' : 'Refresh collection'} onPress={saved ? () => router.navigate('/') : filtered ? clear : () => void result.refetch()}/></View>}
      {!!result.data?.pagination && result.data.pagination.totalPages > 1 && <View style={styles.row}><View style={styles.grow}><MiroirButton label="Previous" isSecondary disabled={page <= 1} onPress={() => setPage(page - 1)}/></View><Text style={typography.bodyMedium}>{page} / {result.data.pagination.totalPages}</Text><View style={styles.grow}><MiroirButton label="Next" disabled={page >= result.data.pagination.totalPages} onPress={() => setPage(page + 1)}/></View></View>}
    </>}
    {!saved && <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open boutique workspace" style={styles.workspace} onPress={() => router.push('/owner')}>
        <View style={styles.grow}><Text style={typography.titleMedium}>Run a boutique?</Text><Text style={typography.bodyMedium}>Products, stock, orders and customer messages.</Text></View><MaterialIcons name="arrow-forward" size={22} color={colors.primary}/>
      </Pressable>
    </>}
  </Screen>;
}
const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: commerceLayout.pageMax, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxxl * 3, gap: spacing.xl },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  eyebrow: { ...typography.bodySmall, color: colors.primary, letterSpacing: 2, marginBottom: spacing.sm },
  grow: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: commerceLayout.target, height: commerceLayout.target, alignItems: 'center', justifyContent: 'center', borderRadius: radii.field, backgroundColor: colors.elevated },
  searchRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  filterPanel: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  workspace: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md, minHeight: commerceLayout.target, borderBottomWidth: 1, borderColor: colors.line },
  shop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, minHeight: commerceLayout.target, borderRadius: radii.field, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  product: { flex: 1, borderRadius: radii.field, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  imageWrap: { aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvasStrong },
  image: { width: '100%', height: '100%' },
  productInfo: { padding: spacing.md, gap: spacing.xs },
  price: { ...typography.titleMedium, color: colors.primary },
  productLink: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: commerceLayout.target },
  linkText: { ...typography.bodyMedium, color: colors.primary, fontWeight: '700' },
  stockBadge: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.sm },
  pressed: { opacity: 0.8 },
  empty: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
});
