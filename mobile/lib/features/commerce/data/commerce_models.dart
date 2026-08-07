class CommerceVariant {
  const CommerceVariant({required this.id, required this.sku, required this.color, required this.size, required this.stockQuantity, required this.active});
  final String id;
  final String sku;
  final String color;
  final String size;
  final int stockQuantity;
  final bool active;
  factory CommerceVariant.fromJson(Map<String, dynamic> json) => CommerceVariant(
    id: '${json['id'] ?? ''}', sku: '${json['sku'] ?? ''}', color: '${json['color'] ?? ''}',
    size: '${json['size'] ?? ''}', stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
    active: json['active'] != false,
  );
}

class CommerceCartItem {
  const CommerceCartItem({required this.productId, required this.variantId, required this.quantity, required this.name, required this.imageUrl, required this.price, required this.variant, required this.available, required this.lineTotal});
  final String productId;
  final String variantId;
  final int quantity;
  final String name;
  final String imageUrl;
  final double price;
  final CommerceVariant? variant;
  final bool available;
  final double lineTotal;
  factory CommerceCartItem.fromJson(Map<String, dynamic> json) {
    final product = (json['product'] as Map?)?.cast<String, dynamic>() ?? const {};
    final variant = (json['variant'] as Map?)?.cast<String, dynamic>();
    return CommerceCartItem(productId: '${json['productId'] ?? ''}', variantId: '${json['variantId'] ?? ''}', quantity: (json['quantity'] as num?)?.toInt() ?? 0, name: '${product['name'] ?? ''}', imageUrl: '${product['imageUrl'] ?? ''}', price: (product['price'] as num?)?.toDouble() ?? 0, variant: variant == null ? null : CommerceVariant.fromJson(variant), available: json['available'] == true, lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0);
  }
}

class CommerceCartGroup {
  const CommerceCartGroup({required this.shopId, required this.shopName, required this.bankTransferAvailable, required this.items, required this.subtotal});
  final String shopId;
  final String shopName;
  final bool bankTransferAvailable;
  final List<CommerceCartItem> items;
  final double subtotal;
  factory CommerceCartGroup.fromJson(Map<String, dynamic> json) {
    final shop = (json['shop'] as Map?)?.cast<String, dynamic>() ?? const {};
    final raw = json['items'] as List? ?? const [];
    return CommerceCartGroup(shopId: '${shop['id'] ?? ''}', shopName: '${shop['name'] ?? 'Unavailable shop'}', bankTransferAvailable: shop['bankTransferAvailable'] == true, items: raw.whereType<Map>().map((e) => CommerceCartItem.fromJson(e.cast<String, dynamic>())).toList(), subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0);
  }
}

class CommerceCart {
  const CommerceCart({required this.id, required this.addressId, required this.groups, required this.itemCount, required this.subtotal});
  final String id;
  final String? addressId;
  final List<CommerceCartGroup> groups;
  final int itemCount;
  final double subtotal;
  factory CommerceCart.fromJson(Map<String, dynamic> json) {
    final raw = json['groups'] as List? ?? const [];
    return CommerceCart(id: '${json['id'] ?? ''}', addressId: json['addressId']?.toString(), groups: raw.whereType<Map>().map((e) => CommerceCartGroup.fromJson(e.cast<String, dynamic>())).toList(), itemCount: (json['itemCount'] as num?)?.toInt() ?? 0, subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0);
  }
}

class UserAddress {
  const UserAddress({required this.id, required this.label, required this.recipientName, required this.phone, required this.fullAddress, required this.isDefault});
  final String id;
  final String label;
  final String recipientName;
  final String phone;
  final String fullAddress;
  final bool isDefault;
  factory UserAddress.fromJson(Map<String, dynamic> json) => UserAddress(id: '${json['id'] ?? ''}', label: '${json['label'] ?? ''}', recipientName: '${json['recipientName'] ?? ''}', phone: '${json['phone'] ?? ''}', fullAddress: '${json['fullAddress'] ?? json['addressLine'] ?? ''}', isDefault: json['isDefault'] == true);
}

