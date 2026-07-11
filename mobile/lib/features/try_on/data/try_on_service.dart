import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../shared/models/local_image_data.dart';
import 'try_on_models.dart';

class TryOnService {
  TryOnService({ApiClient? client})
      : _client = client ??
            ApiClient(
              connectTimeout: const Duration(days: 1),
              receiveTimeout: const Duration(days: 1),
              sendTimeout: const Duration(days: 1),
            );

  final ApiClient _client;

  Future<TryOnCreateResponse> createCatalogTask({
    required String token,
    required String productId,
    required LocalImageData modelImage,
  }) async {
    final formData = FormData.fromMap({
      'productId': productId,
      'modelImage': _toMultipart(modelImage),
    });
    return _postTask(
      path: '/tryon/catalog',
      formData: formData,
      token: token,
    );
  }

  Future<TryOnCreateResponse> createCustomTask({
    required String token,
    required FormData formData,
  }) async {
    return _postTask(
      path: '/tryon/custom',
      formData: formData,
      token: token,
    );
  }

  Future<TryOnCreateResponse> _postTask({
    required String path,
    required FormData formData,
    required String token,
  }) async {
    try {
      _log('POST $path start');
      final response = await _client.instance.post<Map<String, dynamic>>(
        path,
        data: formData,
        options: _client.authorizedOptions(
          token,
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      _log('POST $path status=${response.statusCode} body=${response.data}');

      return TryOnCreateResponse.fromJson(response.data ?? const {});
    } catch (error, stackTrace) {
      _logNetworkError('POST $path', error, stackTrace);
      throw ApiError.from(error);
    }
  }

  Future<TryOnStatusResponse> getTaskStatus(String taskId) async {
    try {
      _log('GET /tryon/$taskId start');
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/tryon/$taskId',
      );
      _log(
        'GET /tryon/$taskId status=${response.statusCode} body=${response.data}',
      );

      return TryOnStatusResponse.fromJson(response.data ?? const {});
    } catch (error, stackTrace) {
      _logNetworkError('GET /tryon/$taskId', error, stackTrace);
      throw ApiError.from(error);
    }
  }

  MultipartFile _toMultipart(LocalImageData image) {
    return MultipartFile.fromBytes(
      image.bytes,
      filename: image.name,
      contentType: MediaType.parse(image.mimeType ?? 'image/jpeg'),
    );
  }

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[TryOnService] $message');
    }
  }

  void _logNetworkError(String context, Object error, StackTrace stackTrace) {
    if (!kDebugMode) {
      return;
    }

    if (error is DioException) {
      debugPrint(
        '[TryOnService] $context DioException '
        'type=${error.type} '
        'status=${error.response?.statusCode} '
        'message=${error.message} '
        'response=${error.response?.data}',
      );
    } else {
      debugPrint('[TryOnService] $context error=$error');
    }

    debugPrintStack(stackTrace: stackTrace, label: '[TryOnService] stack');
  }
}
