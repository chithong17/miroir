import 'package:flutter/foundation.dart';

import '../../../../core/network/api_error.dart';
import '../../data/catalog_models.dart';
import '../../data/catalog_service.dart';

enum MarketplaceView { products, outfits }

class MarketplaceController extends ChangeNotifier {
  MarketplaceController({CatalogService? service})
      : _service = service ?? CatalogService();

  final CatalogService _service;

  MarketplaceView _view = MarketplaceView.products;
  bool _isLoading = false;
  String _errorMessage = '';
  String _search = '';
  String _category = '';
  String _gender = '';
  String _minPrice = '';
  String _maxPrice = '';
  CatalogPagination _pagination = const CatalogPagination(
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  );
  List<CatalogProduct> _products = const [];
  List<CatalogOutfit> _outfits = const [];
  CatalogProduct? _selectedProduct;

  MarketplaceView get view => _view;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  String get search => _search;
  String get category => _category;
  String get gender => _gender;
  String get minPrice => _minPrice;
  String get maxPrice => _maxPrice;
  CatalogPagination get pagination => _pagination;
  List<CatalogProduct> get products => _products;
  List<CatalogOutfit> get outfits => _outfits;
  CatalogProduct? get selectedProduct => _selectedProduct;

  Future<void> loadInitial({String? token}) async {
    await loadCurrentView(token: token);
  }

  Future<void> loadCurrentView({String? token}) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      if (_view == MarketplaceView.products) {
        final result = await _service.listProducts(
          search: _search,
          category: _category,
          gender: _gender,
          minPrice: _minPrice,
          maxPrice: _maxPrice,
          page: _pagination.page,
          token: token,
        );
        _products = result.products;
        _pagination = result.pagination;
      } else {
        final result = await _service.listOutfits(
          search: _search,
          gender: _gender,
          page: _pagination.page,
          token: token,
        );
        _outfits = result.outfits;
        _pagination = result.pagination;
      }
    } catch (error) {
      _errorMessage = ApiError.from(error).message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changeView(MarketplaceView view, {String? token}) async {
    if (_view == view) return;
    _view = view;
    _pagination =
        const CatalogPagination(page: 1, limit: 12, total: 0, totalPages: 1);
    _selectedProduct = null;
    notifyListeners();
    await loadCurrentView(token: token);
  }

  void updateDraftFilters({
    required String search,
    required String category,
    required String gender,
    required String minPrice,
    required String maxPrice,
  }) {
    _search = search;
    _category = category;
    _gender = gender;
    _minPrice = minPrice;
    _maxPrice = maxPrice;
  }

  Future<void> applyFilters({
    required String search,
    required String category,
    required String gender,
    required String minPrice,
    required String maxPrice,
    String? token,
  }) async {
    updateDraftFilters(
      search: search,
      category: category,
      gender: gender,
      minPrice: minPrice,
      maxPrice: maxPrice,
    );
    _pagination =
        const CatalogPagination(page: 1, limit: 12, total: 0, totalPages: 1);
    await loadCurrentView(token: token);
  }

  Future<void> openProduct(CatalogProduct product, {String? token}) async {
    _selectedProduct = product;
    notifyListeners();

    try {
      _selectedProduct = await _service.getProduct(product.id, token: token);
    } catch (_) {
      _selectedProduct = product;
    }

    notifyListeners();
  }

  void closeProduct() {
    _selectedProduct = null;
    notifyListeners();
  }

  Future<void> nextPage({String? token}) async {
    if (_pagination.page >= _pagination.totalPages) return;
    _pagination = CatalogPagination(
      page: _pagination.page + 1,
      limit: _pagination.limit,
      total: _pagination.total,
      totalPages: _pagination.totalPages,
    );
    await loadCurrentView(token: token);
  }

  Future<void> previousPage({String? token}) async {
    if (_pagination.page <= 1) return;
    _pagination = CatalogPagination(
      page: _pagination.page - 1,
      limit: _pagination.limit,
      total: _pagination.total,
      totalPages: _pagination.totalPages,
    );
    await loadCurrentView(token: token);
  }
}
