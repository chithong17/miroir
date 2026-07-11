import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';

import '../../../../core/network/api_error.dart';
import '../../../../shared/models/local_image_data.dart';
import '../../../marketplace/data/catalog_models.dart';
import '../../data/try_on_service.dart';

enum TryOnViewState {
  idle,
  creating,
  polling,
  completed,
  completedWithoutUrl,
  failed,
  timedOut,
}

enum TryOnImageSlot { model, dress, upper, lower }

class TryOnController extends ChangeNotifier {
  TryOnController({TryOnService? service})
      : _service = service ?? TryOnService();

  static const _pollInterval = Duration(seconds: 4);

  final TryOnService _service;

  String _tryOnType = 'dress';
  LocalImageData? _modelImage;
  LocalImageData? _dressImage;
  LocalImageData? _upperImage;
  LocalImageData? _lowerImage;
  TryOnViewState _state = TryOnViewState.idle;
  String _taskStatus = 'idle';
  String _taskId = '';
  String _resultUrl = '';
  String _errorMessage = '';
  String _prefillLabel = '';
  CatalogProduct? _catalogProduct;
  Timer? _pollTimer;

  String get tryOnType => _tryOnType;
  LocalImageData? get modelImage => _modelImage;
  LocalImageData? get dressImage => _dressImage;
  LocalImageData? get upperImage => _upperImage;
  LocalImageData? get lowerImage => _lowerImage;
  TryOnViewState get state => _state;
  String get taskStatus => _taskStatus;
  String get taskId => _taskId;
  String get resultUrl => _resultUrl;
  String get errorMessage => _errorMessage;
  String get prefillLabel => _prefillLabel;
  CatalogProduct? get catalogProduct => _catalogProduct;
  bool get isCatalogTryOn => _catalogProduct != null;
  bool get hasPrefilledGarment =>
      isCatalogTryOn ||
      _dressImage != null ||
      _upperImage != null ||
      _lowerImage != null;
  bool get isBusy =>
      _state == TryOnViewState.creating || _state == TryOnViewState.polling;

  void setTryOnType(String value) {
    _tryOnType = value;
    _errorMessage = '';
    _resultUrl = '';
    if (value == 'dress') {
      _upperImage = null;
      _lowerImage = null;
    } else {
      _dressImage = null;
    }
    _log('setTryOnType=$value');
    notifyListeners();
  }

  void setImage(TryOnImageSlot slot, LocalImageData image) {
    switch (slot) {
      case TryOnImageSlot.model:
        _modelImage = image;
        break;
      case TryOnImageSlot.dress:
        _dressImage = image;
        _upperImage = null;
        _lowerImage = null;
        break;
      case TryOnImageSlot.upper:
        _upperImage = image;
        _dressImage = null;
        break;
      case TryOnImageSlot.lower:
        _lowerImage = image;
        _dressImage = null;
        break;
    }
    _errorMessage = '';
    _resultUrl = '';
    _log('setImage slot=$slot name=${image.name} bytes=${image.bytes.length}');
    notifyListeners();
  }

  void prefillFromCatalogProduct(CatalogProduct product) {
    _catalogProduct = product;
    _prefillLabel = product.name;
    _tryOnType = 'dress';
    _dressImage = null;
    _upperImage = null;
    _lowerImage = null;
    _errorMessage = '';
    _resultUrl = '';
    _log('catalog prefill product=${product.id} ${product.name}');
    notifyListeners();
  }

  String validateSelection() {
    if (_modelImage == null) {
      return 'Please upload a full-body model image.';
    }

    if (isCatalogTryOn) {
      return '';
    }

    if (_tryOnType == 'dress' && _dressImage == null) {
      return 'Dress mode requires a dress image.';
    }

    if (_tryOnType == 'upper_lower' &&
        _upperImage == null &&
        _lowerImage == null) {
      return 'Upper / Lower mode requires at least one garment image.';
    }

    if (_dressImage != null && (_upperImage != null || _lowerImage != null)) {
      return 'Dress mode cannot be combined with upper or lower images.';
    }

    return '';
  }

