import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/account/data/account_models.dart';
import '../../features/account/data/account_service.dart';
import '../../features/customer/data/customer_models.dart';
import '../../features/customer/data/customer_service.dart';
import '../../features/payments/data/payment_service.dart';
import '../constants/app_constants.dart';
import '../network/api_error.dart';

enum CustomerAuthFlow { login, register }

enum AppEntryStage {
  restoring,
  onboarding,
  authChoice,
  auth,
  profileOnboarding,
  app,
}

class AppSessionController extends ChangeNotifier {
  AppSessionController({
    AccountService? accountService,
    CustomerService? customerService,
    PaymentService? paymentService,
  })  : _accountService = accountService ?? AccountService(),
        _customerService = customerService ?? CustomerService(),
        _paymentService = paymentService ?? PaymentService();

  static const _sessionKey = 'miroir.customer_session';
  static const _ownerSessionKey = 'miroir.shop_owner_session';
  static const _guestKey = 'miroir.customer_guest_mode';
  static const _onboardingKey = 'miroir.has_seen_onboarding';

  final AccountService _accountService;
  final CustomerService _customerService;
  final PaymentService _paymentService;

  bool _isRestoring = true;
  bool _isCheckingHealth = false;
  bool _hasSeenOnboarding = false;
  bool _isGuestMode = false;
  bool _showingAuthScreen = false;
  bool _forceProfileEditor = false;
  String _sessionMessage = '';
  String _healthMessage = '';
  bool? _backendHealthy;
  CustomerAuthFlow _authFlow = CustomerAuthFlow.login;
  UserSession? _session;
  ShopOwnerSession? _ownerSession;

  bool get isRestoring => _isRestoring;
  bool get isCheckingHealth => _isCheckingHealth;
  bool get hasSeenOnboarding => _hasSeenOnboarding;
  bool get isGuestMode => _isGuestMode && _session == null;
  bool get isSignedIn => _session != null;
  bool get hasCustomerSession => _session != null;
  bool? get backendHealthy => _backendHealthy;
  String get sessionMessage => _sessionMessage;
  String get healthMessage => _healthMessage;
  String get apiBaseUrl => AppConstants.defaultApiBaseUrl;
  String get platformLabel => AppConstants.platformLabel;
  CustomerAuthFlow get authFlow => _authFlow;
  UserSession? get session => _session;
  CustomerUser? get currentUser => _session?.user;
  String get authToken => _session?.token ?? '';
  ShopOwnerSession? get shopOwnerSession => _ownerSession;
  ShopOwner? get currentShopOwner => _ownerSession?.owner;
  String get shopOwnerToken => _ownerSession?.token ?? '';
  bool get hasShopOwnerSession => _ownerSession != null;
  bool get isShopOwnerPremium =>
      _ownerSession?.owner.subscription.isPremium ?? false;
  bool get isPremium => currentUser?.subscription.isPremium ?? false;
  UserUsageQuota? get tryOnUsage => currentUser?.subscription.usage;
  int? get tryOnRemaining => tryOnUsage?.remaining;
  bool get isTryOnQuotaExhausted =>
      !isPremium && (tryOnUsage?.isExhausted ?? false);
  bool get requiresLogin => _session == null;

  AppEntryStage get entryStage {
    if (_isRestoring) return AppEntryStage.restoring;
    if (!_hasSeenOnboarding) return AppEntryStage.onboarding;

    if (_session != null) {
      if (_session!.user.needsProfileOnboarding || _forceProfileEditor) {
        return AppEntryStage.profileOnboarding;
      }
      return AppEntryStage.app;
    }

    if (_showingAuthScreen) return AppEntryStage.auth;
    if (_isGuestMode) return AppEntryStage.app;
    return AppEntryStage.authChoice;
  }

