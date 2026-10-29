import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, MiroirButton, Screen } from '../src/components/ui';
import { spacing, typography } from '../src/theme/tokens';
import { commerceLayout } from '../src/theme/commerce';
import { operatorName, privacyPolicyUrl, supportEmail } from '../src/config/support';

const sections = [
  ['About Miroir', 'Miroir connects shoppers with boutiques. Customers can browse products, save favorites, contact shops, place orders and manage returns. Shop owners have a separate workspace for catalog, orders and customer conversations.'],
  ['Your account and shopping data', 'Account details are used to sign you in. Saved pieces are linked to your account. Delivery names, addresses and phone numbers are used to fulfill orders. Order, payment and return records support delivery, reconciliation and after-sales requests.'],
  ['Messages and attachments', 'Messages and attachments you send to a shop are shared with that shop. Product and order context can be attached to a conversation. Only upload images you have permission to use. Do not include unnecessary sensitive information in chat or return evidence.'],
  ['Photos and device access', 'You choose which images to attach to products, messages or order and return evidence. This mobile app does not offer virtual try-on or AI styling. It does not ask for a full-body photo or body measurements as part of account setup.'],
  ['Orders, payments and returns', 'Review the seller, product variant, available stock, delivery address and total before placing an order. Follow the payment instructions shown for that order. Return and refund requests are handled through the order and return screens; a request is not a guarantee of approval.'],
  ['Account deletion and data requests', 'To delete a customer account, open Account and choose Delete account. To delete an independent shop owner account, use Delete shop owner account from the owner portal or Support and confirm with the current owner password. Owner deletion closes owned boutiques and removes their catalog. Transaction, return and conversation records can remain for customer support, dispute handling and applicable obligations. Signing out does not delete an account.'],
  ['Responsible use', 'Provide accurate product, stock and delivery information. Do not upload unlawful content, impersonate others, or use messages to harass or defraud people. Product photos and descriptions must belong to you or be used with permission.'],
];
export default function TermsAndPrivacy() {
  return <Screen header={<AppHeader title="Privacy & terms" subtitle="Shopping and boutique management" showBack onBack={() => router.canGoBack() ? router.back() : router.replace('/account')}/>}
    contentStyle={{ width: '100%', maxWidth: commerceLayout.formMax, alignSelf: 'center', padding: spacing.xl, gap: spacing.xl }}>
    <Text style={typography.headlineSmall}>Your shopping, your choices</Text>
    <Text style={typography.bodyLarge}>Miroir is operated by {operatorName}. This summary describes the boutique commerce mobile experience.</Text>
    {sections.map(([title, body]) => <View key={title} style={{ gap: spacing.sm }}><Text style={typography.titleLarge}>{title}</Text><Text style={typography.bodyLarge}>{body}</Text></View>)}
    <Text selectable style={typography.bodyLarge}>Questions about your data? Contact {supportEmail}.</Text>
    <Text selectable style={typography.bodyMedium}>Public privacy policy: {privacyPolicyUrl}. The website may also describe services that are not offered in this mobile release.</Text>
    <MiroirButton label="Contact Miroir support" isSecondary onPress={() => router.push('/support')}/>
  </Screen>;
}
