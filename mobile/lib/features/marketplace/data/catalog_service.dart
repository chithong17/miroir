import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'catalog_models.dart';

class CatalogService {
  CatalogService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<CatalogProductsResult> listProducts({
    String search = '',
    String category = '',
    String gender = '',
    String minPrice = '',
    String maxPrice = '',
    int page = 1,
    String? token,
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/catalog/products',
        queryParameters: {
          if (search.trim().isNotEmpty) 'search': search.trim(),
          if (category.trim().isNotEmpty) 'category': category.trim(),
          if (gender.trim().isNotEmpty) 'gender': gender.trim(),
          if (minPrice.trim().isNotEmpty) 'minPrice': minPrice.trim(),
          if (maxPrice.trim().isNotEmpty) 'maxPrice': maxPrice.trim(),
          'page': page,
        },
        options: token == null || token.isEmpty
            ? null
            : _client.authorizedOptions(token),
      );
      return CatalogProductsResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CatalogOutfitsResult> listOutfits({
    String search = '',
    String gender = '',
    int page = 1,
    String? token,
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/catalog/outfits',
        queryParameters: {
          if (search.trim().isNotEmpty) 'search': search.trim(),
          if (gender.trim().isNotEmpty) 'gender': gender.trim(),
          'page': page,
        },
        options: token == null || token.isEmpty
            ? null
            : _client.authorizedOptions(token),
      );
      return CatalogOutfitsResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CatalogProduct> getProduct(String productId, {String? token}) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/catalog/products/$productId',
        options: token == null || token.isEmpty
            ? null
            : _client.authorizedOptions(token),
      );
      return CatalogProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<void> submitProductFeedback({
    required String token,
    required String productId,
    required int rating,
    required String fitFeedback,
    required String comment,
    String context = 'product',
  }) async {
    try {
      await _client.instance.post<Map<String, dynamic>>(
        '/catalog/products/$productId/feedback',
        data: {
          'rating': rating,
          'fitFeedback': fitFeedback,
          if (comment.trim().isNotEmpty) 'comment': comment.trim(),
          'context': context,
        },
        options: _client.authorizedOptions(token),
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
