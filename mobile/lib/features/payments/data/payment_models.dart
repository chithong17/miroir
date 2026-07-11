class PaymentPlan {
  const PaymentPlan({
    required this.code,
    required this.name,
    required this.accountType,
    required this.price,
    required this.currency,
    required this.durationDays,
    required this.features,
  });

  final String code;
  final String name;
  final String accountType;
  final double price;
  final String currency;
  final int durationDays;
  final List<String> features;

  bool get isUserPremium => code == 'USER_PREMIUM_MONTHLY';

  factory PaymentPlan.fromJson(Map<String, dynamic> json) {
    final rawFeatures = json['features'];
    return PaymentPlan(
      code: (json['code'] ?? json['planCode'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      accountType: (json['accountType'] ?? '').toString(),
      price: json['amount'] is num
          ? (json['amount'] as num).toDouble()
          : json['price'] is num
              ? (json['price'] as num).toDouble()
              : double.tryParse(
                      (json['amount'] ?? json['price'] ?? '0').toString()) ??
                  0,
      currency: (json['currency'] ?? 'VND').toString(),
      durationDays: json['durationDays'] is num
          ? (json['durationDays'] as num).toInt()
          : int.tryParse((json['durationDays'] ?? '30').toString()) ?? 30,
      features: rawFeatures is List
          ? rawFeatures
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
    );
  }
}

class PaymentPlansResult {
  const PaymentPlansResult({required this.plans});

  final List<PaymentPlan> plans;

  PaymentPlan? get userPremiumPlan {
    for (final plan in plans) {
      if (plan.isUserPremium) return plan;
    }
    for (final plan in plans) {
      if (plan.accountType == 'user') return plan;
    }
    return null;
  }

  factory PaymentPlansResult.fromJson(Map<String, dynamic> json) {
    final rawPlans = json['plans'] ?? json['data'];
    return PaymentPlansResult(
      plans: rawPlans is List
          ? rawPlans
              .whereType<Map<String, dynamic>>()
              .map(PaymentPlan.fromJson)
              .toList()
          : const [],
    );
  }
}

class PaymentCreateResult {
  const PaymentCreateResult({
    required this.success,
    required this.orderCode,
    required this.checkoutUrl,
    required this.message,
  });

  final bool success;
  final String orderCode;
  final String checkoutUrl;
  final String message;

  factory PaymentCreateResult.fromJson(Map<String, dynamic> json) {
    final data = json['order'] is Map<String, dynamic>
        ? json['order'] as Map<String, dynamic>
        : json;
    return PaymentCreateResult(
      success: json['success'] == true,
      orderCode: (data['orderCode'] ?? json['orderCode'] ?? '').toString(),
      checkoutUrl: (data['checkoutUrl'] ??
              json['checkoutUrl'] ??
              data['paymentUrl'] ??
              '')
          .toString(),
      message: (json['message'] ?? '').toString(),
    );
  }
}

class PaymentStatusResult {
  const PaymentStatusResult({
    required this.success,
    required this.status,
    required this.isPaid,
    required this.message,
  });

  final bool success;
  final String status;
  final bool isPaid;
  final String message;

  factory PaymentStatusResult.fromJson(Map<String, dynamic> json) {
    final data = json['order'] is Map<String, dynamic>
        ? json['order'] as Map<String, dynamic>
        : json;
    final status = (data['status'] ?? json['status'] ?? '').toString();
    return PaymentStatusResult(
      success: json['success'] == true,
      status: status,
      isPaid: status.toLowerCase() == 'paid' || json['isPaid'] == true,
      message: (json['message'] ?? '').toString(),
    );
  }
}

class PaymentProfileResult {
  const PaymentProfileResult({
    required this.planCode,
    required this.status,
    required this.expiresAt,
    required this.isPremium,
    required this.features,
  });

  final String planCode;
  final String status;
  final String expiresAt;
  final bool isPremium;
  final List<String> features;

  factory PaymentProfileResult.fromJson(Map<String, dynamic> json) {
    final data = json['subscription'] is Map<String, dynamic>
        ? json['subscription'] as Map<String, dynamic>
        : json;
    final rawFeatures = data['features'];
    return PaymentProfileResult(
      planCode: (data['planCode'] ?? 'FREE').toString(),
      status: (data['status'] ?? 'inactive').toString(),
      expiresAt: (data['expiresAt'] ?? '').toString(),
      isPremium: data['isPremium'] == true,
      features: rawFeatures is List
          ? rawFeatures
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
    );
  }
}
