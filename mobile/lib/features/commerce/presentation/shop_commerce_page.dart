import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';

class ShopCommercePage extends StatefulWidget {
  const ShopCommercePage({super.key});

  @override
  State<ShopCommercePage> createState() => _ShopCommercePageState();
}

class _ShopCommercePageState extends State<ShopCommercePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  final _client = ApiClient();
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _notifications = [];
  String _error = '';
  bool _loading = true;
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      _load();
    }
  }

  Future<void> _load() async {
    final token = AppSessionScope.of(context).shopOwnerToken;
    if (token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    if (mounted) setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final options = _client.authorizedOptions(token);
      final ordersResponse = await _client.instance.get<Map<String, dynamic>>(
        '/shop-orders',
        options: options,
      );
      final notificationsResponse =
          await _client.instance.get<Map<String, dynamic>>(
        '/shop-notifications',
        options: options,
      );
      _orders = _mapsFrom(ordersResponse.data?['orders']);
      _notifications = _mapsFrom(notificationsResponse.data?['notifications']);
    } catch (error) {
      _error = ApiError.from(error).message;
    }
    if (mounted) setState(() => _loading = false);
  }

  List<Map<String, dynamic>> _mapsFrom(Object? value) {
    return (value as List? ?? const [])
        .whereType<Map>()
        .map((item) => item.cast<String, dynamic>())
        .toList();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop orders'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Orders'),
            Tab(text: 'Alerts'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : TabBarView(
                  controller: _tabs,
                  children: [
                    _orders.isEmpty
                        ? const Center(child: Text('No orders yet.'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _orders.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (_, index) {
                                final order = _orders[index];
                                final recipient = order['recipient'] as Map?;
                                final name = recipient?['name'] ?? 'Customer';
                                final status = (order['orderStatus'] ?? '')
                                    .toString()
                                    .replaceAll('_', ' ');
                                return Card(
                                  child: ListTile(
                                    title: Text(
                                      '${order['orderCode'] ?? ''}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    subtitle: Text(
                                      '$name - $status\n${order['paymentStatus'] ?? ''}',
                                    ),
                                    isThreeLine: true,
                                    trailing: Text(
                                      '${order['total'] ?? 0} VND',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    _notifications.isEmpty
                        ? const Center(child: Text('No new shop alerts.'))
                        : ListView.separated(
                            itemCount: _notifications.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (_, index) {
                              final item = _notifications[index];
                              return ListTile(
                                tileColor: item['readAt'] == null
                                    ? AppColors.accentSoft.withValues(alpha: .4)
                                    : null,
                                title: Text(
                                  '${item['title'] ?? ''}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                subtitle: Text('${item['message'] ?? ''}'),
                              );
                            },
                          ),
                  ],
                ),
    );
  }
}