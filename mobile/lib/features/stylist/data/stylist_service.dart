import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'stylist_models.dart';

class StylistService {
  StylistService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<StylistResponse> getRecommendation(StylistRequest payload,
      {required String token}) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '/stylist/recommend',
        data: payload.toJson(),
        options: _client.authorizedOptions(token),
      );

      return StylistResponse.fromJson(response.data ?? const {});
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  Future<void> submitFeedback(Map<String, dynamic> payload,
      {required String token}) async {
    try {
      await _client.instance.post(
        '/stylist/feedback',
        data: payload,
        options: _client.authorizedOptions(token),
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}
