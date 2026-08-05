import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../marketplace/data/catalog_models.dart';
import '../data/commerce_models.dart';
import '../data/commerce_service.dart';

String formatVnd(double value) {
  final digits = value.round().toString();
  final buffer = StringBuffer();
  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) buffer.write('.');
    buffer.write(digits[index]);
  }
  return '${buffer.toString()} VND';
}

Future<void> showAddToCartSheet(
  BuildContext context,
  CatalogProduct product,
) async {
  final session = AppSessionScope.of(context);
  if (!session.isSignedIn) {
    session.openLogin();
    return;
  }
  final variants = product.variants
      .where((variant) => variant.active && variant.stockQuantity > 0)
      .toList();
  if (variants.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('This item is currently unavailable.')),
    );
    return;
  }
  var selected = variants.first;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setSheetState) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Choose a variant',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(product.name, style: const TextStyle(color: AppColors.muted)),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: variants.map((variant) {
                  final label = [
                    if (variant.color.isNotEmpty) variant.color,
                    if (variant.size.isNotEmpty) variant.size,
                  ].join(' - ');
                  return ChoiceChip(
                    label: Text(label.isEmpty ? variant.sku : label),
                    selected: selected.id == variant.id,
                    onSelected: (_) => setSheetState(() => selected = variant),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              MiroirButton(
                label: 'Add to cart',
                icon: Icons.shopping_bag_outlined,
                onPressed: () async {
                  try {
                    await CommerceService().addItem(
                      session.authToken,
                      productId: product.id,
                      variantId: selected.id,
                    );
                    if (sheetContext.mounted) Navigator.of(sheetContext).pop();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Added to cart.')),
                      );
                    }
                  } on ApiError catch (error) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(error.message)),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class CartPage extends StatefulWidget {
  const CartPage({super.key});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final _service = CommerceService();
  CommerceCart? _cart;
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
    final token = AppSessionScope.of(context).authToken;
    if (token.isEmpty) return;
    if (mounted) setState(() => _loading = true);
    try {
      _cart = await _service.getCart(token);
      _error = '';
    } on ApiError catch (error) {
      _error = error.message;
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cart = _cart;
    return Scaffold(
      appBar: AppBar(title: const Text('Your bag')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : cart == null || cart.itemCount == 0
                  ? const Center(child: Text('Your bag is empty.'))
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                      children: [
                        for (final group in cart.groups) ...[
                          Text(
                            group.shopName,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 8),
                          ...group.items.map(
                            (item) => _CartItemTile(
                              item: item,
                              onQuantity: (quantity) async {
                                await _service.updateItem(
                                  AppSessionScope.of(context).authToken,
                                  item,
                                  quantity,
                                );
                                await _load();
                              },
                              onRemove: () async {
                                await _service.removeItem(
                                  AppSessionScope.of(context).authToken,
                                  item,
                                );
                                await _load();
                              },
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                        Text(
                          'Total  ${formatVnd(cart.subtotal)}',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 14),
                        MiroirButton(
                          label: 'Checkout',
                          icon: Icons.lock_outline_rounded,
                          onPressed: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => CheckoutPage(cart: cart),
                              ),
                            );
                            await _load();
                          },
                        ),
                      ],
                    ),
    );
  }
}

class _CartItemTile extends StatelessWidget {
  const _CartItemTile({
    required this.item,
    required this.onQuantity,
    required this.onRemove,
  });

