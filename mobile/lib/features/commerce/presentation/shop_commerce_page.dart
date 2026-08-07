import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../chat/presentation/chat_pages.dart';
import '../data/commerce_service.dart'; // formatVnd might be here, if not string interp is fine.
import '../../../shared/models/local_image_data.dart';
import '../../../shared/widgets/miroir_button.dart';

class ShopCommercePage extends StatefulWidget {
  const ShopCommercePage({super.key});

  @override
  State<ShopCommercePage> createState() => _ShopCommercePageState();
}

class _ShopCommercePageState extends State<ShopCommercePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);
  final _client = ApiClient();
  final _picker = ImagePicker();
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _returns = [];
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
      final returnsResponse = await _client.instance.get<Map<String, dynamic>>(
        '/shop-orders/returns',
        options: options,
      );
      final notificationsResponse =
          await _client.instance.get<Map<String, dynamic>>(
        '/shop-notifications',
        options: options,
      );
      _orders = _mapsFrom(ordersResponse.data?['orders']);
      _returns = _mapsFrom(returnsResponse.data?['returns']);
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

  Future<void> _decideReturn(String returnId, bool approved, String text) async {
    try {
      await _client.instance.patch<Map<String, dynamic>>(
        '/shop-orders/returns/$returnId/decision',
        data: {'approved': approved, 'reason': approved ? '' : text, 'instructions': approved ? text : ''},
        options: _client.authorizedOptions(AppSessionScope.of(context).shopOwnerToken),
      );
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Return ${approved ? 'approved' : 'rejected'}')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(e).message)));
    }
  }

  Future<void> _receiveReturn(String returnId) async {
    try {
      await _client.instance.patch<Map<String, dynamic>>(
        '/shop-orders/returns/$returnId/received',
        options: _client.authorizedOptions(AppSessionScope.of(context).shopOwnerToken),
      );
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as received')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(e).message)));
    }
  }

  Future<void> _refundReturn(String returnId, String note, LocalImageData image) async {
    try {
      final formData = FormData.fromMap({
        'note': note,
        'images': MultipartFile.fromBytes(image.bytes, filename: image.name, contentType: MediaType.parse(image.mimeType ?? 'image/jpeg')),
      });
      await _client.instance.patch<Map<String, dynamic>>(
        '/shop-orders/returns/$returnId/refund',
        data: formData,
        options: _client.authorizedOptions(AppSessionScope.of(context).shopOwnerToken),
      );
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Refund processed')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(e).message)));
    }
  }

  void _showDecideDialog(String returnId, bool approved) {
    final controller = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(approved ? 'Approve Return' : 'Reject Return'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(approved ? 'Provide return shipping instructions (optional):' : 'Reason for rejection:'),
            const SizedBox(height: 8),
            TextField(controller: controller, decoration: const InputDecoration(border: OutlineInputBorder()), maxLines: 3),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _decideReturn(returnId, approved, controller.text);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  void _showRefundDialog(String returnId) {
    final controller = TextEditingController();
    LocalImageData? proofImage;
    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Process Refund'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Provide proof of transfer:'),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () async {
                    final file = await _picker.pickImage(source: ImageSource.gallery);
                    if (file != null) {
                      final bytes = await file.readAsBytes();
                      setDialogState(() => proofImage = LocalImageData(name: file.name, bytes: bytes, mimeType: file.mimeType));
                    }
                  },
                  child: Container(
                    height: 100, width: double.infinity,
                    color: AppColors.canvas,
                    child: proofImage != null
                        ? Image.memory(proofImage!.bytes, fit: BoxFit.cover)
                        : const Center(child: Icon(Icons.add_photo_alternate_outlined)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Internal Note (optional):'),
                const SizedBox(height: 8),
                TextField(controller: controller, decoration: const InputDecoration(border: OutlineInputBorder()), maxLines: 2),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () {
                if (proofImage == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Proof of transfer is required.')));
                  return;
                }
                Navigator.of(ctx).pop();
                _refundReturn(returnId, controller.text, proofImage!);
              },
              child: const Text('Refund'),
            ),
          ],
        ),
      ),
    );
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
            Tab(text: 'Returns'),
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
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (_, index) {
                                final order = _orders[index];
                                final recipient = order['recipient'] as Map?;
                                final name = recipient?['name'] ?? 'Customer';
                                final status = (order['orderStatus'] ?? '').toString().replaceAll('_', ' ');
                                return Card(
                                  child: ListTile(
                                    onTap: () => showModalBottomSheet<void>(
                                      context: context,
                                      showDragHandle: true,
                                      builder: (sheetContext) => Padding(
                                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                                        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text('Order ${order['orderCode'] ?? ''}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                                          const SizedBox(height: 8),
                                          Text('$name · $status'),
                                          const SizedBox(height: 20),
                                          SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () { Navigator.of(sheetContext).pop(); openShopOrderChat(context, '${order['id'] ?? ''}'); }, icon: const Icon(Icons.chat_bubble_outline_rounded), label: const Text('Message customer'))),
                                        ]),
                                      ),
                                    ),
                                    title: Text('${order['orderCode'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    subtitle: Text('$name - $status\n${order['paymentStatus'] ?? ''}'),
                                    isThreeLine: true,
                                    trailing: Text('${order['total'] ?? 0} VND', style: const TextStyle(fontWeight: FontWeight.w700)),
                                  ),
                                );
                              },
                            ),
                          ),
                    _returns.isEmpty
                        ? const Center(child: Text('No returns requested.'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _returns.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (_, index) {
                                final ret = _returns[index];
                                final status = (ret['status'] ?? '').toString().replaceAll('_', ' ');
                                return Card(
                                  child: ListTile(
                                    onTap: () => showModalBottomSheet<void>(
                                      context: context,
                                      showDragHandle: true,
                                      builder: (sheetContext) => Padding(
                                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                                        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text('Return for ${ret['orderCode'] ?? ''}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                                          const SizedBox(height: 8),
                                          Text('Status: $status'),
                                          const SizedBox(height: 8),
                                          Text('Reason: ${ret['reason'] ?? ''}'),
                                          const SizedBox(height: 20),
                                          if (ret['status'] == 'requested') ...[
                                            Row(children: [
                                              Expanded(child: FilledButton.tonal(onPressed: () { Navigator.of(sheetContext).pop(); _showDecideDialog('${ret['id']}', false); }, child: const Text('Reject'))),
                                              const SizedBox(width: 12),
                                              Expanded(child: FilledButton(onPressed: () { Navigator.of(sheetContext).pop(); _showDecideDialog('${ret['id']}', true); }, child: const Text('Approve'))),
                                            ])
                                          ] else if (ret['status'] == 'return_shipped') ...[
                                            SizedBox(width: double.infinity, child: FilledButton(onPressed: () { Navigator.of(sheetContext).pop(); _receiveReturn('${ret['id']}'); }, child: const Text('Mark Received'))),
                                          ] else if (ret['status'] == 'received') ...[
                                            SizedBox(width: double.infinity, child: FilledButton(onPressed: () { Navigator.of(sheetContext).pop(); _showRefundDialog('${ret['id']}'); }, child: const Text('Process Refund'))),
                                          ]
                                        ]),
                                      ),
                                    ),
                                    title: Text('Return ${ret['orderCode'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    subtitle: Text('Status: $status\nAmount: ${ret['refundAmount'] ?? 0} VND'),
                                    isThreeLine: true,
                                  ),
                                );
                              },
                            ),
                          ),
                    _notifications.isEmpty
                        ? const Center(child: Text('No new shop alerts.'))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                            itemCount: _notifications.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, index) {
                              final item = _notifications[index];
                              final read = item['readAt'] != null;
                              return Container(
                                decoration: BoxDecoration(
                                  color: read ? AppColors.surface : AppColors.accentSoft.withValues(alpha: .2),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: read ? AppColors.line : Colors.transparent),
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                  leading: CircleAvatar(
                                    backgroundColor: read
                                        ? AppColors.elevated
                                        : AppColors.accentSoft,
                                    child: Icon(
                                      Icons.notifications_none_rounded,
                                      color: read ? AppColors.muted : AppColors.ink,
                                    ),
                                  ),
                                  title: Text('${item['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(() {
                                      final msg = '${item['message'] ?? ''}';
                                      final parts = msg.split(': ');
                                      if (parts.length == 2 && parts[1].isNotEmpty) {
                                        final status = parts[1];
                                        final cap = status[0].toUpperCase() + status.substring(1).replaceAll('_', ' ');
                                        return '${parts[0]}: $cap';
                                      }
                                      return msg;
                                    }()),
                                  ),
                                ),
                              );
                            },
                          ),
                  ],
                ),
    );
  }
}
