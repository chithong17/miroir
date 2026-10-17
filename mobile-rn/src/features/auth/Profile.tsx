import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { customerApi } from '../../api/customer';
import { useSession } from '../../stores/session';
import {
  AppHeader,
  Body,
  Button,
  Card,
  ErrorNotice,
  Field,
  GlassPill,
  GlassSurface,
  Heading,
  MiroirButton,
  Screen,
  SelectionChip,
  SurfaceIconButton,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';

export function Profile() {
  const { user, token, setUser } = useSession();
  const [fields, setFields] = useState<Record<string, string>>({
    gender: user?.profile.gender || '',
    bodyShape: user?.profile.bodyShape || '',
    skinTone: user?.profile.skinTone || '',
    stylePreferences: user?.profile.stylePreferences?.join(', ') || '',
    ...Object.fromEntries(
      Object.entries(user?.profile.measurements || {}).map(([k, v]) => [k, String(v ?? '')])
    ),
  });

  const [busy, setBusy] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function photo() {
    setIsUploadingPhoto(true);
    setError('');
    setMessage('');
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      const updatedUser = await customerApi.uploadPhoto(token, {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        file: asset.file,
      });
      setUser(updatedUser);
      setMessage('Profile photo updated successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const modelImageUrl = user?.profile.modelImageUrl || '';

  return (
    <Screen
      header={
        <AppHeader
          title="Fitting profile"
          subtitle="Personal measurements & styling parameters"
          showBack
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/account');
            }
          }}
        />
      }
    >
      {/* 1. Hero Explanation Card */}
      <GlassSurface radius={26} padding={20} style={{ marginBottom: 16 }}>
        <Text style={styles.heroHeading}>Complete your fitting profile</Text>
        <Text style={styles.heroSubtitle}>
          Measurements and a saved model photo make the stylist and future try-on flows more
          personal. You can update or skip this anytime.
        </Text>
      </GlassSurface>

      {/* 2. Photo Upload Section matching Flutter UserProfileOnboardingPage */}
      <Card style={styles.photoCard}>
        <View style={styles.photoContainer}>
          {modelImageUrl ? (
            <Image
              source={{ uri: modelImageUrl }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={38} color={colors.muted} />
              <Text style={styles.photoPlaceholderText}>
                No model photo added yet
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <MiroirButton
            label={isUploadingPhoto ? 'Uploading photo…' : 'Choose full-body photo'}
            icon="photo-camera"
            isSecondary
            busy={isUploadingPhoto}
            onPress={() => void photo()}
          />
        </View>
      </Card>

      {/* 3. Form Card */}
      <Card style={styles.formCard}>
        {/* Gender Chips */}
        <View style={{ gap: 8 }}>
          <Text style={styles.fieldSectionLabel}>Gender</Text>
          <View style={styles.chipsRow}>
            {['female', 'male', 'unisex'].map((g) => (
              <SelectionChip
                key={g}
                label={g.charAt(0).toUpperCase() + g.slice(1)}
                selected={fields.gender?.toLowerCase() === g}
                onPress={() => setFields((prev) => ({ ...prev, gender: g }))}
              />
            ))}
          </View>
        </View>

        {/* Style & Body Traits */}
        <View style={{ gap: 12, marginTop: 12 }}>
          <Field
            label="Body shape"
            placeholder="e.g. Hourglass, Rectangle, Athletic"
            value={fields.bodyShape || ''}
            onChangeText={(value) => setFields((prev) => ({ ...prev, bodyShape: value }))}
          />
          <Field
            label="Skin tone"
            placeholder="e.g. Fair, Warm, Olive, Deep"
            value={fields.skinTone || ''}
            onChangeText={(value) => setFields((prev) => ({ ...prev, skinTone: value }))}
          />
          <Field
            label="Style preferences"
            placeholder="e.g. Minimalist, Parisian, Casual, Streetwear"
            value={fields.stylePreferences || ''}
            onChangeText={(value) => setFields((prev) => ({ ...prev, stylePreferences: value }))}
          />
        </View>

        {/* Measurements Grid */}
        <View style={{ marginTop: 16 }}>
          <Text style={styles.fieldSectionLabel}>Body measurements (cm / kg)</Text>
          <Text style={styles.measurementsHint}>
            Used to suggest the best size across different brands and fits.
          </Text>

          <View style={styles.measurementsGrid}>
            {[
              { key: 'height', label: 'Height (cm)' },
              { key: 'weight', label: 'Weight (kg)' },
              { key: 'bust', label: 'Bust (cm)' },
              { key: 'waist', label: 'Waist (cm)' },
              { key: 'hips', label: 'Hips (cm)' },
              { key: 'shoulder', label: 'Shoulder (cm)' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.measureCol}>
                <Field
                  label={label}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={fields[key] || ''}
                  onChangeText={(value) => setFields((prev) => ({ ...prev, [key]: value }))}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Status Messages */}
        <ErrorNotice message={error} />
        {!!message && (
          <View style={styles.successNotice}>
            <MaterialIcons name="check-circle" size={18} color="#278E49" />
            <Text style={styles.successNoticeText}>{message}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 10, marginTop: 16 }}>
          <MiroirButton
            label={busy ? 'Saving profile…' : 'Save profile'}
            icon="check"
            busy={busy}
            onPress={() =>
              void run(async () => {
                const payload: Record<string, unknown> = {
                  stylePreferences: (fields.stylePreferences || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                };
                for (const key of ['gender', 'bodyShape', 'skinTone']) {
                  if (fields[key]?.trim()) payload[key] = fields[key].trim();
                }
                for (const key of ['height', 'weight', 'bust', 'waist', 'hips', 'shoulder']) {
                  if (fields[key]?.trim()) {
                    const value = Number(fields[key]);
                    if (!Number.isFinite(value) || value <= 0) {
                      throw new Error(`Enter a valid ${key}.`);
                    }
                    payload[key] = value;
                  }
                }
                setUser(await customerApi.profile(token, payload));
                setMessage('Profile saved successfully.');
                if (router.canGoBack()) router.back();
              })
            }
          />

          {!user?.profileCompleted && !user?.profileSkipped && (
            <MiroirButton
              label="Skip for now"
              icon="arrow-forward"
              isSecondary
              busy={busy}
              onPress={() =>
                void run(async () => {
                  setUser(await customerApi.skipProfile(token));
                  if (router.canGoBack()) router.back();
                })
              }
            />
          )}

          <MiroirButton
            label="Back to marketplace"
            icon="storefront"
            isSecondary
            onPress={() => router.replace('/')}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  photoCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  formCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 24,
  },
  fieldSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  measurementsHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  measureCol: {
    width: '48%',
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF6EC',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  successNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#278E49',
    flex: 1,
  },
});