  final CommerceCartItem item;
  final ValueChanged<int> onQuantity;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final variant = item.variant;
    final details = [
      if (variant != null && variant.color.isNotEmpty) variant.color,
      if (variant != null && variant.size.isNotEmpty) variant.size,
    ].join(' - ');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: item.imageUrl.isEmpty
                  ? const SizedBox(width: 64, height: 64)
                  : Image.network(
                      item.imageUrl,
                      width: 64,
                      height: 64,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox(
                        width: 64,
                        height: 64,
                        child: Icon(Icons.image_not_supported_outlined),
                      ),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (details.isNotEmpty)
                    Text(details, style: const TextStyle(color: AppColors.muted)),
                  Text(
                    formatVnd(item.lineTotal),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: item.quantity > 1
                  ? () => onQuantity(item.quantity - 1)
                  : onRemove,
              icon: const Icon(Icons.remove_circle_outline),
            ),
            Text('${item.quantity}'),
            IconButton(
              onPressed: () => onQuantity(item.quantity + 1),
              icon: const Icon(Icons.add_circle_outline),
            ),
          ],
        ),
      ),
    );
  }
}

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key, required this.cart});

  final CommerceCart cart;

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _service = CommerceService();
  List<UserAddress> _addresses = [];
  String? _addressId;
  bool _loading = true;
  bool _submitting = false;
  final Map<String, String> _methods = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAddresses());
  }

  Future<void> _loadAddresses() async {
    try {
      _addresses = await _service.addresses(AppSessionScope.of(context).authToken);
      final defaultAddress = _addresses.where((address) => address.isDefault);
      _addressId = widget.cart.addressId ??
          (defaultAddress.isEmpty ? null : defaultAddress.first.id);
    } on ApiError catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _checkout() async {
    if (_addressId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose a delivery address first.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final methods = <String, String>{
        for (final group in widget.cart.groups)
          group.shopId: _methods[group.shopId] ?? 'cash',
      };
      await _service.checkout(AppSessionScope.of(context).authToken, {
        'addressId': _addressId,
        'paymentMethods': methods,
        'idempotencyKey': DateTime.now().microsecondsSinceEpoch.toString(),
      });
      if (mounted) {
        Navigator.of(context).pop();
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const OrdersPage()),
        );
      }
    } on ApiError catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    }
    if (mounted) setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  'Delivery address',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 10),
                if (_addresses.isEmpty)
                  OutlinedButton.icon(
                    onPressed: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const AddressesPage()),
                      );
                      await _loadAddresses();
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add an address'),
                  )
                else
                  ..._addresses.map(
                    (address) => RadioListTile<String>(
                      value: address.id,
                      groupValue: _addressId,
                      title: Text(address.recipientName),
                      subtitle: Text('${address.phone}\n${address.fullAddress}'),
                      isThreeLine: true,
                      onChanged: (value) => setState(() => _addressId = value),
                    ),
                  ),
                const SizedBox(height: 18),
                Text(
                  'Payment method',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                ...widget.cart.groups.map(
                  (group) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      Text(group.shopName,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      DropdownButton<String>(
                        value: _methods[group.shopId] ?? 'cash',
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem(
                            value: 'cash',
                            child: Text('Cash on delivery'),
                          ),
                          if (group.bankTransferAvailable)
                            const DropdownMenuItem(
                              value: 'bank_transfer',
                              child: Text('Bank transfer'),
                            ),
                        ],
                        onChanged: (value) => setState(
                          () => _methods[group.shopId] = value ?? 'cash',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 26),
                Text(
                  'Total  ${formatVnd(widget.cart.subtotal)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 12),
                MiroirButton(
                  label: _submitting ? 'Placing order...' : 'Place order',
                  icon: Icons.check_circle_outline,
                  onPressed: _submitting ? null : _checkout,
                ),
              ],
            ),
    );
  }
}

class AddressesPage extends StatefulWidget {
  const AddressesPage({super.key});

  @override
  State<AddressesPage> createState() => _AddressesPageState();
}

