import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '../../src/stores/session';
import { useLanguage, useTranslation } from '../../src/stores/language';
import {
  ErrorNotice,
  GlassPill,
  GlassSurface,
  MiroirButton,
  Screen,
} from '../../src/components/ui';
import { colors, radii, typography } from '../../src/theme/tokens';

export default function Account() {
  const session = useSession();
  const language = useLanguage();
  const t = useTranslation();
  const user = session.user;

  return (
    <Screen contentStyle={styles.content}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* 2. Guest View matching Flutter _GuestView */}
      {!user ? (
        <GlassSurface radius={32} padding={28} blurIntensity={24}>
          <View style={styles.guestCenter}>
            <View style={styles.guestIconCircle}>
              <MaterialIcons
                name="person-outline"
                size={48}
                color={colors.accentStrong}
              />
            </View>
            <Text style={styles.guestHeading}>Guest Mode</Text>
            <Text style={styles.guestSub}>
              Sign in to save your fitting profile, keep your personalized styling, and use the try-on studio.
            </Text>

            <View style={{ width: '100%', gap: 12, marginTop: 16 }}>
              <MiroirButton
                label={t('login')}
                icon="lock-open"
                onPress={() => void session.exitGuest()}
              />
              <MiroirButton
                label="Create account"
                icon="person-add-alt-1"
                isSecondary
                onPress={() => void session.exitGuest()}
              />
              <MiroirButton
                label="Shop owner center"
                icon="storefront"
                isSecondary
                onPress={() => router.push('/owner')}
              />
              <MiroirButton
                label="Chính sách & Điều khoản"
                icon="policy"
                isSecondary
                onPress={() => router.push('/terms')}
              />
              <MiroirButton label="English" isSecondary onPress={() => void language.setLanguage('en')} />
              <MiroirButton label="Vietnamese" isSecondary onPress={() => void language.setLanguage('vi')} />
            </View>
          </View>
        </GlassSurface>
      ) : (
        /* 3. Signed In Profile View */
        <View style={{ gap: 24 }}>
          {/* User Profile Header */}
          <View style={styles.userHeader}>
            <View style={styles.avatarWrapper}>
              {user.profile.modelImageUrl ? (
                <Image
                  source={{ uri: user.profile.modelImageUrl }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {user.name?.[0]?.toUpperCase() || 'M'}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={typography.headlineSmall}>{user.name}</Text>
              <Text style={typography.bodyMedium}>{user.email}</Text>
              <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                <GlassPill
                  label={
                    user.subscription?.allFeaturesIncluded ? 'MIROIR access' : user.subscription?.isPremium
                      ? 'Premium Member'
                      : 'Free Plan'
                  }
                  icon={user.subscription?.isPremium ? 'verified' : 'star-outline'}
                  isSelected={user.subscription?.isPremium}
                />
              </View>
            </View>
          </View>

          {/* Account Menu Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionHeaderTitle}>ACCOUNT</Text>
            <GlassSurface radius={24} padding={8}>
              <MenuItem
                icon="edit"
                label="Edit Profile"
                onPress={() => router.push('/profile')}
              />
              <MenuItem
                icon="favorite-border"
                label="Saved Items"
                onPress={() => router.push('/saved')}
              />
              <MenuItem
                icon="shopping-bag"
                label="My bag"
                onPress={() => router.push('/cart')}
              />
              <MenuItem
                icon="receipt-long"
                label="My orders"
                onPress={() => router.push('/orders')}
              />
              <MenuItem
                icon="location-on"
                label="Delivery addresses"
                onPress={() => router.push('/addresses')}
              />
              <MenuItem
                icon="notifications-none"
                label="Notifications"
                onPress={() => router.push('/notifications')}
              />
              <MenuItem
                icon="assignment-return"
                label="Returns & refunds"
                onPress={() => router.push('/returns')}
              />
              <MenuItem
                icon="chat"
                label="Messages"
                onPress={() => router.push('/chat')}
              />
              <MenuItem
                icon="workspace-premium"
                label="Premium plans"
                onPress={() => router.push('/payments')}
              />
              <MenuItem
                icon="policy"
                label="Chính sách & Điều khoản"
                onPress={() => router.push('/terms')}
              />
              <MenuItem
                icon="storefront"
                label="Shop owner center"
                onPress={() => router.push('/owner')}
                isLast
              />
            </GlassSurface>
          </View>

          {/* Settings Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionHeaderTitle}>SETTINGS</Text>
            <GlassSurface radius={24} padding={8}>
              <View style={styles.languageRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="language" size={22} color={colors.ink} />
                  <Text style={styles.menuLabel}>{t('language')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('english')}
                    onPress={() => void language.setLanguage('en')}
                    style={[
                      styles.langBtn,
                      language.language === 'en' && styles.langBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        language.language === 'en' && { color: '#FFFFFF' },
                      ]}
                    >
                      English
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('vietnamese')}
                    onPress={() => void language.setLanguage('vi')}
                    style={[
                      styles.langBtn,
                      language.language === 'vi' && styles.langBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        language.language === 'vi' && { color: '#FFFFFF' },
                      ]}
                    >
                      Vietnamese
                    </Text>
                  </Pressable>
                </View>
              </View>

              <MenuItem
                icon="delete-forever"
                label="Xóa tài khoản"
                isDestructive
                onPress={() => {
                  Alert.alert(
                    'Xóa tài khoản',
                    'Bạn có chắc chắn muốn xóa tài khoản MIROIR? Toàn bộ hồ sơ số đo, ảnh thử đồ và thông tin tài khoản của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xóa vĩnh viễn',
                        style: 'destructive',
                        onPress: () => {
                          void session.deleteAccount();
                        },
                      },
                    ]
                  );
                }}
              />

              <MenuItem
                icon="logout"
                label={t('logout')}
                isDestructive
                onPress={() => void session.logout()}
                isLast
              />
            </GlassSurface>
          </View>
        </View>
      )}

      <ErrorNotice message={language.error} />
    </Screen>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  isDestructive = false,
  isLast = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && styles.menuItemBorder,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <MaterialIcons
          name={icon}
          size={22}
          color={isDestructive ? colors.error : colors.ink}
        />
        <Text
          style={[
            styles.menuLabel,
            isDestructive && { color: colors.error, fontWeight: '700' },
          ]}
        >
          {label}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={isDestructive ? colors.error : colors.mutedSoft}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 20,
  },
  headerRow: {
    paddingVertical: 8,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.ink,
  },
  guestCenter: {
    alignItems: 'center',
    textAlign: 'center',
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(148, 177, 111, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestHeading: {
    ...typography.headlineSmall,
    color: colors.ink,
    marginBottom: 10,
  },
  guestSub: {
    ...typography.bodyLarge,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  menuSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.muted,
    marginLeft: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  langBtnActive: {
    backgroundColor: colors.glassSelected,
    borderColor: 'transparent',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
});
