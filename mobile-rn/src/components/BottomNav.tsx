import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii } from '../theme/tokens';
import { useTranslation } from '../stores/language';
import { GlassSurface } from './ui';

interface NavItem {
  path: '/' | '/saved' | '/orders' | '/account';
  labelKey: 'home' | 'saved' | 'orders' | 'account';
  outlineIcon: keyof typeof MaterialIcons.glyphMap;
  filledIcon: keyof typeof MaterialIcons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'home', outlineIcon: 'storefront', filledIcon: 'storefront' },
  { path: '/saved', labelKey: 'saved', outlineIcon: 'favorite-border', filledIcon: 'favorite' },
  { path: '/orders', labelKey: 'orders', outlineIcon: 'receipt-long', filledIcon: 'receipt-long' },
  { path: '/account', labelKey: 'account', outlineIcon: 'person-outline', filledIcon: 'person' },
];

export function BottomNav() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const isVisible = NAV_ITEMS.some((item) => item.path === path);
  if (!isVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <GlassSurface
        radius={radii.largeCard}
        padding={6}
        blurIntensity={28}
        style={styles.floatingBar}
      >
        <View style={styles.navRow}>
          {NAV_ITEMS.map((item) => {
            const isSelected = path === item.path;
            const iconName = isSelected ? item.filledIcon : item.outlineIcon;
            const iconColor = isSelected ? '#FFFFFF' : colors.muted;

            return (
              <Pressable
                key={item.path}
                accessibilityRole="tab"
                accessibilityLabel={t(item.labelKey)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => router.navigate(item.path)}
                style={({ pressed }) => [
                  styles.tabItem,
                  isSelected && styles.tabItemSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons name={iconName} size={21} color={iconColor} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    { color: isSelected ? '#FFFFFF' : colors.muted },
                  ]}
                >
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  floatingBar: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 24,
    marginHorizontal: 2,
    minHeight: 52,
  },
  tabItemSelected: {
    backgroundColor: colors.glassSelected,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
});
