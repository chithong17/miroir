import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../shared/models/local_image_data.dart';
import 'customer_models.dart';

class CustomerService {
  CustomerService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<UserAuthResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/user-auth/register',
        data: {
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
        },
      );
      return UserAuthResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<UserAuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/user-auth/login',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );
      return UserAuthResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CustomerUser> getMe(String token) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/user-auth/me',
        options: _client.authorizedOptions(token),
      );
      return CustomerUser.fromJson(
        (response.data?['user'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CustomerUser> saveProfile({
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    try {
      final response = await _client.instance.put<Map<String, dynamic>>(
        '/users/me/profile',
        data: payload,
        options: _client.authorizedOptions(token),
      );
      return CustomerUser.fromJson(
        (response.data?['user'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CustomerUser> skipProfile(String token) async {
    try {
      final response = await _client.instance.patch<Map<String, dynamic>>(
        '/users/me/profile/skip',
        options: _client.authorizedOptions(token),
      );
      return CustomerUser.fromJson(
        (response.data?['user'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<CustomerUser> uploadProfilePhoto({
    required String token,
    required LocalImageData image,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(
          image.bytes,
          filename: image.name,
          contentType: MediaType.parse(image.mimeType ?? 'image/jpeg'),
        ),
      });

      final response = await _client.instance.post<Map<String, dynamic>>(
        '/users/me/profile-photo',
        data: formData,
        options: _client.authorizedOptions(
          token,
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      return CustomerUser.fromJson(
        (response.data?['user'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
