import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';
import '../../../../core/network/api_error.dart';
import '../../data/customer_service.dart';

enum CustomerAuthMode { login, register }

class CustomerAuthController extends ChangeNotifier {
  CustomerAuthController({
    required AppSessionController sessionController,
    CustomerService? service,
    CustomerAuthMode mode = CustomerAuthMode.login,
  })  : _sessionController = sessionController,
        _service = service ?? CustomerService(),
        _mode = mode;

  final AppSessionController _sessionController;
  final CustomerService _service;

  CustomerAuthMode _mode;
  bool _isSubmitting = false;
  String _errorMessage = '';

  CustomerAuthMode get mode => _mode;
  bool get isSubmitting => _isSubmitting;
  String get errorMessage => _errorMessage;

  void setMode(CustomerAuthMode value) {
    _mode = value;
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
      final result = _mode == CustomerAuthMode.register
          ? await _service.register(
              name: name,
              email: email,
              password: password,
            )
          : await _service.login(
              email: email,
              password: password,
            );
      await _sessionController.saveUserAuthResult(result);
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
