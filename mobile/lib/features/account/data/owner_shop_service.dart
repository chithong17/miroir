import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../shared/models/local_image_data.dart';
import 'owner_shop_models.dart';

class OwnerShopService {
  OwnerShopService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<OwnerShop>> listMyShops(String token) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/shops/me',
        options: _client.authorizedOptions(token),
      );
      return (response.data?['shops'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(OwnerShop.fromJson)
          .toList();
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<OwnerShop> createShop(
      String token, Map<String, dynamic> payload) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shops',
        data: payload,
        options: _client.authorizedOptions(token),
      );
      return OwnerShop.fromJson(
        (response.data?['shop'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<OwnerShop> updateShop(
    String token,
    String shopId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final response = await _client.instance.put<Map<String, dynamic>>(
        '/shops/$shopId',
        data: payload,
        options: _client.authorizedOptions(token),
      );
      return OwnerShop.fromJson(
        (response.data?['shop'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<List<ShopProduct>> listProducts(String token) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/shop-products',
        options: _client.authorizedOptions(token),
      );
      return (response.data?['products'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ShopProduct.fromJson)
          .toList();
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<ShopProduct> createProduct(
    String token,
    Map<String, dynamic> payload,
  ) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shop-products',
        data: payload,
        options: _client.authorizedOptions(token),
      );
      return ShopProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<ShopProduct> updateProduct(
    String token,
    String productId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final response = await _client.instance.put<Map<String, dynamic>>(
        '/shop-products/$productId',
        data: payload,
        options: _client.authorizedOptions(token),
      );
      return ShopProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<ShopProduct> archiveProduct(String token, String productId) async {
    try {
      final response = await _client.instance.patch<Map<String, dynamic>>(
        '/shop-products/$productId/archive',
        options: _client.authorizedOptions(token),
      );
      return ShopProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<ShopProduct> restoreProduct(String token, String productId) async {
    try {
      final response = await _client.instance.patch<Map<String, dynamic>>(
        '/shop-products/$productId/restore',
        options: _client.authorizedOptions(token),
      );
      return ShopProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<ShopProduct> deleteProduct(String token, String productId) async {
    try {
      final response = await _client.instance.delete<Map<String, dynamic>>(
        '/shop-products/$productId',
        options: _client.authorizedOptions(token),
      );
      return ShopProduct.fromJson(
        (response.data?['product'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<UploadedProductImage> uploadProductImage(
    String token,
    LocalImageData image,
  ) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(
          image.bytes,
          filename: image.name,
          contentType: MediaType.parse(image.mimeType ?? 'image/jpeg'),
        ),
      });
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shop-products/upload-image',
        data: formData,
        options: _client.authorizedOptions(token),
      );
      return UploadedProductImage.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<UploadedProductImage> uploadShopImage(
    String token,
    LocalImageData image,
  ) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(
          image.bytes,
          filename: image.name,
          contentType: MediaType.parse(image.mimeType ?? 'image/jpeg'),
        ),
      });
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shops/upload-image',
        data: formData,
        options: _client.authorizedOptions(token),
      );
      return UploadedProductImage.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<Map<String, dynamic>> getAnalytics(
    String token, {
    String range = '30d',
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/shops/me/analytics',
        queryParameters: {'range': range},
        options: _client.authorizedOptions(token),
      );
      final data = response.data ?? const {};
      return (data['analytics'] as Map<String, dynamic>?) ?? data;
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<Map<String, dynamic>> getDashboard(
    String token, {
    String range = '30d',
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/shops/me/dashboard',
        queryParameters: {'range': range},
        options: _client.authorizedOptions(token),
      );
      final data = response.data ?? const {};
      return (data['dashboard'] as Map<String, dynamic>?) ?? data;
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<Map<String, dynamic>> getInsights(
    String token, {
    String range = '30d',
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/shops/me/insights',
        queryParameters: {'range': range},
        options: _client.authorizedOptions(token),
      );
      final data = response.data ?? const {};
      return (data['insights'] as Map<String, dynamic>?) ?? data;
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
