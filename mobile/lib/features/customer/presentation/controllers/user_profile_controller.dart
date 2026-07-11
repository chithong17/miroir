import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';
import '../../../../core/network/api_error.dart';
import '../../../../shared/models/local_image_data.dart';
import '../../data/customer_models.dart';
import '../../data/customer_service.dart';

class UserProfileController extends ChangeNotifier {
  UserProfileController({
    required AppSessionController sessionController,
    CustomerService? service,
  })  : _sessionController = sessionController,
        _service = service ?? CustomerService();

  final AppSessionController _sessionController;
  final CustomerService _service;

  bool _isSaving = false;
  bool _isUploadingPhoto = false;
  String _errorMessage = '';
  String _statusMessage = '';

  bool get isSaving => _isSaving;
  bool get isUploadingPhoto => _isUploadingPhoto;
  String get errorMessage => _errorMessage;
  String get statusMessage => _statusMessage;
  CustomerUser? get currentUser => _sessionController.currentUser;

  Future<bool> saveProfile(UserProfileDraft draft) async {
    if (_sessionController.authToken.isEmpty) {
      _errorMessage = 'Please sign in first.';
      notifyListeners();
      return false;
    }

    _isSaving = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      final user = await _service.saveProfile(
        token: _sessionController.authToken,
        payload: draft.toPayload(),
      );
      await _sessionController.updateCurrentUser(user);
      _statusMessage = 'Profile saved.';
      return true;
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<bool> skipProfile() async {
    if (_sessionController.authToken.isEmpty) {
      _errorMessage = 'Please sign in first.';
      notifyListeners();
      return false;
    }

    _isSaving = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      final user = await _service.skipProfile(_sessionController.authToken);
      await _sessionController.updateCurrentUser(user);
      return true;
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<bool> uploadProfilePhoto(LocalImageData image) async {
    if (_sessionController.authToken.isEmpty) {
      _errorMessage = 'Please sign in first.';
      notifyListeners();
      return false;
    }

    _isUploadingPhoto = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      final user = await _service.uploadProfilePhoto(
        token: _sessionController.authToken,
        image: image,
      );
      await _sessionController.updateCurrentUser(user);
      _statusMessage = 'Profile photo saved.';
      return true;
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
      return false;
    } finally {
      _isUploadingPhoto = false;
      notifyListeners();
    }
  }
}
