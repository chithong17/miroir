import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTryOn } from './state';
import { useSession } from '../../stores/session';
import { colors } from '../../theme/tokens';

export function TaskMonitor() {
  const state = useTryOn();
  const token = useSession(s => s.token);
  const pathname = usePathname();

  useEffect(() => {
    useTryOn.getState().reset();
  }, [token]);

  useEffect(() => {
    let active = AppState.currentState === 'active';
    const timer = setInterval(() => {
      if (active) void useTryOn.getState().poll();
    }, 4000);
    const sub = AppState.addEventListener('change', value => {
      active = value === 'active';
      if (active) void useTryOn.getState().poll();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const isWorking = ['creating', 'processing', 'pending'].includes(state.status);
  const hasCompleted = state.status === 'completed';
  const needsAttention = ['failed', 'timed_out'].includes(state.status);
  const hasUnreadResult = hasCompleted && state.unread;
  const isVisible = isWorking || hasUnreadResult || needsAttention;

  if (pathname.includes('try-on') || !isVisible) {
    return null;
  }

  const background = needsAttention
    ? colors.dangerSoft
    : hasCompleted
    ? colors.success
    : colors.accentStrong;

  const label = state.unread ? 'Your look is ready →' : 'Creating your look…';

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => router.push('/try-on')}
        style={({ pressed }) => [
          styles.bubbleWrapper,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
      >
        <View style={[styles.bubble, { backgroundColor: background }]}>
          {isWorking ? (
            <View style={styles.workingContent}>
              <MaterialIcons name="checkroom" size={21} color="#FFFFFF" />
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <ActivityIndicator size="small" color="#FFFFFF" style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <MaterialIcons
              name={needsAttention ? 'error-outline' : 'check'}
              size={27}
              color={needsAttention ? colors.error : '#FFFFFF'}
            />
          )}
        </View>

        {hasUnreadResult && <View style={styles.unreadBadge} />}

        {/* Hidden screen-reader label for tests/accessibility */}
        <Text style={styles.srOnly}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    bottom: 106,
    right: 18,
    zIndex: 999,
  },
  bubbleWrapper: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17210F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  workingContent: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E55353',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  srOnly: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

