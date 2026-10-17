import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { customerApi } from '../../api/customer';
import { useSession } from '../../stores/session';
import {
  ErrorNotice,
  Field,
  GlassSurface,
  MiroirButton,
  SurfaceIconButton,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';
import { router } from 'expo-router';
import { Onboarding } from './Onboarding';

export function Entry() {
  const session = useSession();
  const [mode, setMode] = useState<'choice' | 'login' | 'register' | 'reset'>('choice');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetStage, setResetStage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      if (!email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Enter a valid email address.');
      }
      if (mode === 'reset') {
        if (resetStage === 0) {
          await customerApi.requestReset(email, 'user');
          setResetStage(1);
        } else if (resetStage === 1) {
          await customerApi.verifyReset(email, otp, 'user');
          setResetStage(2);
        } else {
          if (password.length < 8) throw new Error('Use at least 8 characters.');
          await customerApi.confirmReset(email, otp, password, 'user');
          setMode('login');
          setResetStage(0);
        }
      } else {
        if (!password) throw new Error('Enter your password.');
        if (mode === 'register' && !name.trim()) throw new Error('Enter your name.');
        await session.authenticate(
          mode === 'register'
            ? await customerApi.register(name, email, password)
            : await customerApi.login(email, password)
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!session.hasSeenOnboarding) return <Onboarding />;

  // 1. Auth Choice View matching Flutter AuthChoicePage
  if (mode === 'choice') {
    return (
      <View style={styles.choiceContainer}>
        <Image
          source={require('../../../assets/images/auth-bg.png')}
          style={[StyleSheet.absoluteFill, {width: '100%', height: '100%'}]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(250, 251, 252, 0.65)', 'rgba(243, 246, 249, 0.85)']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.choiceSafe}>
          <View style={styles.choiceHeader}>
            <Text style={styles.brandTitle}>MIROIR</Text>
          </View>

          <View style={styles.choiceCenter}>
            <GlassSurface
              radius={radii.largeCard}
              blurIntensity={24}
              padding={24}
              style={styles.choiceCard}
            >
              <Text style={styles.choiceHeading}>Start your fashion flow</Text>
              <Text style={styles.choiceBody}>
                Sign in to keep your profile and personalized styling, or continue as a guest to browse the marketplace first.
              </Text>

              <ErrorNotice message={session.error} />

              <View style={styles.choiceActions}>
                <MiroirButton
                  label="Login"
                  icon="lock-open"
                  onPress={() => {
                    setError('');
                    setMode('login');
                  }}
                />
                <MiroirButton
                  label="Register"
                  icon="person-add-alt-1"
                  isSecondary
                  onPress={() => {
                    setError('');
                    setMode('register');
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue as guest"
                  onPress={() => void session.continueAsGuest()}
                  style={({ pressed }) => [
                    styles.guestButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.guestButtonText}>Continue as guest</Text>
                </Pressable>
                <Text style={styles.guestNote}>
                  Guest mode can browse products and outfits. Sign in later for saved profile, profile photo, and personalized flows.
                </Text>
              </View>
            </GlassSurface>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 2. Auth Form View matching Flutter CustomerAuthPage
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  return (
    <View style={styles.formContainer}>
      {/* Top half background banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../../../assets/images/auth-bg.png')}
          style={[StyleSheet.absoluteFill, {width: '100%', height: '100%'}]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.35)', 'transparent', 'rgba(0, 0, 0, 0.25)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle sparkle watermark */}
        <View style={styles.watermark}>
          <MaterialIcons name="auto-awesome" size={240} color="rgba(255, 255, 255, 0.22)" />
        </View>

        <SafeAreaView edges={['top', 'left', 'right']} style={styles.bannerSafe}>
          <View style={styles.bannerNav}>
            <SurfaceIconButton
              icon="arrow-back-ios-new"
              onPress={() => {
                setError('');
                setMode('choice');
              }}
            />
          </View>
          <View style={styles.bannerTitles}>
            <Text style={styles.bannerBrand}>MIROIR</Text>
            <Text style={styles.bannerTitleText}>
              {isRegister
                ? 'Create Your Account\nand Start Styling'
                : isReset
                ? 'Reset your password\nto regain access'
                : 'Log in to stay on\ntop of your wardrobe.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Sheet Card */}
      <KeyboardAvoidingView
        style={styles.sheetWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>
            {isRegister ? 'Sign up' : isReset ? 'Reset password' : 'Login'}
          </Text>

          <View style={styles.sheetSwitchRow}>
            <Text style={styles.sheetSwitchText}>
              {isRegister
                ? 'Already have an account? '
                : "Don't have an account? "}
            </Text>
            <Pressable
              onPress={() => {
                setError('');
                setMode(isRegister ? 'login' : 'register');
              }}
            >
              <Text style={styles.sheetSwitchLink}>
                {isRegister ? 'Login' : 'Sign Up'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.fieldsContainer}>
            {isRegister && (
              <Field
                label="Name"
                icon="person-outline"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            )}

            <Field
              label="Email"
              icon="email"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {isReset && resetStage > 0 && (
              <Field
                label="Verification code"
                icon="verified-user"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />
            )}

            {(!isReset || resetStage === 2) && (
              <Field
                label="Password"
                icon="lock-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            )}

            {!isRegister && !isReset && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password?"
                onPress={() => {
                  setError('');
                  setMode('reset');
                }}
                style={styles.forgotPassButton}
              >
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </Pressable>
            )}

            <ErrorNotice message={error} />

            {isRegister && (
              <View style={styles.termsAgreementBox}>
                <Text style={styles.termsAgreementText}>
                  Bằng việc đăng ký tài khoản, bạn đồng ý với{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push('/terms')}
                  >
                    Điều khoản dịch vụ & Chính sách bảo vệ dữ liệu AI Virtual Try-On
                  </Text>{' '}
                  của MIROIR.
                </Text>
              </View>
            )}

            <View style={{ marginTop: 8 }}>
              <MiroirButton
                label={
                  isReset
                    ? ['Send code', 'Verify code', 'Save password'][resetStage]
                    : isRegister
                    ? 'Create account'
                    : 'Sign in'
                }
                busy={busy}
                onPress={() => void submit()}
              />
            </View>

            <MiroirButton
              label="Back"
              isSecondary
              onPress={() => {
                setError('');
                setMode('choice');
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  choiceContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  choiceSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  choiceHeader: {
    marginBottom: 12,
  },
  brandTitle: {
    ...typography.headlineSmall,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  choiceCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceCard: {
    width: '100%',
    maxWidth: 440,
  },
  choiceHeading: {
    ...typography.headlineMedium,
    color: colors.ink,
    marginBottom: 10,
  },
  choiceBody: {
    ...typography.bodyLarge,
    color: colors.ink,
    marginBottom: 20,
    lineHeight: 22,
  },
  choiceActions: {
    gap: 12,
    marginTop: 4,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.mossDark,
  },
  guestNote: {
    ...typography.bodySmall,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bannerContainer: {
    height: 270,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.ink,
  },
  watermark: {
    position: 'absolute',
    top: -50,
    right: -30,
  },
  bannerSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  bannerNav: {
    flexDirection: 'row',
  },
  bannerTitles: {
    gap: 4,
  },
  bannerBrand: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.0,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bannerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  sheetWrapper: {
    flex: 1,
    marginTop: -28,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  sheetTitle: {
    ...typography.headlineMedium,
    textAlign: 'center',
    color: colors.ink,
  },
  sheetSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  sheetSwitchText: {
    ...typography.bodyMedium,
    color: colors.muted,
  },
  sheetSwitchLink: {
    ...typography.bodyMedium,
    color: colors.accentStrong,
    fontWeight: '700',
  },
  fieldsContainer: {
    gap: 16,
  },
  forgotPassButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.accentStrong,
  },
  termsAgreementBox: {
    backgroundColor: '#F4F7F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E5CF',
    marginTop: 4,
  },
  termsAgreementText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
