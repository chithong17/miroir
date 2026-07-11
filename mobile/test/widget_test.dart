import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miroir_mobile/app/app.dart';

void main() {
  testWidgets('first launch shows onboarding then auth choice',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const MiroirApp());
    await tester.pumpAndSettle();

    expect(find.text('Welcome to MIROIR'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.text('Start your fashion flow'), findsOneWidget);
    expect(find.text('Continue as guest'), findsOneWidget);
  });

  testWidgets('guest session opens customer shell and guest account actions',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({
      'miroir.has_seen_onboarding': true,
      'miroir.customer_guest_mode': true,
    });

    await tester.pumpWidget(const MiroirApp());
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('Shop'), findsOneWidget);
    expect(find.text('Try On'), findsOneWidget);
    expect(find.text('Stylist'), findsOneWidget);
    expect(find.text('Account'), findsOneWidget);

    await tester.tap(find.text('Account'));
    await tester.pumpAndSettle();

    expect(find.text('Guest mode'), findsOneWidget);
    expect(find.text('Run Health Check'), findsOneWidget);
    expect(find.text('Login'), findsWidgets);
  });
}
