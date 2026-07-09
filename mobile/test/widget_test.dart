import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miroir_mobile/app/app.dart';

void main() {
  testWidgets('first launch shows onboarding flow', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const MiroirApp());
    await tester.pumpAndSettle();

    expect(find.text('Welcome to MIROIR'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
  });

  testWidgets(
    'app shell renders navigation, customer flows, and signed-out owner entry',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'miroir.has_seen_onboarding': true,
      });

      await tester.pumpWidget(const MiroirApp());
      await tester.pumpAndSettle();

      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Try On'), findsOneWidget);
      expect(find.text('Stylist'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);
      expect(find.text('Hello, Vanessa'), findsOneWidget);

      await tester.tap(find.text('Try On'));
      await tester.pumpAndSettle();
      expect(find.text('Virtual Try-On'), findsOneWidget);
      expect(find.text('Your Photo'), findsOneWidget);
      expect(find.text('Mode'), findsOneWidget);

      await tester.tap(find.text('Stylist'));
      await tester.pumpAndSettle();
      expect(find.text('AI Stylist'), findsOneWidget);
      expect(find.text('Generate 5 Outfits'), findsOneWidget);

      await tester.tap(find.text('Account'));
      await tester.pumpAndSettle();
      expect(find.text('Shop Owner Access'), findsOneWidget);
      expect(find.text('Run Health Check'), findsOneWidget);
    },
  );
}
