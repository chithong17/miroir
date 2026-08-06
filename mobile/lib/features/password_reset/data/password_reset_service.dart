import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';

enum PasswordResetAccountType { user, shopOwner }

extension PasswordResetAccountTypeValue on PasswordResetAccountType {
  String get apiValue => this == PasswordResetAccountType.shopOwner ? 'shop_owner' : 'user';
}

class PasswordResetService {
  PasswordResetService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<int> requestCode({required String email, required PasswordResetAccountType accountType}) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/auth/password-reset/request',
        data: {'email': email.trim(), 'accountType': accountType.apiValue},
      );
      return (response.data?['cooldownSeconds'] as num?)?.toInt() ?? 60;
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<void> verifyCode({required String email, required String otp, required PasswordResetAccountType accountType}) async {
    try {
      await _client.instance.post<Map<String, dynamic>>(
        '/auth/password-reset/verify',
        data: {'email': email.trim(), 'otp': otp.trim(), 'accountType': accountType.apiValue},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<void> confirm({required String email, required String otp, required String password, required PasswordResetAccountType accountType}) async {
    try {
      await _client.instance.post<Map<String, dynamic>>(
        '/auth/password-reset/confirm',
        data: {'email': email.trim(), 'otp': otp.trim(), 'newPassword': password, 'accountType': accountType.apiValue},
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