  Future<void> submit(String token) async {
    if (token.isEmpty) {
      _state = TryOnViewState.failed;
      _errorMessage = 'Please sign in before starting a try-on.';
      notifyListeners();
      return;
    }

    final validationError = validateSelection();
    if (validationError.isNotEmpty) {
      _state = TryOnViewState.failed;
      _errorMessage = validationError;
      _log('submit blocked validationError=$_errorMessage');
      notifyListeners();
      return;
    }

    _state = TryOnViewState.creating;
    _taskStatus = 'creating';
    _taskId = '';
    _resultUrl = '';
    _errorMessage = '';
    _log(
      'submit start type=$_tryOnType '
      'model=${_modelImage?.name} dress=${_dressImage?.name} '
      'upper=${_upperImage?.name} lower=${_lowerImage?.name}',
    );
    notifyListeners();

    try {
      final catalogProduct = _catalogProduct;
      final response = catalogProduct != null
          ? await _service.createCatalogTask(
              token: token,
              productId: catalogProduct.id,
              modelImage: _modelImage!,
            )
          : await _service.createCustomTask(
              token: token,
              formData: FormData.fromMap({
                'tryOnType': _tryOnType,
                'batchSize': '1',
                'modelImage': _toMultipart(_modelImage!),
                if (_dressImage != null)
                  'dressImage': _toMultipart(_dressImage!),
                if (_upperImage != null)
                  'upperImage': _toMultipart(_upperImage!),
                if (_lowerImage != null)
                  'lowerImage': _toMultipart(_lowerImage!),
              }),
            );
      _taskId = response.taskId;
      _taskStatus = 'processing';
      _state = TryOnViewState.polling;
      _log(
        'createTask success taskId=$_taskId success=${response.success} message=${response.message}',
      );
      notifyListeners();
      _startPolling();
    } catch (error, stackTrace) {
      _state = TryOnViewState.failed;
      _taskStatus = 'failed';
      _errorMessage = ApiError.from(error).message;
      _logError('submit/createTask', error, stackTrace);
      notifyListeners();
    }
  }

  MultipartFile _toMultipart(LocalImageData image) {
    return MultipartFile.fromBytes(
      image.bytes,
      filename: image.name,
      contentType: MediaType.parse(image.mimeType ?? 'image/jpeg'),
    );
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _log('poll start taskId=$_taskId interval=${_pollInterval.inSeconds}s');
    _pollTaskStatus();
    _pollTimer = Timer.periodic(
      _pollInterval,
      (_) => _pollTaskStatus(),
    );
  }

  Future<void> _pollTaskStatus() async {
    if (_taskId.isEmpty) {
      _log('poll skipped because taskId is empty');
      return;
    }

    try {
      final response = await _service.getTaskStatus(_taskId);
      _taskStatus = response.status;
      _log(
        'poll result taskId=$_taskId status=${response.status} '
        'success=${response.success} resultUrl=${response.resultUrl} '
        'error=${response.errorMessage}',
      );

      if (response.status == 'completed') {
        _pollTimer?.cancel();
        _resultUrl = response.resultUrl ?? '';
        _state = _resultUrl.isEmpty
            ? TryOnViewState.completedWithoutUrl
            : TryOnViewState.completed;
        if (_resultUrl.isEmpty) {
          _errorMessage = 'Task completed but no result URL was returned.';
        }
      } else if (response.status == 'failed' || response.success == false) {
        _pollTimer?.cancel();
        _state = TryOnViewState.failed;
        _taskStatus = 'failed';
        _errorMessage = response.errorMessage ?? 'Virtual try-on task failed.';
      }
    } catch (error, stackTrace) {
      _pollTimer?.cancel();
      _state = TryOnViewState.failed;
      _taskStatus = 'failed';
      _errorMessage = ApiError.from(error).message;
      _logError('poll/getTaskStatus', error, stackTrace);
    }

    notifyListeners();
  }

  void reset() {
    _pollTimer?.cancel();
    _tryOnType = 'dress';
    _modelImage = null;
    _dressImage = null;
    _upperImage = null;
    _lowerImage = null;
    _state = TryOnViewState.idle;
    _taskStatus = 'idle';
    _taskId = '';
    _resultUrl = '';
    _errorMessage = '';
    _prefillLabel = '';
    _catalogProduct = null;
    _log('reset');
    notifyListeners();
  }

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[TryOnController] $message');
    }
  }

  void _logError(String context, Object error, StackTrace stackTrace) {
    if (!kDebugMode) {
      return;
    }

    if (error is DioException) {
      debugPrint(
        '[TryOnController] $context DioException '
        'type=${error.type} '
        'status=${error.response?.statusCode} '
        'message=${error.message} '
        'response=${error.response?.data}',
      );
    } else {
      debugPrint('[TryOnController] $context error=$error');
    }

    debugPrintStack(stackTrace: stackTrace, label: '[TryOnController] stack');
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}