class CommerceOrder {
  const CommerceOrder({required this.id, required this.orderCode, required this.shopName, required this.total, required this.orderStatus, required this.paymentStatus, required this.paymentMethod, required this.items, required this.createdAt});
  final String id;
  final String orderCode;
  final String shopName;
  final double total;
  final String orderStatus;
  final String paymentStatus;
  final String paymentMethod;
  final List<CommerceCartItem> items;
  final String createdAt;
  factory CommerceOrder.fromJson(Map<String, dynamic> json) {
    final shop = (json['shopSnapshot'] as Map?)?.cast<String, dynamic>() ?? const {};
    final raw = json['items'] as List? ?? const [];
    return CommerceOrder(id: '${json['id'] ?? ''}', orderCode: '${json['orderCode'] ?? ''}', shopName: '${shop['name'] ?? 'Shop'}', total: (json['total'] as num?)?.toDouble() ?? 0, orderStatus: '${json['orderStatus'] ?? ''}', paymentStatus: '${json['paymentStatus'] ?? ''}', paymentMethod: '${json['paymentMethod'] ?? ''}', items: raw.whereType<Map>().map((e) { final item = e.cast<String, dynamic>(); return CommerceCartItem(productId: '${item['productId'] ?? ''}', variantId: '${item['variantId'] ?? ''}', quantity: (item['quantity'] as num?)?.toInt() ?? 0, name: '${item['name'] ?? ''}', imageUrl: '${item['imageUrl'] ?? ''}', price: (item['unitPrice'] as num?)?.toDouble() ?? 0, variant: CommerceVariant.fromJson(item), available: true, lineTotal: (item['lineTotal'] as num?)?.toDouble() ?? 0); }).toList(), createdAt: '${json['createdAt'] ?? ''}');
  }
}

class CommerceNotification {
  const CommerceNotification({required this.id, required this.title, required this.message, required this.read, required this.orderId, required this.createdAt});
  final String id;
  final String title;
  final String message;
  final bool read;
  final String? orderId;
  final String createdAt;
  factory CommerceNotification.fromJson(Map<String, dynamic> json) => CommerceNotification(id: '${json['id'] ?? ''}', title: '${json['title'] ?? ''}', message: '${json['message'] ?? ''}', read: json['readAt'] != null, orderId: json['orderId']?.toString(), createdAt: '${json['createdAt'] ?? ''}');
}

class CommerceReturnItem {
  const CommerceReturnItem({required this.productId, required this.variantId, required this.quantity, required this.name, required this.imageUrl, required this.unitPrice, required this.lineTotal});
  final String productId;
  final String variantId;
  final int quantity;
  final String name;
  final String imageUrl;
  final double unitPrice;
  final double lineTotal;
  factory CommerceReturnItem.fromJson(Map<String, dynamic> json) => CommerceReturnItem(productId: '${json['productId'] ?? ''}', variantId: '${json['variantId'] ?? ''}', quantity: (json['quantity'] as num?)?.toInt() ?? 0, name: '${json['name'] ?? ''}', imageUrl: '${json['imageUrl'] ?? ''}', unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0, lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0);
}

class CommerceReturn {
  const CommerceReturn({required this.id, required this.orderId, required this.orderCode, required this.shopId, required this.status, required this.refundAmount, required this.reason, required this.items, required this.createdAt, required this.attachments});
  final String id;
  final String orderId;
  final String orderCode;
  final String shopId;
  final String status;
  final double refundAmount;
  final String reason;
  final List<CommerceReturnItem> items;
  final String createdAt;
  final List<String> attachments;
  factory CommerceReturn.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? const [];
    final rawAttachments = json['attachments'] as List? ?? const [];
    return CommerceReturn(id: '${json['id'] ?? ''}', orderId: '${json['orderId'] ?? ''}', orderCode: '${json['orderCode'] ?? ''}', shopId: '${json['shopId'] ?? ''}', status: '${json['status'] ?? ''}', refundAmount: (json['refundAmount'] as num?)?.toDouble() ?? 0, reason: '${json['reason'] ?? ''}', items: rawItems.whereType<Map>().map((e) => CommerceReturnItem.fromJson(e.cast<String, dynamic>())).toList(), createdAt: '${json['createdAt'] ?? ''}', attachments: rawAttachments.whereType<String>().toList());
  }
}