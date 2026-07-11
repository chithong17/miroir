import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';

enum ShopAuthMode { login, register }

class ShopAuthController extends ChangeNotifier {
  ShopAuthController({
    required AppSessionController sessionController,
  }) : _sessionController = sessionController;

  final AppSessionController _sessionController;

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

    await Future<void>.delayed(Duration.zero);

    _isSubmitting = false;
    _errorMessage =
        'Shop-owner mobile flow is not enabled in this customer-first build.';
    _sessionController.showAuthChoice();
    notifyListeners();
    return false;
  }
}
