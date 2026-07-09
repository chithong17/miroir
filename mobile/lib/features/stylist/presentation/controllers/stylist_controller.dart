import 'package:flutter/foundation.dart';

import '../../../../core/network/api_error.dart';
import '../../data/stylist_models.dart';
import '../../data/stylist_service.dart';

enum StylistViewState {
  idle,
  loading,
  success,
  noMatch,
  error,
}

class StylistController extends ChangeNotifier {
  StylistController({StylistService? service})
      : _service = service ?? StylistService();

  final StylistService _service;

  StylistViewState _state = StylistViewState.idle;
  StylistResponse? _result;
  String _errorMessage = '';
  String _feedbackMessage = '';
  bool _isSubmittingFeedback = false;

  StylistViewState get state => _state;
  StylistResponse? get result => _result;
  String get errorMessage => _errorMessage;
  String get feedbackMessage => _feedbackMessage;
  bool get isSubmittingFeedback => _isSubmittingFeedback;

  Future<void> submit(StylistRequest payload) async {
    _state = StylistViewState.loading;
    _errorMessage = '';
    _feedbackMessage = '';
    _result = null;
    notifyListeners();

    try {
      final response = await _service.getRecommendation(payload);
      _result = response;
      _state = response.noMatch
          ? StylistViewState.noMatch
          : StylistViewState.success;
    } catch (error) {
      _state = StylistViewState.error;
      _errorMessage = ApiError.from(error).message;
    }

    notifyListeners();
  }

  Future<void> submitFeedback({
    required String userId,
    required StylistOutfit outfit,
    required String eventType,
  }) async {
    if (userId.trim().isEmpty) {
      _feedbackMessage = 'Enter a user ID to record stylist feedback.';
      notifyListeners();
      return;
    }

    _isSubmittingFeedback = true;
    _feedbackMessage = '';
    notifyListeners();

    try {
      await _service.submitFeedback({
        'userId': userId.trim(),
        'outfitId': outfit.id,
        'eventType': eventType,
        'productIds': outfit.items.map((item) => item.product.id).toList(),
      });
      _feedbackMessage = eventType == 'liked'
          ? 'Saved as positive style feedback.'
          : 'Saved as negative style feedback.';
    } catch (error) {
      _feedbackMessage = ApiError.from(error).message;
    } finally {
      _isSubmittingFeedback = false;
      notifyListeners();
    }
  }

  void resetFeedbackMessage() {
    _feedbackMessage = '';
    notifyListeners();
  }
}
