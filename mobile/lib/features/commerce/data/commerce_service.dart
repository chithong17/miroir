import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'commerce_models.dart';

class CommerceService {
  CommerceService({ApiClient? client}) : _client = client ?? ApiClient();
  final ApiClient _client;
  Options _options(String token) => _client.authorizedOptions(token);

  Future<CommerceCart> getCart(String token) => _requestCart(() => _client.instance.get<Map<String, dynamic>>('/users/me/cart', options: _options(token)));
  Future<CommerceCart> addItem(String token, {required String productId, required String variantId, int quantity = 1}) => _requestCart(() => _client.instance.post<Map<String, dynamic>>('/users/me/cart/items', data: {'productId': productId, 'variantId': variantId, 'quantity': quantity}, options: _options(token)));
  Future<CommerceCart> updateItem(String token, CommerceCartItem item, int quantity) => _requestCart(() => _client.instance.put<Map<String, dynamic>>('/users/me/cart/items/${item.productId}/${item.variantId}', data: {'quantity': quantity}, options: _options(token)));
  Future<CommerceCart> removeItem(String token, CommerceCartItem item) => _requestCart(() => _client.instance.delete<Map<String, dynamic>>('/users/me/cart/items/${item.productId}/${item.variantId}', options: _options(token)));
  Future<CommerceCart> setAddress(String token, String? addressId) => _requestCart(() => _client.instance.patch<Map<String, dynamic>>('/users/me/cart/address', data: {'addressId': addressId}, options: _options(token)));
  Future<List<UserAddress>> addresses(String token) async { final json = await _get('/users/me/addresses', token); return ((json['addresses'] as List?) ?? const []).whereType<Map>().map((e) => UserAddress.fromJson(e.cast<String, dynamic>())).toList(); }
  Future<UserAddress> createAddress(String token, Map<String, dynamic> payload) async { final json = await _post('/users/me/addresses', token, payload); return UserAddress.fromJson((json['address'] as Map?)?.cast<String, dynamic>() ?? const {}); }
  Future<void> setDefaultAddress(String token, String id) async { await _patch('/users/me/addresses/$id/default', token, const {}); }
  Future<void> deleteAddress(String token, String id) async { await _delete('/users/me/addresses/$id', token); }
  Future<List<CommerceOrder>> orders(String token) async { final json = await _get('/orders/me', token); return ((json['orders'] as List?) ?? const []).whereType<Map>().map((e) => CommerceOrder.fromJson(e.cast<String, dynamic>())).toList(); }
  Future<List<CommerceOrder>> checkout(String token, Map<String, dynamic> payload) async { final json = await _post('/orders/checkout', token, payload); return ((json['orders'] as List?) ?? const []).whereType<Map>().map((e) => CommerceOrder.fromJson(e.cast<String, dynamic>())).toList(); }
  Future<void> cancelOrder(String token, String id, String reason) async { await _post('/orders/me/$id/cancel', token, {'reason': reason}); }
  Future<(List<CommerceNotification>, int)> notifications(String token) async { final json = await _get('/notifications', token); final list = ((json['notifications'] as List?) ?? const []).whereType<Map>().map((e) => CommerceNotification.fromJson(e.cast<String, dynamic>())).toList(); return (list, (json['unreadCount'] as num?)?.toInt() ?? 0); }
  Future<void> readNotification(String token, String id) async { await _patch('/notifications/$id/read', token, const {}); }
  Future<CommerceCart> _requestCart(Future<dynamic> Function() request) async { try { final response = await request(); return CommerceCart.fromJson(((response.data as Map?)?['cart'] as Map?)?.cast<String, dynamic>() ?? const {}); } catch (error) { throw ApiError.from(error); } }
  Future<Map<String, dynamic>> _get(String path, String token) async { try { return (await _client.instance.get<Map<String, dynamic>>(path, options: _options(token))).data ?? const {}; } catch (error) { throw ApiError.from(error); } }
  Future<Map<String, dynamic>> _post(String path, String token, Map<String, dynamic> data) async { try { return (await _client.instance.post<Map<String, dynamic>>(path, data: data, options: _options(token))).data ?? const {}; } catch (error) { throw ApiError.from(error); } }
  Future<void> _patch(String path, String token, Map<String, dynamic> data) async { try { await _client.instance.patch<Map<String, dynamic>>(path, data: data, options: _options(token)); } catch (error) { throw ApiError.from(error); } }
  Future<void> _delete(String path, String token) async { try { await _client.instance.delete<Map<String, dynamic>>(path, options: _options(token)); } catch (error) { throw ApiError.from(error); } }
}