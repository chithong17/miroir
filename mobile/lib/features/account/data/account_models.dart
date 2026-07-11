class BackendHealth {
  const BackendHealth({
    required this.success,
    required this.message,
  });

  final bool success;
  final String message;

  factory BackendHealth.fromJson(Map<String, dynamic> json) {
    return BackendHealth(
      success: json['success'] == true,
      message: (json['message'] ?? '').toString(),
    );
  }
}

class ShopOwnerSubscription {
  const ShopOwnerSubscription({
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

  static const free = ShopOwnerSubscription(
    planCode: 'FREE',
    status: 'inactive',
    expiresAt: '',
    isPremium: false,
    features: [],
  );

  factory ShopOwnerSubscription.fromJson(Map<String, dynamic>? json) {
    if (json == null) return ShopOwnerSubscription.free;
    final rawFeatures = json['features'];
    return ShopOwnerSubscription(
      planCode: (json['planCode'] ?? 'FREE').toString(),
      status: (json['status'] ?? 'inactive').toString(),
      expiresAt: (json['expiresAt'] ?? '').toString(),
      isPremium: json['isPremium'] == true,
      features: rawFeatures is List
          ? rawFeatures
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'planCode': planCode,
      'status': status,
      'expiresAt': expiresAt,
      'isPremium': isPremium,
      'features': features,
    };
  }
}

class ShopOwner {
  const ShopOwner({
    required this.id,
    required this.email,
    required this.name,
    required this.status,
    required this.subscription,
  });

  final String id;
  final String email;
  final String name;
  final String status;
  final ShopOwnerSubscription subscription;

  factory ShopOwner.fromJson(Map<String, dynamic> json) {
    return ShopOwner(
      id: (json['id'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      subscription: ShopOwnerSubscription.fromJson(
        json['subscription'] as Map<String, dynamic>?,
      ),
    );
  }

  ShopOwner copyWith({ShopOwnerSubscription? subscription}) {
    return ShopOwner(
      id: id,
      email: email,
      name: name,
      status: status,
      subscription: subscription ?? this.subscription,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'status': status,
      'subscription': subscription.toJson(),
    };
  }
}

class OwnerAuthResult {
  const OwnerAuthResult({
    required this.success,
    required this.owner,
    required this.token,
    required this.message,
  });

  final bool success;
  final ShopOwner owner;
  final String token;
  final String message;

  factory OwnerAuthResult.fromJson(Map<String, dynamic> json) {
    return OwnerAuthResult(
      success: json['success'] == true,
      owner: ShopOwner.fromJson(
        (json['owner'] as Map<String, dynamic>?) ?? const {},
      ),
      token: (json['token'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
    );
  }
}

class ShopOwnerSession {
  const ShopOwnerSession({
    required this.owner,
    required this.token,
  });

  final ShopOwner owner;
  final String token;

  bool get isPremium => owner.subscription.isPremium;

  ShopOwnerSession copyWith({ShopOwner? owner}) {
    return ShopOwnerSession(
      owner: owner ?? this.owner,
      token: token,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'owner': owner.toJson(),
      'token': token,
    };
  }

  factory ShopOwnerSession.fromJson(Map<String, dynamic> json) {
    return ShopOwnerSession(
      owner: ShopOwner.fromJson(
        (json['owner'] as Map<String, dynamic>?) ?? const {},
      ),
      token: (json['token'] ?? '').toString(),
    );
  }
}