  Future<void> restoreSession() async {
    _isRestoring = true;
    notifyListeners();

    final preferences = await SharedPreferences.getInstance();
    _hasSeenOnboarding = preferences.getBool(_onboardingKey) ?? false;
    _isGuestMode = preferences.getBool(_guestKey) ?? false;

    final rawSession = preferences.getString(_sessionKey);
    if (rawSession != null && rawSession.isNotEmpty) {
      try {
        _session = UserSession.fromJson(
          jsonDecode(rawSession) as Map<String, dynamic>,
        );
      } catch (_) {
        await preferences.remove(_sessionKey);
      }
    }

    final rawOwnerSession = preferences.getString(_ownerSessionKey);
    if (rawOwnerSession != null && rawOwnerSession.isNotEmpty) {
      try {
        _ownerSession = ShopOwnerSession.fromJson(
          jsonDecode(rawOwnerSession) as Map<String, dynamic>,
        );
        await refreshShopOwnerSubscription(silent: true);
      } catch (_) {
        _ownerSession = null;
        await preferences.remove(_ownerSessionKey);
      }
    }

    if (_session != null) {
      try {
        final refreshedUser = await _customerService.getMe(_session!.token);
        _session = UserSession(user: refreshedUser, token: _session!.token);
        await preferences.setString(
            _sessionKey, jsonEncode(_session!.toJson()));
        _isGuestMode = false;
        await preferences.setBool(_guestKey, false);
      } catch (error) {
        final apiError = ApiError.from(error);
        if (apiError.isUnauthorized) {
          _session = null;
          _forceProfileEditor = false;
          _sessionMessage = 'Your session expired. Please sign in again.';
          await preferences.remove(_sessionKey);
        } else {
          _sessionMessage = apiError.message;
        }
      }
    }

    _isRestoring = false;
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    _hasSeenOnboarding = true;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_onboardingKey, true);
    notifyListeners();
  }

  void openLogin() {
    _authFlow = CustomerAuthFlow.login;
    _showingAuthScreen = true;
    notifyListeners();
  }

  void openRegister() {
    _authFlow = CustomerAuthFlow.register;
    _showingAuthScreen = true;
    notifyListeners();
  }

  void showAuthChoice() {
    _showingAuthScreen = false;
    notifyListeners();
  }

  Future<void> continueAsGuest() async {
    _session = null;
    _forceProfileEditor = false;
    _isGuestMode = true;
    _showingAuthScreen = false;
    _sessionMessage = '';
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_guestKey, true);
    await preferences.remove(_sessionKey);
    notifyListeners();
  }

  void openProfileOnboarding() {
    if (_session == null) return;
    _forceProfileEditor = true;
    notifyListeners();
  }

  Future<void> saveUserAuthResult(UserAuthResult authResult) async {
    _session = UserSession(user: authResult.user, token: authResult.token);
    _forceProfileEditor = false;
    _isGuestMode = false;
    _showingAuthScreen = false;
    _sessionMessage = '';

    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_sessionKey, jsonEncode(_session!.toJson()));
    await preferences.setBool(_guestKey, false);
    notifyListeners();
  }

  Future<void> refreshCurrentUser() async {
    if (_session == null) return;
    try {
      final refreshedUser = await _customerService.getMe(_session!.token);
      await updateCurrentUser(refreshedUser);
    } catch (error) {
      await handleApiError(ApiError.from(error));
    }
  }

  Future<void> updateCurrentUser(CustomerUser user) async {
    if (_session == null) return;
    _session = UserSession(user: user, token: _session!.token);
    _forceProfileEditor = false;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_sessionKey, jsonEncode(_session!.toJson()));
    notifyListeners();
  }

  Future<void> toggleFavorite(String productId) async {
    if (_session == null) return;
    
    final currentFavorites = List<String>.from(_session!.user.favoriteProductIds);
    final isFavorited = currentFavorites.contains(productId);
    
    if (isFavorited) {
      currentFavorites.remove(productId);
    } else {
      currentFavorites.add(productId);
    }
    
    // Optimistic update
    final optimisticUser = _session!.user.copyWith(favoriteProductIds: currentFavorites);
    await updateCurrentUser(optimisticUser);
    
    // API call
    try {
      final updatedIds = await _customerService.toggleFavoriteProduct(
        token: _session!.token,
        productId: productId,
      );
      // Ensure sync with backend
      final syncedUser = _session!.user.copyWith(favoriteProductIds: updatedIds);
      await updateCurrentUser(syncedUser);
    } catch (error) {
      // Revert on failure
      final originalFavorites = List<String>.from(_session!.user.favoriteProductIds);
      if (isFavorited) {
        originalFavorites.add(productId);
      } else {
        originalFavorites.remove(productId);
      }
      final revertedUser = _session!.user.copyWith(favoriteProductIds: originalFavorites);
      await updateCurrentUser(revertedUser);
    }
  }

  Future<void> saveShopOwnerAuthResult(OwnerAuthResult authResult) async {
    if (authResult.token.isEmpty) {
      _sessionMessage = authResult.message.isNotEmpty
          ? authResult.message
          : 'Shop owner account created. Please wait for approval before login.';
      notifyListeners();
      return;
    }

    _ownerSession =
        ShopOwnerSession(owner: authResult.owner, token: authResult.token);
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
        _ownerSessionKey, jsonEncode(_ownerSession!.toJson()));
    await refreshShopOwnerSubscription(silent: true);
    notifyListeners();
  }

  Future<void> refreshShopOwnerSubscription({bool silent = false}) async {
    if (_ownerSession == null) return;
    try {
      final profile =
          await _paymentService.getMyPaymentState(_ownerSession!.token);
      final subscription = ShopOwnerSubscription(
        planCode: profile.planCode,
        status: profile.status,
        expiresAt: profile.expiresAt,
        isPremium: profile.isPremium,
        features: profile.features,
      );
      _ownerSession = _ownerSession!.copyWith(
        owner: _ownerSession!.owner.copyWith(subscription: subscription),
      );
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(
          _ownerSessionKey, jsonEncode(_ownerSession!.toJson()));
    } catch (_) {
      // Keep the stored owner snapshot if subscription refresh fails.
    }
    if (!silent) notifyListeners();
  }

  Future<void> logoutShopOwner() async {
    _ownerSession = null;
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_ownerSessionKey);
    notifyListeners();
  }

  Future<void> logout({String message = ''}) async {
    _session = null;
    _forceProfileEditor = false;
    _isGuestMode = true;
    _showingAuthScreen = false;
    _sessionMessage = message;
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_sessionKey);
    await preferences.setBool(_guestKey, true);
    notifyListeners();
  }

  Future<void> handleApiError(ApiError error) async {
    if (error.isUnauthorized) {
      await logout(message: 'Your session expired. Please sign in again.');
    }
  }

  Future<void> checkBackendHealth() async {
    _isCheckingHealth = true;
    _healthMessage = '';
    notifyListeners();

    try {
      final result = await _accountService.checkBackendHealth();
      _backendHealthy = result.success;
      _healthMessage = result.message;
    } catch (error) {
      final apiError = ApiError.from(error);
      _backendHealthy = false;
      _healthMessage = apiError.message;
    } finally {
      _isCheckingHealth = false;
      notifyListeners();
    }
  }
}
