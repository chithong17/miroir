import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'payment_models.dart';

class PaymentService {
  PaymentService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<PaymentPlansResult> getPlans() async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/payments/plans',
      );
      return PaymentPlansResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<PaymentCreateResult> createPayment({
    required String token,
    required String planCode,
  }) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/payments/create',
        data: {'planCode': planCode},
        options: _client.authorizedOptions(token),
      );
      return PaymentCreateResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<PaymentStatusResult> getStatus({
    required String token,
    required String orderCode,
  }) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/payments/status/$orderCode',
        options: _client.authorizedOptions(token),
      );
      return PaymentStatusResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<PaymentProfileResult> getMyPaymentState(String token) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '/payments/me',
        options: _client.authorizedOptions(token),
      );
      return PaymentProfileResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
