import 'package:flutter/foundation.dart';

import '../../../../core/app/app_session_controller.dart';
import '../../../../core/network/api_error.dart';
import '../../../../shared/models/local_image_data.dart';
import '../../data/owner_shop_models.dart';
import '../../data/owner_shop_service.dart';

enum ShopDashboardState {
  idle,
  loading,
  loaded,
  error,
}

class ShopDashboardController extends ChangeNotifier {
  ShopDashboardController({
    required AppSessionController sessionController,
    OwnerShopService? service,
  })  : _sessionController = sessionController,
        _service = service ?? OwnerShopService();

  final AppSessionController _sessionController;
  final OwnerShopService _service;

  ShopDashboardState _state = ShopDashboardState.idle;
  OwnerShop? _shop;
  List<ShopProduct> _products = const [];
  Map<String, dynamic>? _analytics;
  Map<String, dynamic>? _commerceDashboard;
  Map<String, dynamic>? _insights;
  String _errorMessage = '';
  String _statusMessage = '';
  bool _isSavingShop = false;
  bool _isSavingProduct = false;
  bool _isMutatingProduct = false;
  bool _isLoadingAnalytics = false;

  ShopDashboardState get state => _state;
  OwnerShop? get shop => _shop;
  List<ShopProduct> get products => _products;
  Map<String, dynamic>? get analytics => _analytics;
  Map<String, dynamic>? get commerceDashboard => _commerceDashboard;
  Map<String, dynamic>? get insights => _insights;
  String get errorMessage => _errorMessage;
  String get statusMessage => _statusMessage;
  bool get isSavingShop => _isSavingShop;
  bool get isSavingProduct => _isSavingProduct;
  bool get isMutatingProduct => _isMutatingProduct;
  bool get isLoadingAnalytics => _isLoadingAnalytics;
  bool get isPremium => _sessionController.isShopOwnerPremium;

  String get _token => _sessionController.shopOwnerToken;

  Future<void> loadDashboard() async {
    if (_token.isEmpty) {
      _state = ShopDashboardState.idle;
      _shop = null;
      _products = const [];
      _errorMessage = '';
      _statusMessage = '';
      notifyListeners();
      return;
    }

    _state = ShopDashboardState.loading;
    _errorMessage = '';
    notifyListeners();

    try {
      await _sessionController.refreshShopOwnerSubscription(silent: true);
      final shops = await _service.listMyShops(_token);
      _shop = shops.isEmpty ? null : shops.first;
      _products = await _service.listProducts(_token);
      _state = ShopDashboardState.loaded;
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      _state = ShopDashboardState.error;
      if (apiError.isUnauthorized) {
        await _sessionController.logoutShopOwner();
      }
    }

    notifyListeners();
  }

  Future<void> loadAnalytics({String range = '30d'}) async {
    if (_token.isEmpty || !isPremium) return;
    _isLoadingAnalytics = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.getAnalytics(_token, range: range),
        _service.getInsights(_token, range: range),
        _service.getDashboard(_token, range: range),
      ]);
      _analytics = results[0];
      _insights = results[1];
      _commerceDashboard = results[2];
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      if (apiError.isUnauthorized) {
        await _sessionController.logoutShopOwner();
      }
    } finally {
      _isLoadingAnalytics = false;
      notifyListeners();
    }
  }

  Future<void> saveShop({
    required String name,
    required String slug,
    required String description,
    String logoUrl = '',
    String coverUrl = '',
    LocalImageData? logoImage,
    LocalImageData? coverImage,
  }) async {
    if (_token.isEmpty) return;

    _isSavingShop = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      var finalLogoUrl = logoUrl;
      var finalCoverUrl = coverUrl;

      if (logoImage != null) {
        final uploaded = await _service.uploadShopImage(_token, logoImage);
        finalLogoUrl = uploaded.imageUrl;
      }
      if (coverImage != null) {
        final uploaded = await _service.uploadShopImage(_token, coverImage);
        finalCoverUrl = uploaded.imageUrl;
      }

      final payload = {
        'name': name.trim(),
        'slug': slug.trim(),
        'description': description.trim(),
        'logoUrl': finalLogoUrl.trim(),
        'coverUrl': finalCoverUrl.trim(),
      };

      final isCreating = _shop == null;
      _shop = _shop == null
          ? await _service.createShop(_token, payload)
          : await _service.updateShop(_token, _shop!.id, payload);
      _statusMessage = isCreating
          ? 'Shop created successfully.'
          : 'Shop saved successfully.';
      await loadDashboard();
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
    } finally {
      _isSavingShop = false;
      notifyListeners();
    }
  }

  Future<void> saveProduct({
    String? productId,
    required ShopProductDraft draft,
    LocalImageData? localImage,
    String existingImageUrl = '',
    String existingImagePublicId = '',
  }) async {
    if (_token.isEmpty) return;

    _isSavingProduct = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      var imageUrl = existingImageUrl;
      var imagePublicId = existingImagePublicId;

      if (localImage != null) {
        final uploaded = await _service.uploadProductImage(_token, localImage);
        imageUrl = uploaded.imageUrl;
        imagePublicId = uploaded.imagePublicId;
      }

      final payload = draft.toPayload(
        imageUrl: imageUrl,
        imagePublicId: imagePublicId,
      );

      if (productId == null || productId.isEmpty) {
        await _service.createProduct(_token, payload);
        _statusMessage = 'Product created successfully.';
      } else {
        await _service.updateProduct(_token, productId, payload);
        _statusMessage = 'Product updated successfully.';
      }

      await loadDashboard();
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
    } finally {
      _isSavingProduct = false;
      notifyListeners();
    }
  }

  Future<void> archiveProduct(String productId) async {
    await _mutateProduct(
      action: (token) => _service.archiveProduct(token, productId),
      successMessage: 'Product archived.',
    );
  }

  Future<void> restoreProduct(String productId) async {
    await _mutateProduct(
      action: (token) => _service.restoreProduct(token, productId),
      successMessage: 'Product restored to draft.',
    );
  }

  Future<void> deleteProduct(String productId) async {
    await _mutateProduct(
      action: (token) => _service.deleteProduct(token, productId),
      successMessage: 'Product moved to trash.',
    );
  }

  Future<void> _mutateProduct({
    required Future<ShopProduct> Function(String token) action,
    required String successMessage,
  }) async {
    if (_token.isEmpty) return;

    _isMutatingProduct = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      await action(_token);
      _statusMessage = successMessage;
      await loadDashboard();
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
    } finally {
      _isMutatingProduct = false;
      notifyListeners();
    }
  }
}
