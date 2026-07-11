import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';
import '../../../../core/network/api_error.dart';
import '../../data/account_service.dart';

enum ShopAuthMode { login, register }

class ShopAuthController extends ChangeNotifier {
  ShopAuthController({
    required AppSessionController sessionController,
    AccountService? service,
  })  : _sessionController = sessionController,
        _service = service ?? AccountService();

  final AppSessionController _sessionController;
  final AccountService _service;

  ShopAuthMode _mode = ShopAuthMode.login;
  bool _isSubmitting = false;
  String _errorMessage = '';
  String _statusMessage = '';

  ShopAuthMode get mode => _mode;
  bool get isSubmitting => _isSubmitting;
  String get errorMessage => _errorMessage;
  String get statusMessage => _statusMessage;

  void setMode(ShopAuthMode mode) {
    _mode = mode;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();
  }

  Future<bool> submit({
    required String name,
    required String email,
    required String password,
  }) async {
    _isSubmitting = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      final result = _mode == ShopAuthMode.login
          ? await _service.login(email: email, password: password)
          : await _service.register(
              name: name,
              email: email,
              password: password,
            );

      await _sessionController.saveShopOwnerAuthResult(result);
      _statusMessage = result.message.isNotEmpty
          ? result.message
          : result.token.isNotEmpty
              ? 'Shop owner session ready.'
              : 'Account created. Please wait for approval before login.';
      return result.token.isNotEmpty;
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
