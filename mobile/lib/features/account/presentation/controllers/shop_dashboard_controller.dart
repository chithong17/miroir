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
  String _errorMessage = '';
  String _statusMessage = '';
  bool _isSavingShop = false;
  bool _isSavingProduct = false;
  bool _isMutatingProduct = false;

  ShopDashboardState get state => _state;
  OwnerShop? get shop => _shop;
  List<ShopProduct> get products => _products;
  String get errorMessage => _errorMessage;
  String get statusMessage => _statusMessage;
  bool get isSavingShop => _isSavingShop;
  bool get isSavingProduct => _isSavingProduct;
  bool get isMutatingProduct => _isMutatingProduct;

  Future<void> loadDashboard() async {
    final session = _sessionController.session;
    if (session == null) {
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
      final shops = await _service.listMyShops(session.token);
      _shop = shops.isEmpty ? null : shops.first;
      _products = await _service.listProducts(session.token);
      _state = ShopDashboardState.loaded;
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      _state = ShopDashboardState.error;
      await _sessionController.handleApiError(apiError);
    }

    notifyListeners();
  }

  Future<void> saveShop({
    required String name,
    required String slug,
    required String description,
    required String logoUrl,
    required String coverUrl,
  }) async {
    final session = _sessionController.session;
    if (session == null) {
      return;
    }

    _isSavingShop = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      final payload = {
        'name': name.trim(),
        'slug': slug.trim(),
        'description': description.trim(),
        'logoUrl': logoUrl.trim(),
        'coverUrl': coverUrl.trim(),
      };

      final isCreating = _shop == null;
      _shop = _shop == null
          ? await _service.createShop(session.token, payload)
          : await _service.updateShop(session.token, _shop!.id, payload);
      _statusMessage = isCreating
          ? 'Shop created successfully.'
          : 'Shop saved successfully.';
      await loadDashboard();
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
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
    final session = _sessionController.session;
    if (session == null) {
      return;
    }

    _isSavingProduct = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      var imageUrl = existingImageUrl;
      var imagePublicId = existingImagePublicId;

      if (localImage != null) {
        final uploaded =
            await _service.uploadProductImage(session.token, localImage);
        imageUrl = uploaded.imageUrl;
        imagePublicId = uploaded.imagePublicId;
      }

      final payload = draft.toPayload(
        imageUrl: imageUrl,
        imagePublicId: imagePublicId,
      );

      if (productId == null || productId.isEmpty) {
        await _service.createProduct(session.token, payload);
        _statusMessage = 'Product created successfully.';
      } else {
        await _service.updateProduct(session.token, productId, payload);
        _statusMessage = 'Product updated successfully.';
      }

      await loadDashboard();
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
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
    final session = _sessionController.session;
    if (session == null) {
      return;
    }

    _isMutatingProduct = true;
    _errorMessage = '';
    _statusMessage = '';
    notifyListeners();

    try {
      await action(session.token);
      _statusMessage = successMessage;
      await loadDashboard();
    } catch (error) {
      final apiError = ApiError.from(error);
      _errorMessage = apiError.message;
      await _sessionController.handleApiError(apiError);
    } finally {
      _isMutatingProduct = false;
      notifyListeners();
    }
  }
}
