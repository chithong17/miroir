import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miroir_mobile/core/app/app_session_controller.dart';
import 'package:miroir_mobile/features/account/data/account_models.dart';

void main() {
  test('session controller restores onboarding flag and saved owner session', () async {
    SharedPreferences.setMockInitialValues({});
    final controller = AppSessionController();

    await controller.completeOnboarding();
    await controller.saveAuthResult(
      OwnerAuthResult(
        success: true,
        owner: const ShopOwner(
          id: 'owner-1',
          email: 'owner@example.com',
          name: 'Owner',
          status: 'active',
        ),
        token: 'token-123',
      ),
    );

    final restored = AppSessionController();
    await restored.restoreSession();
    expect(restored.hasSeenOnboarding, true);
    expect(restored.shouldShowOnboarding, false);
    expect(restored.isSignedIn, true);
    expect(restored.session?.owner.email, 'owner@example.com');

    await restored.logout();
    expect(restored.isSignedIn, false);
  });
}
