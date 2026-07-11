import 'package:dio/dio.dart';

class ApiError implements Exception {
  const ApiError(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;

  factory ApiError.from(Object error) {
    if (error is ApiError) {
      return error;
    }

    if (error is DioException) {
      final responseData = error.response?.data;
      final responseMessage = responseData is Map<String, dynamic>
          ? responseData['message'] as String?
          : null;
      final statusCode = error.response?.statusCode;

      if (responseMessage != null && responseMessage.isNotEmpty) {
        return ApiError(responseMessage, statusCode: statusCode);
      }

      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.receiveTimeout:
        case DioExceptionType.sendTimeout:
          return ApiError(
            'The request timed out. Please try again.',
            statusCode: statusCode,
          );
        case DioExceptionType.connectionError:
          return const ApiError(
            'Could not connect to the backend. Check that the server is running and the API base URL is correct.',
          );
        case DioExceptionType.badResponse:
          return ApiError(
            'Request failed with status ${statusCode ?? 'unknown'}.',
            statusCode: statusCode,
          );
        default:
          return ApiError(
            error.message ?? 'Unexpected network error.',
            statusCode: statusCode,
          );
      }
    }

    return ApiError(error.toString());
  }

  @override
  String toString() => message;
}
