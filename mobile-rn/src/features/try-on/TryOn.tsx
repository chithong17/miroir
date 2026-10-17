import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ErrorNotice,
  GlassPill,
  GlassSurface,
  MiroirButton,
  Screen,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';
import { Slot, useTryOn } from './state';

export function TryOn() {
  const state = useTryOn();
  const [pickError, setPickError] = useState('');
  const busy = ['creating', 'processing', 'pending'].includes(state.status);

  useFocusEffect(
    useCallback(() => {
      if (state.status !== 'completed') return;
      useTryOn.getState().markSeen();
    }, [state.status])
  );

  async function pick(slot: Slot) {
    try {
      setPickError('');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });
      if (!result.canceled) {
        const a = result.assets[0];
        state.setImage(slot, {
          uri: a.uri,
          name: a.fileName || `${slot}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          file: a.file,
        });
      }
    } catch (e) {
      setPickError(e instanceof Error ? e.message : 'Unable to select photo.');
    }
  }

  const modeLabel = state.product
    ? 'Catalog product'
    : state.type === 'dress'
    ? 'Dress mode'
    : 'Upper / Lower';

  return (
    <Screen contentStyle={styles.content}>
      {/* 1. Header with title and mode chip */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Try-On</Text>
          <Text style={styles.headerSub}>See it on you</Text>
        </View>
        <GlassPill label={modeLabel} icon="auto-awesome" />
      </View>

      {/* 2. Studio Hero Card matching Flutter _StudioHero */}
      <View style={styles.heroCard}>
        <Image
          source={require('../../../assets/images/try-on.png')}
          style={[StyleSheet.absoluteFill, {width: '100%', height: '100%'}]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(23, 33, 15, 0.82)',
            'rgba(23, 33, 15, 0.25)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInner}>
          <GlassPill label={modeLabel} icon="auto-awesome" />
          <Text style={styles.heroTitle}>Studio preview</Text>
          <Text style={styles.heroSubtitle}>
            Experience your future wardrobe in real time with AI.
          </Text>
        </View>
      </View>

      {/* 3. Mode Selection Cards */}
      <View style={{ gap: 10 }}>
        <Text style={typography.titleLarge}>Mode</Text>
        {state.product ? (
          <GlassSurface radius={24} padding={16}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              {state.product.imageUrl ? (
                <Image
                  source={{ uri: state.product.imageUrl }}
                  style={{ width: 70, height: 70, borderRadius: 14 }}
                  resizeMode="contain"
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={typography.titleMedium}>{state.product.name}</Text>
                <Text style={typography.bodySmall}>Selected from catalog</Text>
              </View>
            </View>
            <MiroirButton
              label="Use custom garments"
              isSecondary
              disabled={busy}
              onPress={() => state.setType('dress')}
              style={{ marginTop: 12 }}
            />
          </GlassSurface>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dress"
              disabled={busy}
              onPress={() => state.setType('dress')}
              style={[
                styles.modeCard,
                state.type === 'dress' && styles.modeCardActive,
              ]}
            >
              <MaterialIcons
                name="checkroom"
                size={24}
                color={state.type === 'dress' ? '#FFFFFF' : colors.ink}
              />
              <Text
                style={[
                  styles.modeTitle,
                  { color: state.type === 'dress' ? '#FFFFFF' : colors.ink },
                ]}
              >
                Dress
              </Text>
              <Text
                style={[
                  styles.modeSub,
                  {
                    color:
                      state.type === 'dress'
                        ? 'rgba(255,255,255,0.8)'
                        : colors.muted,
                  },
                ]}
              >
                Full outfit try-on
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upper / Lower"
              disabled={busy}
              onPress={() => state.setType('upper_lower')}
              style={[
                styles.modeCard,
                state.type === 'upper_lower' && styles.modeCardActive,
              ]}
            >
              <MaterialIcons
                name="dry-cleaning"
                size={24}
                color={state.type === 'upper_lower' ? '#FFFFFF' : colors.ink}
              />
              <Text
                style={[
                  styles.modeTitle,
                  {
                    color:
                      state.type === 'upper_lower' ? '#FFFFFF' : colors.ink,
                  },
                ]}
              >
                Upper / Lower
              </Text>
              <Text
                style={[
                  styles.modeSub,
                  {
                    color:
                      state.type === 'upper_lower'
                        ? 'rgba(255,255,255,0.8)'
                        : colors.muted,
                  },
                ]}
              >
                Top or bottom try-on
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 4. Upload Slots */}
      <View style={{ gap: 10 }}>
        <Text style={typography.titleLarge}>Your uploads</Text>
        {(
          ['model', ...(state.product ? [] : state.type === 'dress' ? ['dress'] : ['upper', 'lower'])] as Slot[]
        ).map((slot) => {
          const hasImage = !!state.images[slot];
          const slotLabel =
            slot === 'model'
              ? 'Model photo (full body)'
              : slot === 'dress'
              ? 'Outfit / Dress'
              : slot === 'upper'
              ? 'Top / Shirt'
              : 'Bottom / Pants';

          return (
            <GlassSurface key={slot} radius={24} padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {hasImage ? (
                  <Image
                    source={{ uri: state.images[slot]!.uri }}
                    style={{ width: 80, height: 80, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <MaterialIcons
                      name={slot === 'model' ? 'person' : 'checkroom'}
                      size={32}
                      color={colors.mutedSoft}
                    />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={typography.titleMedium}>{slotLabel}</Text>
                  <Text style={typography.bodySmall}>
                    {hasImage ? 'Photo uploaded' : 'Select a clear photo'}
                  </Text>
                </View>
              </View>

              <MiroirButton
                label={`Choose ${slot} image`}
                icon="add-photo-alternate"
                isSecondary
                disabled={busy}
                onPress={() => void pick(slot)}
                style={{ marginTop: 12 }}
              />
            </GlassSurface>
          );
        })}
      </View>

      {/* Privacy Notice & Consent under Law 91/2025/QH15 & Apple Guideline 5.1.1 */}
      <View style={styles.consentCard}>
        <MaterialIcons name="security" size={18} color={colors.primary} />
        <Text style={styles.consentText}>
          Bằng việc bắt đầu thử đồ, bạn xác nhận từ đủ 18 tuổi và đồng ý với{' '}
          <Text
            style={styles.consentLink}
            onPress={() => router.push('/terms')}
          >
            Chính sách bảo vệ dữ liệu AI Virtual Try-On
          </Text>
          . Ảnh không sử dụng để nhận dạng sinh trắc học và tự động xoá sau 24h.
        </Text>
      </View>

      {/* 5. Start Action */}
      <MiroirButton
        label={
          busy
            ? state.status === 'creating'
              ? 'Đang khởi tạo...'
              : 'Đang xử lý hình ảnh...'
            : 'Start try-on'
        }
        icon="auto-awesome"
        busy={busy}
        onPress={() => void state.submit()}
      />

      {busy && (
        <View style={styles.processingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.processingTitle}>Đang kết hợp trang phục & AI</Text>
            <Text style={styles.processingSub}>
              Hệ thống đang xử lý chi tiết trang phục và khớp dáng người. Quá trình mất khoảng 15-30 giây...
            </Text>
          </View>
        </View>
      )}

      {/* 6. Try-On Result Section */}
      {!!state.resultUrl && (
        <GlassSurface radius={28} padding={18} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons
              name="auto-awesome"
              size={22}
              color={colors.accentStrong}
            />
            <Text style={typography.headlineSmall}>Your new look</Text>
          </View>
          <Image
            accessibilityLabel="Try-on result"
            source={{ uri: state.resultUrl }}
            style={{ width: '100%', height: 460, borderRadius: 20 }}
            resizeMode="contain"
          />
        </GlassSurface>
      )}

      <MiroirButton
        label="Reset"
        isSecondary
        icon="refresh"
        onPress={state.reset}
      />
    </Screen>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.ink,
  },
  headerSub: {
    ...typography.bodyLarge,
    color: colors.muted,
    marginTop: 2,
  },
  accessibleHidden: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  heroCard: {
    width: '100%',
    height: 280,
    borderRadius: radii.largeCard,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    position: 'relative',
  },
  heroInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14.5,
    color: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 240,
    lineHeight: 20,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  modeCardActive: {
    backgroundColor: colors.glassSelected,
    borderColor: 'transparent',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  modeSub: {
    fontSize: 12,
    marginTop: 4,
  },
  uploadPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F4F7F2',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E5CF',
  },
  consentText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
    flex: 1,
  },
  consentLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  processingSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
});
