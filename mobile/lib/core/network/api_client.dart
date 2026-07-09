import 'package:dio/dio.dart';

import '../constants/app_constants.dart';

class ApiClient {
  ApiClient({
    Dio? dio,
    String? baseUrl,
    Duration? connectTimeout,
    Duration? receiveTimeout,
    Duration? sendTimeout,
  }) : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl ?? AppConstants.defaultApiBaseUrl,
                connectTimeout: connectTimeout ?? const Duration(seconds: 30),
                receiveTimeout: receiveTimeout ?? const Duration(seconds: 90),
                sendTimeout: sendTimeout ?? const Duration(seconds: 90),
              ),
            );

  final Dio _dio;

  Dio get instance => _dio;

  Options authorizedOptions(
    String token, {
    Map<String, dynamic>? headers,
  }) {
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
        ...?headers,
      },
    );
  }
}
