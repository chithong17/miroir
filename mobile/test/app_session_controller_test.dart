import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miroir_mobile/core/app/app_session_controller.dart';
import 'package:miroir_mobile/features/customer/data/customer_models.dart';
import 'package:miroir_mobile/features/customer/data/customer_service.dart';

class _FakeCustomerService extends CustomerService {
  _FakeCustomerService(this.user);

  final CustomerUser user;

  @override
  Future<CustomerUser> getMe(String token) async => user;
}

void main() {
  const profile = UserProfile(
    gender: '',
    bodyShape: '',
    skinTone: '',
    stylePreferences: [],
    measurements: UserMeasurements(),
    modelImageUrl: '',
    modelImagePublicId: '',
  );

  const completeUser = CustomerUser(
    id: 'user-1',
    email: 'user@example.com',
    name: 'Demo User',
    status: 'active',
    profile: profile,
    profileCompleted: true,
    profileSkipped: false,
  );

  test('session controller restores onboarding state and guest mode', () async {
    SharedPreferences.setMockInitialValues({
      'miroir.has_seen_onboarding': true,
      'miroir.customer_guest_mode': true,
    });

    final controller = AppSessionController();
    await controller.restoreSession();

    expect(controller.hasSeenOnboarding, true);
    expect(controller.isGuestMode, true);
    expect(controller.entryStage, AppEntryStage.app);
    expect(controller.isSignedIn, false);
  });

  test(
      'session controller saves auth result and opens profile stage when needed',
      () async {
    SharedPreferences.setMockInitialValues({
      'miroir.has_seen_onboarding': true,
    });

    final controller = AppSessionController();
    await controller.restoreSession();

    await controller.saveUserAuthResult(
      const UserAuthResult(
        success: true,
        token: 'token-123',
        user: CustomerUser(
          id: 'user-2',
          email: 'new@example.com',
          name: 'New User',
          status: 'active',
          profile: profile,
          profileCompleted: false,
          profileSkipped: false,
        ),
      ),
    );

    expect(controller.isSignedIn, true);
    expect(controller.currentUser?.email, 'new@example.com');
    expect(controller.entryStage, AppEntryStage.profileOnboarding);
  });

  test('session controller restores saved customer session', () async {
    SharedPreferences.setMockInitialValues({
      'miroir.has_seen_onboarding': true,
      'miroir.customer_session':
          '{"user":{"id":"user-1","email":"user@example.com","name":"Demo User","status":"active","profile":{"gender":"","bodyShape":"","skinTone":"","stylePreferences":[],"measurements":{},"modelImageUrl":"","modelImagePublicId":""},"profileCompleted":true,"profileSkipped":false},"token":"token-123"}',
    });

    final controller = AppSessionController(
      customerService: _FakeCustomerService(completeUser),
    );

    await controller.restoreSession();

    expect(controller.isSignedIn, true);
    expect(controller.currentUser?.name, 'Demo User');
    expect(controller.entryStage, AppEntryStage.app);

    await controller.logout();
    expect(controller.isSignedIn, false);
    expect(controller.isGuestMode, true);
  });
}
