import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'stylist_models.dart';

class StylistService {
  StylistService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<StylistResponse> getRecommendation(StylistRequest payload) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/stylist/recommend',
        data: payload.toJson(),
      );

      return StylistResponse.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<void> submitFeedback(Map<String, dynamic> payload) async {
    try {
      await _client.instance.post('/stylist/feedback', data: payload);
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
