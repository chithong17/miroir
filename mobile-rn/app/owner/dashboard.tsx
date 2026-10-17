import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { analyticsApi, Breakdown, ProductMetric } from '../../src/api/analytics';
import { useOwner } from '../../src/stores/owner';
import {
  AppHeader,
  Body,
  Button,
  Card,
  ErrorNotice,
  GlassPill,
  GlassSurface,
  Heading,
  MiroirButton,
  Screen,
  SelectionChip,
  SurfaceIconButton,
} from '../../src/components/ui';
import { colors, radii, typography } from '../../src/theme/tokens';
import { money } from '../../src/features/marketplace/Marketplace';

function numericValues(value: object): Record<string, number> {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  );
}

function MetricGrid({
  title,
  values,
  labels,
  currency = [],
}: {
  title: string;
  values?: Record<string, number | null>;
  labels: Record<string, string>;
  currency?: string[];
}) {
  if (!values) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.metricGrid}>
        {Object.entries(labels).map(([key, label]) => {
          const raw = values[key];
          let formatted = '—';
          if (raw != null) {
            if (currency.includes(key)) {
              formatted = money(raw);
            } else if (key.toLowerCase().includes('rate')) {
              formatted = `${(raw * 100).toFixed(1)}%`;
            } else {
              formatted = raw.toLocaleString();
            }
          }
          return (
            <View key={key} style={styles.metricCard}>
              <Text style={styles.metricLabel} numberOfLines={1}>
                {label}
              </Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {formatted}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SeriesChart({
  title,
  subtitle,
  items,
  metric,
  currency = false,
}: {
  title: string;
  subtitle?: string;
  items?: Record<string, string | number>[];
  metric: string;
  currency?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!items?.length) return null;

  const max = Math.max(1, ...items.map((i) => Number(i[metric]) || 0));
  const activeIndex = selected !== null ? selected : items.length - 1;
  const currentItem = items[activeIndex];
  const currentValue = Number(currentItem?.[metric]) || 0;

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartTitle}>{title}</Text>
          {subtitle ? <Text style={styles.chartSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.chartBadge}>
          <Text style={styles.chartBadgeDate}>{String(currentItem?.date || '')}</Text>
          <Text style={styles.chartBadgeValue}>
            {currency ? money(currentValue) : currentValue.toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barListContainer}
      >
        {items.map((row, i) => {
          const val = Number(row[metric]) || 0;
          const height = Math.max(8, (val / max) * 110);
          const isSelected = i === activeIndex;

          return (
            <Pressable
              key={String(row.date)}
              accessibilityRole="button"
              accessibilityLabel={`${row.date}: ${val}`}
              onPress={() => setSelected(i)}
              style={styles.barCol}
            >
              <View
                style={[
                  styles.barFill,
                  { height },
                  isSelected && styles.barFillSelected,
                ]}
              />
              <Text
                style={[
                  styles.barLabel,
                  isSelected && styles.barLabelSelected,
                ]}
              >
                {String(row.date).slice(5)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

function DistributionList({
  title,
  items,
}: {
  title: string;
  items?: Breakdown[];
}) {
  if (!items || items.length === 0) return null;
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <Card style={styles.distributionCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={{ gap: 12, marginTop: 12 }}>
        {items.map((item, i) => {
          const percent = Math.round((item.count / max) * 100);
          return (
            <View key={`${item.label}-${i}`} style={{ gap: 6 }}>
              <View style={styles.distLabelRow}>
                <Text style={styles.distLabelText} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.distValueText}>{item.count.toLocaleString()}</Text>
              </View>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${Math.max(4, percent)}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function FunnelStages({
  title,
  values,
}: {
  title: string;
  values?: Record<string, number | null>;
}) {
  if (!values) return null;
  const stages = [
    { key: 'views', label: 'Views', icon: 'visibility' as const },
    { key: 'tryOns', label: 'Try-ons', icon: 'checkroom' as const },
    { key: 'stylistMatches', label: 'Stylist matches', icon: 'auto-awesome' as const },
    { key: 'feedback', label: 'Feedback', icon: 'rate-review' as const },
    { key: 'orders', label: 'Orders', icon: 'shopping-cart' as const },
    { key: 'paidOrders', label: 'Paid orders', icon: 'verified' as const },
  ];

  const firstCount = Number(values['views'] || 1);

  return (
    <Card style={styles.funnelCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={{ gap: 10, marginTop: 12 }}>
        {stages.map((stage) => {
          const count = Number(values[stage.key] || 0);
          const percent = firstCount > 0 ? Math.round((count / firstCount) * 100) : 0;
          return (
            <View key={stage.key} style={styles.funnelRow}>
              <View style={styles.funnelIcon}>
                <MaterialIcons name={stage.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.distLabelRow}>
                  <Text style={styles.funnelLabel}>{stage.label}</Text>
                  <Text style={styles.funnelValue}>
                    {count.toLocaleString()} {stage.key !== 'views' ? `(${percent}%)` : ''}
                  </Text>
                </View>
                <View style={styles.distTrack}>
                  <View
                    style={[
                      styles.funnelFill,
                      { width: `${Math.max(2, Math.min(100, percent))}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function ProductRankList({
  title,
  items,
  type = 'sales',
}: {
  title: string;
  items?: ProductMetric[];
  type?: 'sales' | 'engagement';
}) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 10 }}>
        {items.map((p, idx) => (
          <Card key={p.productId} style={styles.rankCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.rankProductName} numberOfLines={1}>
                {p.name}
              </Text>
              {type === 'sales' && p.collectedRevenue != null && (
                <Text style={styles.rankProductStats}>
                  {money(p.collectedRevenue)} · {p.quantity || 0} units sold
                </Text>
              )}
              {type === 'engagement' && p.views != null && (
                <Text style={styles.rankProductStats}>
                  {p.views.toLocaleString()} views · {p.tryOns || 0} try-ons ·{' '}
                  {p.stylistMatches || 0} matches
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${p.name}`}
              onPress={() =>
                router.push({
                  pathname: '/owner/products/edit',
                  params: { id: p.productId },
                })
              }
              style={styles.editBtn}
            >
              <MaterialIcons name="edit" size={16} color={colors.ink} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </Card>
        ))}
      </View>
    </View>
  );
}

export default function OwnerDashboard() {
  const token = useOwner((s) => s.token);
  const [range, setRange] = useState('30d');
  const [tab, setTab] = useState<'performance' | 'audience'>('performance');

  const dashboard = useQuery({
    queryKey: ['owner', token, 'dashboard', range],
    queryFn: () => analyticsApi.dashboard(token, range),
    enabled: tab === 'performance',
  });
  const analytics = useQuery({
    queryKey: ['owner', token, 'analytics', range],
    queryFn: () => analyticsApi.analytics(token, range),
    enabled: tab === 'performance',
  });
  const insights = useQuery({
    queryKey: ['owner', token, 'insights', range],
    queryFn: () => analyticsApi.insights(token, range),
    enabled: tab === 'audience',
  });

  const d = dashboard.data;
  const a = analytics.data;
  const insight = insights.data;
  const isFetching = dashboard.isFetching || analytics.isFetching || insights.isFetching;

  function handleRefresh() {
    if (tab === 'performance') {
      void dashboard.refetch();
      void analytics.refetch();
    } else {
      void insights.refetch();
    }
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Shop performance"
          subtitle="Sales, customer actions, and AI discovery"
          showBack
          onBack={() => router.replace('/owner')}
          rightAction={
            <SurfaceIconButton
              icon="refresh"
              size={40}
              onPress={handleRefresh}
            />
          }
        />
      }
    >
      {/* 1. Mode and Range Selector */}
      <View style={styles.controlsRow}>
        <View style={styles.pillGroup}>
          <SelectionChip
            label="Performance"
            selected={tab === 'performance'}
            onPress={() => setTab('performance')}
          />
          <SelectionChip
            label="Audience insights"
            selected={tab === 'audience'}
            onPress={() => setTab('audience')}
          />
        </View>

        <View style={styles.rangeGroup}>
          {['7d', '30d', '90d'].map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              accessibilityLabel={`Select period ${r}`}
              onPress={() => setRange(r)}
              style={[
                styles.rangePill,
                range === r && styles.rangePillActive,
              ]}
            >
              <Text
                style={[
                  styles.rangePillText,
                  range === r && styles.rangePillTextActive,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Loading indicator */}
      {isFetching && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Updating shop analytics…</Text>
        </View>
      )}

      {/* 2. Performance Tab Content */}
      {tab === 'performance' ? (
        <>
          <ErrorNotice
            message={dashboard.error?.message || analytics.error?.message}
            retry={handleRefresh}
          />

          {/* Hero Banner */}
          <GlassSurface radius={24} padding={18} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="insights" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Performance dashboard</Text>
                <Text style={styles.heroSubtitle}>
                  Sales, customer actions, and AI discovery for this shop.
                </Text>
              </View>
            </View>
          </GlassSurface>

          {/* Sales Overview */}
          <MetricGrid
            title="Sales overview"
            values={d?.summary}
            labels={{
              collectedRevenue: 'Collected revenue',
              projectedRevenue: 'Projected revenue',
              totalOrders: 'Orders',
              paidOrders: 'Paid orders',
              averageOrderValue: 'Average order',
              refundValue: 'Refund value',
              pendingOrders: 'Pending orders',
            }}
            currency={['collectedRevenue', 'projectedRevenue', 'averageOrderValue', 'refundValue']}
          />

          {/* Finance Overview */}
          {d?.finance && (
            <MetricGrid
              title="Finance"
              values={d.finance}
              labels={{
                eligibleRevenue: 'Eligible revenue',
                knownCost: 'Known cost',
                grossProfit: 'Gross profit',
                marginRate: 'Margin rate',
                missingCostItems: 'Items missing cost',
              }}
              currency={['eligibleRevenue', 'knownCost', 'grossProfit']}
            />
          )}

          {/* Revenue Trends */}
          <SeriesChart
            title="Revenue trend"
            subtitle="Collected versus projected revenue in period"
            items={d?.salesSeries}
            metric="collectedRevenue"
            currency
          />

          {/* Order Volume Trends */}
          <SeriesChart
            title="Daily orders"
            subtitle="Order placement count per day"
            items={d?.salesSeries}
            metric="orders"
          />

          {/* Customer Journey Funnel */}
          <FunnelStages title="Customer journey funnel" values={d?.funnel} />

          {/* Order & Payment Breakdowns */}
          <View style={styles.breakdownRow}>
            <View style={{ flex: 1 }}>
              <DistributionList title="Order status" items={d?.orderStatusBreakdown} />
            </View>
            <View style={{ flex: 1 }}>
              <DistributionList title="Payment status" items={d?.paymentStatusBreakdown} />
            </View>
          </View>

          {/* Engagement Overview */}
          <MetricGrid
            title="Product & AI engagement"
            values={a?.summary}
            labels={{
              productViews: 'Product views',
              tryOnClicks: 'Try-ons',
              stylistMatches: 'Stylist matches',
              feedbackCount: 'Customer feedback',
              conversionRate: 'Conversion rate',
              publishedProducts: 'Published products',
            }}
          />

          {/* Daily Views & Try-ons */}
          <SeriesChart
            title="Daily product views"
            subtitle="Customer catalog impressions"
            items={a?.timeSeries}
            metric="views"
          />
          <SeriesChart
            title="Daily try-ons"
            subtitle="Virtual fitting sessions triggered"
            items={a?.timeSeries}
            metric="tryOns"
          />

          {/* Catalog Health */}
          {d?.inventoryHealth && (
            <Card style={styles.inventoryCard}>
              <Text style={styles.chartTitle}>Catalog health</Text>
              <View style={styles.healthPillWrap}>
                <View style={styles.healthPill}>
                  <Text style={styles.healthPillCount}>{d.inventoryHealth.total || 0}</Text>
                  <Text style={styles.healthPillLabel}>Total Products</Text>
                </View>
                <View style={[styles.healthPill, { backgroundColor: '#EBF6EC' }]}>
                  <Text style={[styles.healthPillCount, { color: '#278E49' }]}>
                    {d.inventoryHealth.published || 0}
                  </Text>
                  <Text style={[styles.healthPillLabel, { color: '#278E49' }]}>Published</Text>
                </View>
                <View style={[styles.healthPill, { backgroundColor: '#F4F5F7' }]}>
                  <Text style={styles.healthPillCount}>{d.inventoryHealth.draft || 0}</Text>
                  <Text style={styles.healthPillLabel}>Draft</Text>
                </View>
                <View style={[styles.healthPill, { backgroundColor: '#FEEFEF' }]}>
                  <Text style={[styles.healthPillCount, { color: '#D9383A' }]}>
                    {d.inventoryHealth.outOfStock || 0}
                  </Text>
                  <Text style={[styles.healthPillLabel, { color: '#D9383A' }]}>Out of stock</Text>
                </View>
                <View style={[styles.healthPill, { backgroundColor: '#FFF7E6' }]}>
                  <Text style={[styles.healthPillCount, { color: '#D48806' }]}>
                    {d.inventoryHealth.needsEmbedding || 0}
                  </Text>
                  <Text style={[styles.healthPillLabel, { color: '#D48806' }]}>AI Indexing</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Fit Finder Data */}
          {d?.fitFinder && (
            <>
              <MetricGrid
                title="Fit finder"
                values={{ ...numericValues(d.fitFinder), ...d.fitFinder.feedback }}
                labels={{
                  opened: 'Opened',
                  recommended: 'Recommended',
                  applied: 'Applied',
                  addToCart: 'Added to cart',
                  checkout: 'Checkout',
                  tooSmall: 'Too small',
                  trueToSize: 'True to size',
                  tooLarge: 'Too large',
                  sizeReturnRate: 'Size return rate',
                }}
              />
              <DistributionList
                title="Fit confidence distribution"
                items={d.fitFinder.confidenceDistribution}
              />
            </>
          )}

          {/* Top Products */}
          <ProductRankList
            title="Top selling products"
            items={d?.topProducts}
            type="sales"
          />
          <ProductRankList
            title="Top engaged products"
            items={a?.topProducts}
            type="engagement"
          />
        </>
      ) : (
        /* 3. Audience Insights Tab Content */
        <>
          <ErrorNotice message={insights.error?.message} retry={handleRefresh} />
          {insight && (
            <>
              <GlassSurface radius={24} padding={20} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.heroIconCircle}>
                    <MaterialIcons name="people-alt" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Audience overview</Text>
                    <Text style={styles.heroSubtitle}>
                      {insight.eventCount.toLocaleString()} total interactions from{' '}
                      {insight.userCount.toLocaleString()} unique customers.
                    </Text>
                  </View>
                </View>
              </GlassSurface>

              {!insight.enoughData ? (
                <Card style={{ alignItems: 'center', padding: 24 }}>
                  <MaterialIcons name="analytics" size={42} color={colors.muted} />
                  <Text style={[typography.titleMedium, { marginTop: 12 }]}>
                    Collecting Audience Insights
                  </Text>
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.muted, textAlign: 'center', marginTop: 6 },
                    ]}
                  >
                    {insight.message ||
                      'More customer interactions are required to generate detailed demographic and preference trends.'}
                  </Text>
                </Card>
              ) : (
                Object.entries(insight.breakdowns || {}).map(([name, items]) => (
                  <DistributionList
                    key={name}
                    title={name.replace(/([A-Z])/g, ' $1')}
                    items={items}
                  />
                ))
              )}
            </>
          )}
        </>
      )}

      {/* Owner Center Navigation */}
      <View style={{ marginTop: 24, marginBottom: 16 }}>
        <MiroirButton
          label="Back to owner center"
          icon="storefront"
          isSecondary
          onPress={() => router.replace('/owner')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    gap: 12,
    marginBottom: 16,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeGroup: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 3,
    gap: 4,
  },
  rangePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rangePillActive: {
    backgroundColor: colors.primary,
  },
  rangePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  rangePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  mockDataNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  mockDataText: {
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  chartBadge: {
    alignItems: 'flex-end',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chartBadgeDate: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  chartBadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  barListContainer: {
    height: 140,
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 4,
  },
  barCol: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barFill: {
    width: 22,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  barFillSelected: {
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  barLabelSelected: {
    color: colors.ink,
    fontWeight: '800',
  },
  distributionCard: {
    marginBottom: 16,
    padding: 16,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distLabelText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  distValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  distTrack: {
    height: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  funnelCard: {
    marginBottom: 16,
    padding: 16,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  funnelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  funnelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  funnelValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  funnelFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'column',
    gap: 0,
  },
  inventoryCard: {
    marginBottom: 16,
    padding: 16,
  },
  healthPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  healthPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    minWidth: 80,
  },
  healthPillCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  healthPillLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  rankProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  rankProductStats: {
    fontSize: 12,
    color: colors.muted,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
});
