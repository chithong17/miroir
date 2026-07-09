import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/account/data/account_models.dart';
import '../../features/account/data/account_service.dart';
import '../constants/app_constants.dart';
import '../network/api_error.dart';

class AppSessionController extends ChangeNotifier {
  AppSessionController({
    AccountService? accountService,
  }) : _accountService = accountService ?? AccountService();

  static const _sessionKey = 'miroir.shop_owner_session';
  static const _onboardingKey = 'miroir.has_seen_onboarding';

  final AccountService _accountService;

  bool _isRestoring = true;
  bool _isCheckingHealth = false;
  bool _hasSeenOnboarding = false;
  String _sessionMessage = '';
  String _healthMessage = '';
  bool? _backendHealthy;
  ShopOwnerSession? _session;

  bool get isRestoring => _isRestoring;
  bool get isCheckingHealth => _isCheckingHealth;
  bool get isSignedIn => _session != null;
  bool get hasSeenOnboarding => _hasSeenOnboarding;
  bool get shouldShowOnboarding => !_isRestoring && !_hasSeenOnboarding;
  bool? get backendHealthy => _backendHealthy;
  String get sessionMessage => _sessionMessage;
  String get healthMessage => _healthMessage;
  ShopOwnerSession? get session => _session;
  String get apiBaseUrl => AppConstants.defaultApiBaseUrl;
  String get platformLabel => AppConstants.platformLabel;

  Future<void> restoreSession() async {
    _isRestoring = true;
    notifyListeners();

    final preferences = await SharedPreferences.getInstance();
    _hasSeenOnboarding = preferences.getBool(_onboardingKey) ?? false;
    final rawSession = preferences.getString(_sessionKey);

    if (rawSession != null && rawSession.isNotEmpty) {
      try {
        _session = ShopOwnerSession.fromJson(
          jsonDecode(rawSession) as Map<String, dynamic>,
        );
      } catch (_) {
        await preferences.remove(_sessionKey);
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

  Future<void> saveAuthResult(OwnerAuthResult authResult) async {
    _session = ShopOwnerSession(
      owner: authResult.owner,
      token: authResult.token,
    );
    _sessionMessage = '';

    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_sessionKey, jsonEncode(_session!.toJson()));
    notifyListeners();
  }

  Future<void> logout({String message = ''}) async {
    _session = null;
    _sessionMessage = message;
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_sessionKey);
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
