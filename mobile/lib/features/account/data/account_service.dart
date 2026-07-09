import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'account_models.dart';

class AccountService {
  AccountService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<BackendHealth> checkBackendHealth() async {
    try {
      final response =
          await _client.instance.get<Map<String, dynamic>>('/health');
      return BackendHealth.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<OwnerAuthResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shop-auth/register',
        data: {
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
        },
      );

      return OwnerAuthResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<OwnerAuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/shop-auth/login',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      return OwnerAuthResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
