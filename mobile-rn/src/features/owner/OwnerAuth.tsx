import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { ownerApi } from '../../api/owner';
import { customerApi } from '../../api/customer';
import { useOwner } from '../../stores/owner';
import {
  AppHeader,
  Card,
  ErrorNotice,
  Field,
  GlassSurface,
  MiroirButton,
  Screen,
  SelectionChip,
} from '../../components/ui';
import { colors, typography } from '../../theme/tokens';

export function OwnerAuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [fields, setFields] = useState({ name: '', email: '', password: '', otp: '' });
  const [stage, setStage] = useState(0);

  const auth = useMutation({
    mutationFn: async () => {
      if (!fields.email.trim() || (!fields.password && mode !== 'reset')) {
        throw new Error('Complete your email and password.');
      }
      if (mode === 'reset') {
        if (stage === 0) {
          await customerApi.requestReset(fields.email, 'shop_owner');
          setStage(1);
        } else if (stage === 1) {
          await customerApi.verifyReset(fields.email, fields.otp, 'shop_owner');
          setStage(2);
        } else {
          await customerApi.confirmReset(fields.email, fields.otp, fields.password, 'shop_owner');
          setStage(0);
          setMode('login');
        }
        return;
      }
      const result =
        mode === 'login'
          ? await ownerApi.login(fields.email, fields.password)
          : await ownerApi.register(fields.name, fields.email, fields.password);
      await useOwner.getState().authenticate(result);
    },
  });

  const getButtonTitle = () => {
    if (mode === 'reset') {
      return ['Send code', 'Verify code', 'Save password'][stage];
    }
    return mode === 'login' ? 'Sign in as owner' : 'Create owner account';
  };

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          title="Shop Owner Portal"
          showBack
          onBack={() => router.replace('/account')}
        />
      }
      contentStyle={{ padding: 20, gap: 18 }}
    >
      {/* Brand Hero Card */}
      <GlassSurface radius={26} padding={20}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.storeIconCircle}>
            <MaterialIcons name="storefront" size={28} color={colors.accentStrong} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.headlineSmall}>MIROIR Merchant</Text>
            <Text style={[typography.bodySmall, { color: colors.muted }]}>
              Isolated workspace for boutique catalog, orders, and studio analytics.
            </Text>
          </View>
        </View>
      </GlassSurface>

      {/* Mode Selector Chips */}
      <View style={styles.modeChipsRow}>
        <SelectionChip
          label="Owner Login"
          selected={mode === 'login'}
          onPress={() => {
            setMode('login');
            auth.reset();
          }}
        />
        <SelectionChip
          label="Register Shop"
          selected={mode === 'register'}
          onPress={() => {
            setMode('register');
            auth.reset();
          }}
        />
        <SelectionChip
          label="Forgot Password"
          selected={mode === 'reset'}
          onPress={() => {
            setMode('reset');
            setStage(0);
            auth.reset();
          }}
        />
      </View>

      {/* Form Card */}
      <Card style={styles.formCard}>
        {mode === 'register' && (
          <Field
            label="Shop Owner Name"
            icon="person"
            placeholder="e.g. Elena Rostova"
            value={fields.name}
            onChangeText={val => setFields(prev => ({ ...prev, name: val }))}
          />
        )}

        <Field
          label="Email Address"
          icon="email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="owner@yourshop.com"
          value={fields.email}
          onChangeText={val => setFields(prev => ({ ...prev, email: val }))}
        />

        {mode === 'reset' && stage >= 1 && (
          <Field
            label="Verification Code (OTP)"
            icon="key"
            keyboardType="number-pad"
            placeholder="6-digit code sent to email"
            value={fields.otp}
            onChangeText={val => setFields(prev => ({ ...prev, otp: val }))}
          />
        )}

        {(mode !== 'reset' || stage === 2) && (
          <Field
            label={mode === 'reset' ? 'New Password' : 'Password'}
            icon="lock"
            secureTextEntry
            placeholder="••••••••"
            value={fields.password}
            onChangeText={val => setFields(prev => ({ ...prev, password: val }))}
          />
        )}

        {mode === 'register' && (
          <Text
            style={{ fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 }}
          >
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <Text
              style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={() => router.push('/terms')}
            >
              Điều khoản dịch vụ & Chính sách MIROIR
            </Text>
            .
          </Text>
        )}

        <ErrorNotice message={auth.error?.message} />

        <MiroirButton
          label={getButtonTitle()}
          busy={auth.isPending}
          onPress={() => auth.mutate()}
        />

        {/* Backward-compatible secondary buttons for smoke tests */}
        <View style={styles.accessibleActions}>
          {(['login', 'register', 'reset'] as const)
            .filter(m => m !== mode)
            .map(m => (
              <MiroirButton
                key={m}
                label={m === 'reset' ? 'Forgot password' : m === 'login' ? 'Owner login' : 'Register owner'}
                isSecondary
                onPress={() => {
                  setMode(m);
                  if (m === 'reset') setStage(0);
                  auth.reset();
                }}
              />
            ))}
        </View>
      </Card>

      <MiroirButton
        label="Customer account"
        icon="arrow-back"
        isSecondary
        onPress={() => router.replace('/account')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  storeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  accessibleActions: {
    gap: 8,
    marginTop: 6,
  },
});
