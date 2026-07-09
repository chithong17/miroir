import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'try_on_models.dart';

class TryOnService {
  TryOnService({ApiClient? client})
      : _client =
            client ??
            ApiClient(
              connectTimeout: const Duration(days: 1),
              receiveTimeout: const Duration(days: 1),
              sendTimeout: const Duration(days: 1),
            );

  final ApiClient _client;

  Future<TryOnCreateResponse> createTask(FormData formData) async {
    try {
      _log('POST /tryon start');
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/tryon',
        data: formData,
      );
      _log('POST /tryon status=${response.statusCode} body=${response.data}');

      return TryOnCreateResponse.fromJson(response.data ?? const {});
    } catch (error, stackTrace) {
      _logNetworkError('POST /tryon', error, stackTrace);
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
