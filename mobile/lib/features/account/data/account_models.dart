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

class ShopOwner {
  const ShopOwner({
    required this.id,
    required this.email,
    required this.name,
    required this.status,
  });

  final String id;
  final String email;
  final String name;
  final String status;

  factory ShopOwner.fromJson(Map<String, dynamic> json) {
    return ShopOwner(
      id: (json['id'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'status': status,
    };
  }
}

class OwnerAuthResult {
  const OwnerAuthResult({
    required this.success,
    required this.owner,
    required this.token,
  });

  final bool success;
  final ShopOwner owner;
  final String token;

  factory OwnerAuthResult.fromJson(Map<String, dynamic> json) {
    return OwnerAuthResult(
      success: json['success'] == true,
      owner: ShopOwner.fromJson(
        (json['owner'] as Map<String, dynamic>?) ?? const {},
      ),
      token: (json['token'] ?? '').toString(),
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