class _AddressesPageState extends State<AddressesPage> {
  final _service = CommerceService();
  List<UserAddress> _addresses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      _addresses = await _service.addresses(AppSessionScope.of(context).authToken);
    } on ApiError catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _add() async {
    final controllers = List.generate(6, (_) => TextEditingController());
    const labels = [
      'Address label',
      'Recipient name',
      'Phone number',
      'Province code',
      'Ward code',
      'Street address',
    ];
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add a new address'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(
              labels.length,
              (index) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextField(
                  controller: controllers[index],
                  decoration: InputDecoration(labelText: labels[index]),
                ),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Save address'),
          ),
        ],
      ),
    );
    if (save == true) {
      try {
        await _service.createAddress(AppSessionScope.of(context).authToken, {
          'label': controllers[0].text,
          'recipientName': controllers[1].text,
          'phone': controllers[2].text,
          'provinceCode': controllers[3].text,
          'wardCode': controllers[4].text,
          'addressLine': controllers[5].text,
        });
        await _load();
      } on ApiError catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.message)),
          );
        }
      }
    }
    for (final controller in controllers) {
      controller.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('Add address'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _addresses.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(24),
                      children: const [
                        SizedBox(height: 96),
                        Icon(Icons.location_on_outlined, size: 48),
                        SizedBox(height: 16),
                        Center(
                          child: Text(
                            'No saved addresses yet',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        SizedBox(height: 8),
                        Center(
                          child: Text(
                            'Add an address to make checkout faster.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.muted),
                          ),
                        ),
                      ],
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 104),
                      children: [
                        const _CommerceSectionHeader(
                          title: 'Saved places',
                          subtitle: 'Choose a delivery address at checkout.',
                        ),
                        const SizedBox(height: 20),
                        ..._addresses.map(
                          (address) => _AddressCard(
                            address: address,
                            onMakeDefault: address.isDefault
                                ? null
                                : () async {
                                    await _service.setDefaultAddress(
                                      AppSessionScope.of(context).authToken,
                                      address.id,
                                    );
                                    await _load();
                                  },
                          ),
                        ),
                      ],
                    ),
            ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address, this.onMakeDefault});

  final UserAddress address;
  final VoidCallback? onMakeDefault;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: address.isDefault ? AppColors.mossSoft : AppColors.line,
          width: address.isDefault ? 1.5 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: AppColors.glassShadow,
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: AppColors.accentSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.home_outlined, color: AppColors.ink),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  address.label.isEmpty ? 'Delivery address' : address.label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              if (address.isDefault)
                const _StatusPill(
                  label: 'Default',
                  icon: Icons.check_circle_rounded,
                  color: AppColors.success,
                ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            address.recipientName,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(address.phone, style: const TextStyle(color: AppColors.muted)),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.location_on_outlined, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  address.fullAddress,
                  style: const TextStyle(height: 1.4, color: AppColors.muted),
                ),
              ),
            ],
          ),
          if (onMakeDefault != null) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onMakeDefault,
              icon: const Icon(Icons.star_outline, size: 18),
              label: const Text('Set as default'),
            ),
          ],
        ],
      ),
    );
  }
}

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final _service = CommerceService();
  List<CommerceOrder> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      _orders = await _service.orders(AppSessionScope.of(context).authToken);
    } on ApiError catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My orders')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _orders.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(24),
                      children: const [
                        SizedBox(height: 96),
                        Icon(Icons.receipt_long_outlined, size: 48),
                        SizedBox(height: 16),
                        Center(
                          child: Text(
                            'No orders yet',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        SizedBox(height: 8),
                        Center(
                          child: Text(
                            'Your completed checkout will appear here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.muted),
                          ),
                        ),
                      ],
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
                      children: [
                        const _CommerceSectionHeader(
                          title: 'Order activity',
                          subtitle: 'Track each shop order in one place.',
                        ),
                        const SizedBox(height: 20),
                        ..._orders.map((order) => _OrderCard(order: order)),
                      ],
                    ),
            ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});

  final CommerceOrder order;

  @override
  Widget build(BuildContext context) {
    final status = _orderStatus(order.orderStatus);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
        boxShadow: const [
          BoxShadow(
            color: AppColors.glassShadow,
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.shopName,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              Text(
                formatVnd(order.total),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _StatusPill(
            label: status.$1,
            icon: status.$2,
            color: status.$3,
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.receipt_outlined, size: 18, color: AppColors.muted),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Order ${order.orderCode}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.muted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.payments_outlined, size: 18, color: AppColors.muted),
              const SizedBox(width: 8),
              Text(
                'Payment: ${_paymentStatus(order.paymentStatus)}',
                style: const TextStyle(color: AppColors.muted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

(String, IconData, Color) _orderStatus(String value) {
  switch (value.toLowerCase()) {
    case 'preparing':
      return ('Preparing your order', Icons.inventory_2_outlined, AppColors.mossDark);
    case 'shipping':
    case 'shipped':
      return ('On the way', Icons.local_shipping_outlined, AppColors.mossDark);
    case 'delivered':
    case 'completed':
      return ('Delivered', Icons.check_circle_outline, AppColors.success);
    case 'cancelled':
      return ('Cancelled', Icons.cancel_outlined, Colors.redAccent);
    default:
      return ('Awaiting confirmation', Icons.schedule_outlined, AppColors.mossDark);
  }
}

String _paymentStatus(String value) {
  switch (value.toLowerCase()) {
    case 'paid':
      return 'Paid';
    case 'pending':
    case 'cod_pending':
      return 'Payment on delivery';
    default:
      return value.replaceAll('_', ' ');
  }
}

class _CommerceSectionHeader extends StatelessWidget {
  const _CommerceSectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 8),
        Text(subtitle, style: const TextStyle(color: AppColors.muted)),
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final _service = CommerceService();
  List<CommerceNotification> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      final response = await _service.notifications(
        AppSessionScope.of(context).authToken,
      );
      _items = response.$1;
    } on ApiError catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('You are all caught up.'))
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, index) {
                    final item = _items[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: item.read
                            ? AppColors.elevated
                            : AppColors.accentSoft,
                        child: Icon(
                          Icons.notifications_none_rounded,
                          color: item.read ? AppColors.muted : AppColors.ink,
                        ),
                      ),
                      tileColor: item.read
                          ? null
                          : AppColors.accentSoft.withValues(alpha: .3),
                      title: Text(
                        item.title,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(item.message),
                      onTap: () async {
                        if (!item.read) {
                          await _service.readNotification(
                            AppSessionScope.of(context).authToken,
                            item.id,
                          );
                          await _load();
                        }
                      },
                    );
                  },
                ),
    );
  }
}