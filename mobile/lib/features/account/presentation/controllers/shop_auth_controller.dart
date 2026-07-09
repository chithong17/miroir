import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';
import '../../../../core/network/api_error.dart';
import '../../data/account_service.dart';

enum ShopAuthMode { login, register }

class ShopAuthController extends ChangeNotifier {
  ShopAuthController({
    required AppSessionController sessionController,
    AccountService? accountService,
  })  : _sessionController = sessionController,
        _accountService = accountService ?? AccountService();

  final AppSessionController _sessionController;
  final AccountService _accountService;

  ShopAuthMode _mode = ShopAuthMode.login;
  bool _isSubmitting = false;
  String _errorMessage = '';

  ShopAuthMode get mode => _mode;
  bool get isSubmitting => _isSubmitting;
  String get errorMessage => _errorMessage;

  void setMode(ShopAuthMode mode) {
    _mode = mode;
    _errorMessage = '';
    notifyListeners();
  }

  Future<bool> submit({
    required String name,
    required String email,
    required String password,
  }) async {
    _isSubmitting = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final authResult = _mode == ShopAuthMode.register
          ? await _accountService.register(
              name: name,
              email: email,
              password: password,
            )
          : await _accountService.login(
              email: email,
              password: password,
            );
      await _sessionController.saveAuthResult(authResult);
      return true;
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
