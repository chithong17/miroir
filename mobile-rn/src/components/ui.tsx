import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/tokens';

export function Screen({
  children,
  scrollable = true,
  contentStyle,
  style,
  header,
  footer,
}: PropsWithChildren<{
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}>) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      {header}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, padding: 18 }, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
      {footer}
    </SafeAreaView>
  );
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  style,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.appHeader, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {showBack && (
          <SurfaceIconButton
            icon="arrow-back"
            size={40}
            onPress={onBack}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.appHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.appHeaderSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction && <View style={styles.appHeaderAction}>{rightAction}</View>}
    </View>
  );
}

export function Heading({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Subheading({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.subheading, style]}>{children}</Text>;
}

export function Body({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function GlassSurface({
  children,
  radius = 28,
  padding = 18,
  style,
  borderColor = colors.glassLineSoft,
  backgroundColor = colors.glass,
  blurIntensity = 25,
}: PropsWithChildren<{
  radius?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  backgroundColor?: string;
  blurIntensity?: number;
}>) {
  const containerRadius = { borderRadius: radius };

  return (
    <View style={[styles.glassShadow, containerRadius, style]}>
      <View style={[styles.glassWrapper, containerRadius, { borderColor }]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={blurIntensity}
            tint="light"
            style={[StyleSheet.absoluteFill, containerRadius]}
          />
        ) : (
          <LinearGradient
            colors={[colors.glassStrong, backgroundColor]}
            style={[StyleSheet.absoluteFill, containerRadius]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <View style={styles.glassHighlight} />
        <View style={{ padding }}>{children}</View>
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  isGlass = false,
  radius = radii.card,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  isGlass?: boolean;
  radius?: number;
}>) {
  if (isGlass) {
    return (
      <GlassSurface radius={radius} style={style}>
        {children}
      </GlassSurface>
    );
  }
  return <View style={[styles.card, { borderRadius: radius }, style]}>{children}</View>;
}

export function GlassPill({
  label,
  icon,
  isSelected = false,
  onPress,
  style,
}: {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <View
      style={[
        styles.pillContainer,
        isSelected
          ? { backgroundColor: colors.glassSelected }
          : { backgroundColor: colors.glassStrong, borderColor: colors.glassLineSoft, borderWidth: 1 },
        style,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={14}
          color={isSelected ? '#FFFFFF' : colors.ink}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={[
          styles.pillText,
          { color: isSelected ? '#FFFFFF' : colors.ink },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.75 }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export function MiroirButton({
  label,
  onPress,
  busy = false,
  isSecondary = false,
  disabled = false,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  busy?: boolean;
  isSecondary?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = isSecondary ? colors.accentSoft : colors.accentStrong;
  const fg = isSecondary ? colors.ink : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.miroirButton,
        { backgroundColor: bg },
        isSecondary && { borderWidth: 1, borderColor: colors.line },
        (pressed || busy || disabled) && { opacity: 0.65 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.buttonInner}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={18}
              color={fg}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.miroirButtonText, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Backward-compatible alias for Button
export function Button({
  title,
  onPress,
  busy = false,
  secondary = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MiroirButton
      label={title}
      onPress={onPress}
      busy={busy}
      isSecondary={secondary}
      disabled={disabled}
      icon={icon}
      style={style}
    />
  );
}

export function SurfaceIconButton({
  icon,
  onPress,
  isDark = false,
  size = 46,
  isGlass = true,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  isDark?: boolean;
  size?: number;
  isGlass?: boolean;
}) {
  const bg = isDark ? colors.glassSelected : isGlass ? colors.glass : '#FFFFFF';
  const fg = isDark ? '#FFFFFF' : colors.ink;
  const border = isDark ? 'transparent' : isGlass ? colors.glassLine : colors.line;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.surfaceIconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: border,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <MaterialIcons name={icon} size={20} color={fg} />
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  style,
  ...props
}: TextInputProps & {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={colors.mutedSoft}
            style={{ marginLeft: 16, marginRight: -4 }}
          />
        )}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedSoft}
          style={[styles.input, icon ? { paddingLeft: 12 } : undefined, style]}
          {...props}
        />
      </View>
    </View>
  );
}

export function ErrorNotice({
  message,
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialIcons name="error-outline" size={18} color="#D95D5D" />
        <Text style={{ color: '#D95D5D', fontSize: 13.5, fontWeight: '500', flex: 1 }}>
          {message}
        </Text>
      </View>
      {retry && <MiroirButton label="Try again" onPress={retry} isSecondary />}
    </View>
  );
}

export function ListItemRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  selected = false,
  badge,
  style,
}: {
  leading?: React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  badge?: number | string;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <View
      style={[
        styles.listItemRow,
        selected && { backgroundColor: colors.accentSoft, borderColor: colors.mossSoft },
        style,
      ]}
    >
      {leading && <View style={styles.listItemLeading}>{leading}</View>}
      <View style={{ flex: 1, gap: 3 }}>
        {typeof title === 'string' ? (
          <Text style={styles.listItemTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Text style={styles.listItemSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </View>
      {badge !== undefined && (
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {trailing && <View style={styles.listItemTrailing}>{trailing}</View>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.8 }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export function SelectionChip({
  label,
  selected = false,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionChip,
        selected
          ? { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong }
          : { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={16}
          color={selected ? '#FFFFFF' : colors.ink}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={[
          styles.selectionChipText,
          { color: selected ? '#FFFFFF' : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function RadioRow({
  title,
  subtitle,
  selected,
  onSelect,
  style,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onSelect}
      style={({ pressed }) => [
        styles.radioRow,
        selected && { borderColor: colors.accentStrong, backgroundColor: colors.panel },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <View
        style={[
          styles.radioCircle,
          selected && { borderColor: colors.accentStrong },
        ]}
      >
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.radioTitle}>{title}</Text>
        {subtitle ? <Text style={styles.radioSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  style,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stepperContainer, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({ pressed }) => [
          styles.stepperButton,
          value <= min && { opacity: 0.4 },
          pressed && { opacity: 0.6 },
        ]}
      >
        <MaterialIcons name="remove" size={16} color={colors.ink} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({ pressed }) => [
          styles.stepperButton,
          value >= max && { opacity: 0.4 },
          pressed && { opacity: 0.6 },
        ]}
      >
        <MaterialIcons name="add" size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function StatusBadge({
  status,
  label,
  style,
}: {
  status: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const norm = status.toLowerCase().replace(/[\s-]/g, '_');
  let bg = '#F3F4F6';
  let fg = '#4B5563';

  if (['completed', 'delivered', 'paid', 'active', 'success', 'confirmed'].includes(norm)) {
    bg = colors.accentSoft;
    fg = '#3D6325';
  } else if (['shipping', 'shipped', 'in_stock', 'processing', 'preparing'].includes(norm)) {
    bg = '#E8F0FE';
    fg = '#1967D2';
  } else if (['pending', 'pending_confirmation', 'awaiting_payment'].includes(norm)) {
    bg = '#FEF3C7';
    fg = '#92400E';
  } else if (['cancelled', 'failed', 'refunded', 'rejected', 'archived', 'out_of_stock'].includes(norm)) {
    bg = colors.dangerSoft;
    fg = '#B91C1C';
  }

  const display = label || norm.replace(/_/g, ' ');

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }, style]}>
      <Text style={[styles.statusBadgeText, { color: fg }]}>{display}</Text>
    </View>
  );
}

export function ModalSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={styles.sheetHandle} />
              {title && (
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{title}</Text>
                  <SurfaceIconButton
                    icon="close"
                    size={36}
                    onPress={onClose}
                  />
                </View>
              )}
              <ScrollView
                style={{ maxHeight: '80%' }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  appHeaderTitle: {
    ...typography.titleLarge,
  },
  appHeaderSubtitle: {
    ...typography.bodySmall,
    marginTop: 1,
  },
  appHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  heading: {
    ...typography.headlineMedium,
  },
  subheading: {
    ...typography.titleLarge,
  },
  body: {
    ...typography.bodyLarge,
    color: colors.muted,
  },
  glassShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  glassWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: colors.glassHighlight,
    zIndex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  miroirButton: {
    minHeight: 50,
    borderRadius: radii.button,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miroirButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  surfaceIconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.muted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 14,
  },
  listItemLeading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: colors.muted,
  },
  listItemTrailing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: '#E55353',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  selectionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 16,
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.mutedSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.accentStrong,
  },
  radioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  radioSubtitle: {
    fontSize: 13,
    color: colors.muted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 33, 15, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: '90%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginVertical: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sheetTitle: {
    ...typography.titleLarge,
  },
});
