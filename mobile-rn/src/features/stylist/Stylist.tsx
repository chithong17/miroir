import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { request } from '../../api/client';
import { useSession } from '../../stores/session';
import {
  ErrorNotice,
  Field,
  GlassPill,
  GlassSurface,
  MiroirButton,
  Screen,
  SurfaceIconButton,
} from '../../components/ui';
import { colors, radii, typography } from '../../theme/tokens';
import { money } from '../marketplace/Marketplace';

interface Outfit {
  id: string;
  title: string;
  score: number;
  whyItMatches: string;
  fitWarnings: string[];
  fashionTips: string[];
  items: {
    reason: string;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string;
    };
  }[];
}

interface Result {
  success: boolean;
  noMatch: boolean;
  message?: string;
  analysis: {
    bodyShape: string;
    skinTone: string;
    styleMatch: string;
  };
  outfits: Outfit[];
  fitWarnings: string[];
  fashionTips: string[];
}

const SUGGESTIONS = [
  'Minimalist weekend casual',
  'Formal dinner date outfit',
  'Streetwear monochrome look',
];

export function Stylist() {
  const { token, user } = useSession();
  const [prompt, setPrompt] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [count, setCount] = useState('5');
  const [preferences, setPreferences] = useState(
    user?.profile.stylePreferences?.join(', ') || ''
  );
  const [bodyShape, setBodyShape] = useState(user?.profile.bodyShape || '');
  const [skinTone, setSkinTone] = useState(user?.profile.skinTone || '');
  const [feedbackText, setFeedbackText] = useState('');
  const [showOptionalProfile, setShowOptionalProfile] = useState(true);

  const recommendation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Please sign in to use your personal stylist.');
      if (!prompt.trim()) throw new Error('Describe the occasion or look you want.');
      const desiredOutfitCount = Number(count);
      if (
        !Number.isInteger(desiredOutfitCount) ||
        desiredOutfitCount < 1 ||
        desiredOutfitCount > 5
      ) {
        throw new Error('Choose between 1 and 5 outfits.');
      }
      const budget: Record<string, number> = {};
      for (const [key, value] of [
        ['min', min],
        ['max', max],
      ]) {
        if (value.trim()) {
          const amount = Number(value);
          if (!Number.isFinite(amount) || amount < 0) {
            throw new Error('Enter a valid budget.');
          }
          budget[key] = amount;
        }
      }
      if (budget.min !== undefined && budget.max !== undefined && budget.min > budget.max) {
        throw new Error('Minimum budget cannot exceed maximum.');
      }
      return request<Result>('POST', '/stylist/recommend', token, {
        prompt: prompt.trim(),
        desiredOutfitCount,
        userId: user?.id,
        gender: user?.profile.gender,
        budget,
        profile: {
          bodyShape,
          skinTone,
          stylePreferences: preferences
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          feedback: feedbackText,
        },
      });
    },
  });

  const feedback = useMutation({
    mutationFn: ({ outfit, eventType }: { outfit: Outfit; eventType: string }) =>
      request('POST', '/stylist/feedback', token, {
        userId: user?.id,
        outfitId: outfit.id,
        eventType,
        productIds: outfit.items.map((item) => item.product.id),
      }),
  });

  const result = recommendation.data;

  return (
    <Screen contentStyle={styles.content}>
      {/* 1. Header with back button, title, and Live badge */}
      <View style={styles.headerRow}>
        <SurfaceIconButton
          icon="arrow-back-ios-new"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
        />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AI Stylist</Text>
        </View>
        <GlassPill label="Live" icon="auto-awesome" isSelected />
      </View>

      {/* 2. Stylist Hero Card matching Flutter _StylistHero */}
      <View style={styles.heroCard}>
        <Image
          source={require('../../../assets/images/stylist.png')}
          style={[StyleSheet.absoluteFill, {width: '100%', height: '100%'}]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(23, 33, 15, 0.85)',
            'rgba(23, 33, 15, 0.40)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInner}>
          <Text style={styles.heroTitle}>Your style,{'\n'}reimagined</Text>
          <Text style={styles.heroSubtitle}>
            Describe your vibe and receive grounded outfit ideas tailored for you.
          </Text>
          <GlassPill label="Curated by AI" icon="auto-awesome" />
        </View>
      </View>

      {/* 3. "Describe the look" Section Card */}
      <GlassSurface radius={30} padding={20}>
        <View style={styles.describeHeader}>
          <View style={styles.editIconBubble}>
            <MaterialIcons name="edit" size={24} color={colors.mossDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.titleLarge}>Describe the look</Text>
            <Text style={typography.bodyMedium}>
              Share your vibe, silhouette, or occasion.
            </Text>
          </View>
        </View>

        <TextInput
          accessibilityLabel="Occasion / request"
          placeholder="e.g. Minimalist linen suit for a rooftop gallery opening..."
          placeholderTextColor={colors.mutedSoft}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          style={styles.promptInput}
        />

        {/* Suggestion Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionRow}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setPrompt(s)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Optional Profile Accordion */}
        <Pressable
          onPress={() => setShowOptionalProfile(!showOptionalProfile)}
          style={styles.accordionToggle}
        >
          <View style={{ flex: 1 }}>
            <Text style={typography.titleMedium}>Optional profile</Text>
            <Text style={typography.bodySmall}>
              Budget, shape, tone and style preferences
            </Text>
          </View>
          <MaterialIcons
            name={showOptionalProfile ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.ink}
          />
        </Pressable>

        {showOptionalProfile && (
          <View style={styles.accordionContent}>
            <Field
              label="Body shape"
              placeholder="e.g. Hourglass, Athletic, Lean"
              value={bodyShape}
              onChangeText={setBodyShape}
            />
            <Field
              label="Skin tone"
              placeholder="e.g. Warm, Cool, Neutral"
              value={skinTone}
              onChangeText={setSkinTone}
            />
            <Field
              label="Style preferences (comma separated)"
              placeholder="Minimalist, Elegant, Streetwear"
              value={preferences}
              onChangeText={setPreferences}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Minimum budget"
                  keyboardType="numeric"
                  placeholder="0"
                  value={min}
                  onChangeText={setMin}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Maximum budget"
                  keyboardType="numeric"
                  placeholder="2000000"
                  value={max}
                  onChangeText={setMax}
                />
              </View>
            </View>
            <Field
              label="Outfit count"
              keyboardType="number-pad"
              value={count}
              onChangeText={setCount}
            />
            <Field
              label="Improve previous recommendations"
              placeholder="Notes or feedback..."
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
          </View>
        )}

        <View style={{ marginTop: 18 }}>
          <MiroirButton
            label={recommendation.isPending ? 'Generating...' : 'Find my looks'}
            icon="auto-awesome"
            busy={recommendation.isPending}
            onPress={() => recommendation.mutate()}
          />
        </View>

        <ErrorNotice message={recommendation.error?.message} />
      </GlassSurface>

      {/* 4. Results Section */}
      {result && (
        <View style={{ gap: 16 }}>
          {result.message ? (
            <GlassSurface radius={22} padding={16}>
              <Text style={typography.bodyMedium}>{result.message}</Text>
            </GlassSurface>
          ) : null}

          {result.noMatch && (
            <GlassSurface radius={22} padding={16}>
              <Text style={{ color: colors.muted, textAlign: 'center' }}>
                No matching looks yet. Try another request or budget.
              </Text>
            </GlassSurface>
          )}

          {result.outfits?.map((outfit) => (
            <GlassSurface key={outfit.id} radius={28} padding={20}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons
                  name="auto-awesome"
                  size={20}
                  color={colors.accentStrong}
                />
                <Text style={typography.headlineSmall}>{outfit.title}</Text>
              </View>
              <Text style={[typography.bodyMedium, { marginTop: 6 }]}>
                {outfit.whyItMatches} · Match score {outfit.score}
              </Text>

              <View style={{ marginTop: 14, gap: 12 }}>
                {outfit.items.map((item) => (
                  <View key={item.product.id} style={styles.resultItemCard}>
                    {item.product.imageUrl ? (
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.resultItemImg}
                        resizeMode="contain"
                      />
                    ) : null}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={typography.titleMedium}>
                        {item.product.name}
                      </Text>
                      <Text style={marketPriceText}>
                        {money(item.product.price)}
                      </Text>
                      <Text style={typography.bodySmall}>{item.reason}</Text>
                      <MiroirButton
                        label="View product"
                        isSecondary
                        onPress={() => router.push(`/product/${item.product.id}`)}
                        style={{ marginTop: 6, minHeight: 38 }}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <MiroirButton
                    label="Love this look"
                    icon="favorite"
                    busy={feedback.isPending}
                    onPress={() => feedback.mutate({ outfit, eventType: 'liked' })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MiroirButton
                    label="Not my style"
                    icon="thumb-down"
                    isSecondary
                    busy={feedback.isPending}
                    onPress={() =>
                      feedback.mutate({ outfit, eventType: 'disliked' })
                    }
                  />
                </View>
              </View>
            </GlassSurface>
          ))}
        </View>
      )}

      <ErrorNotice message={feedback.error?.message} />
      {feedback.isSuccess && (
        <GlassSurface radius={20} padding={14}>
          <Text style={{ color: colors.success, fontWeight: '700', textAlign: 'center' }}>
            Your style feedback is saved.
          </Text>
        </GlassSurface>
      )}
    </Screen>
  );
}

const marketPriceText = {
  fontSize: 14.5,
  fontWeight: '800' as const,
  color: colors.ink,
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    ...typography.titleLarge,
    color: colors.ink,
  },
  heroCard: {
    width: '100%',
    height: 360,
    borderRadius: radii.largeCard,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    position: 'relative',
  },
  heroInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    maxWidth: 240,
    lineHeight: 22,
  },
  describeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  editIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptInput: {
    backgroundColor: '#F4F6F9',
    borderRadius: radii.field,
    padding: 16,
    color: colors.ink,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  suggestionRow: {
    gap: 8,
    paddingVertical: 12,
  },
  suggestionChip: {
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ink,
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 8,
  },
  accordionContent: {
    gap: 12,
    paddingTop: 10,
  },
  resultItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
    alignItems: 'center',
  },
  resultItemImg: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: colors.canvasStrong,
  },
});
