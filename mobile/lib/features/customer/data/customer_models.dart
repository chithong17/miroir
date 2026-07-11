class UserMeasurements {
  const UserMeasurements({
    this.height,
    this.weight,
    this.bust,
    this.waist,
    this.hips,
    this.shoulder,
  });

  final double? height;
  final double? weight;
  final double? bust;
  final double? waist;
  final double? hips;
  final double? shoulder;

  bool get isEmpty =>
      height == null &&
      weight == null &&
      bust == null &&
      waist == null &&
      hips == null &&
      shoulder == null;

  factory UserMeasurements.fromJson(Map<String, dynamic> json) {
    double? parse(String key) {
      final value = json[key];
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse((value ?? '').toString());
    }

    return UserMeasurements(
      height: parse('height'),
      weight: parse('weight'),
      bust: parse('bust'),
      waist: parse('waist'),
      hips: parse('hips'),
      shoulder: parse('shoulder'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (height != null) 'height': height,
      if (weight != null) 'weight': weight,
      if (bust != null) 'bust': bust,
      if (waist != null) 'waist': waist,
      if (hips != null) 'hips': hips,
      if (shoulder != null) 'shoulder': shoulder,
    };
  }
}

class UserProfile {
  const UserProfile({
    required this.gender,
    required this.bodyShape,
    required this.skinTone,
    required this.stylePreferences,
    required this.measurements,
    required this.modelImageUrl,
    required this.modelImagePublicId,
  });

  final String gender;
  final String bodyShape;
  final String skinTone;
  final List<String> stylePreferences;
  final UserMeasurements measurements;
  final String modelImageUrl;
  final String modelImagePublicId;

  bool get isEmpty =>
      gender.isEmpty &&
      bodyShape.isEmpty &&
      skinTone.isEmpty &&
      stylePreferences.isEmpty &&
      measurements.isEmpty &&
      modelImageUrl.isEmpty &&
      modelImagePublicId.isEmpty;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final rawPreferences = json['stylePreferences'];
    return UserProfile(
      gender: (json['gender'] ?? '').toString(),
      bodyShape: (json['bodyShape'] ?? '').toString(),
      skinTone: (json['skinTone'] ?? '').toString(),
      stylePreferences: rawPreferences is List
          ? rawPreferences
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
      measurements: UserMeasurements.fromJson(
        (json['measurements'] as Map<String, dynamic>?) ?? const {},
      ),
      modelImageUrl: (json['modelImageUrl'] ?? '').toString(),
      modelImagePublicId: (json['modelImagePublicId'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gender': gender,
      'bodyShape': bodyShape,
      'skinTone': skinTone,
      'stylePreferences': stylePreferences,
      'measurements': measurements.toJson(),
      'modelImageUrl': modelImageUrl,
      'modelImagePublicId': modelImagePublicId,
    };
  }
}

class UserUsageQuota {
  const UserUsageQuota({
    required this.feature,
    required this.period,
    required this.count,
    required this.limit,
    required this.remaining,
  });

  final String feature;
  final String period;
  final int count;
  final int? limit;
  final int? remaining;

  bool get isUnlimited => limit == null;
  bool get isExhausted => remaining != null && remaining! <= 0;

  factory UserUsageQuota.fromJson(Map<String, dynamic> json) {
    int? parseNullable(String key) {
      final value = json[key];
      if (value == null) return null;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString());
    }

    return UserUsageQuota(
      feature: (json['feature'] ?? 'tryon').toString(),
      period: (json['period'] ?? '').toString(),
      count: parseNullable('count') ?? 0,
      limit: parseNullable('limit'),
      remaining: parseNullable('remaining'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'feature': feature,
      'period': period,
      'count': count,
      'limit': limit,
      'remaining': remaining,
    };
  }
}

class UserSubscription {
  const UserSubscription({
    required this.planCode,
    required this.status,
    required this.expiresAt,
    required this.isPremium,
    required this.features,
    required this.usage,
  });

  final String planCode;
  final String status;
  final String? expiresAt;
  final bool isPremium;
  final List<String> features;
  final UserUsageQuota? usage;

  static const free = UserSubscription(
    planCode: 'FREE',
    status: 'inactive',
    expiresAt: null,
    isPremium: false,
    features: [],
    usage: null,
  );

  factory UserSubscription.fromJson(Map<String, dynamic> json) {
    final rawFeatures = json['features'];
    final rawUsage = json['usage'];
    return UserSubscription(
      planCode: (json['planCode'] ?? 'FREE').toString(),
      status: (json['status'] ?? 'inactive').toString(),
      expiresAt: json['expiresAt']?.toString(),
      isPremium: json['isPremium'] == true,
      features: rawFeatures is List
          ? rawFeatures
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
      usage: rawUsage is Map<String, dynamic>
          ? UserUsageQuota.fromJson(rawUsage)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'planCode': planCode,
      'status': status,
      'expiresAt': expiresAt,
      'isPremium': isPremium,
      'features': features,
      'usage': usage?.toJson(),
    };
  }
}

class CustomerUser {
  const CustomerUser({
    required this.id,
    required this.email,
    required this.name,
    required this.status,
    required this.profile,
    required this.profileCompleted,
    required this.profileSkipped,
    this.subscription = UserSubscription.free,
    this.favoriteProductIds = const [],
  });

  final String id;
  final String email;
  final String name;
  final String status;
  final UserProfile profile;
  final bool profileCompleted;
  final bool profileSkipped;
  final UserSubscription subscription;
  final List<String> favoriteProductIds;

  CustomerUser copyWith({
    String? id,
    String? email,
    String? name,
    String? status,
    UserProfile? profile,
    bool? profileCompleted,
    bool? profileSkipped,
    UserSubscription? subscription,
    List<String>? favoriteProductIds,
  }) {
    return CustomerUser(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      status: status ?? this.status,
      profile: profile ?? this.profile,
      profileCompleted: profileCompleted ?? this.profileCompleted,
      profileSkipped: profileSkipped ?? this.profileSkipped,
      subscription: subscription ?? this.subscription,
      favoriteProductIds: favoriteProductIds ?? this.favoriteProductIds,
    );
  }

  bool get needsProfileOnboarding => !profileCompleted && !profileSkipped;

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: (json['id'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      profile: UserProfile.fromJson(
        (json['profile'] as Map<String, dynamic>?) ?? const {},
      ),
      profileCompleted: json['profileCompleted'] == true,
      profileSkipped: json['profileSkipped'] == true,
      subscription: UserSubscription.fromJson(
        (json['subscription'] as Map<String, dynamic>?) ?? const {},
      ),
      favoriteProductIds: (json['favoriteProductIds'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'status': status,
      'profile': profile.toJson(),
      'profileCompleted': profileCompleted,
      'profileSkipped': profileSkipped,
      'subscription': subscription.toJson(),
      'favoriteProductIds': favoriteProductIds,
    };
  }
}

class UserAuthResult {
  const UserAuthResult({
    required this.success,
    required this.user,
    required this.token,
  });

  final bool success;
  final CustomerUser user;
  final String token;

  factory UserAuthResult.fromJson(Map<String, dynamic> json) {
    return UserAuthResult(
      success: json['success'] == true,
      user: CustomerUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
      token: (json['token'] ?? '').toString(),
    );
  }
}

class UserSession {
  const UserSession({
    required this.user,
    required this.token,
  });

  final CustomerUser user;
  final String token;

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'token': token,
    };
  }

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      user: CustomerUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
      token: (json['token'] ?? '').toString(),
    );
  }
}

class UserProfileDraft {
  const UserProfileDraft({
    required this.gender,
    required this.bodyShape,
    required this.skinTone,
    required this.stylePreferencesText,
    required this.heightText,
    required this.weightText,
    required this.bustText,
    required this.waistText,
    required this.hipsText,
    required this.shoulderText,
  });

  final String gender;
  final String bodyShape;
  final String skinTone;
  final String stylePreferencesText;
  final String heightText;
  final String weightText;
  final String bustText;
  final String waistText;
  final String hipsText;
  final String shoulderText;

  factory UserProfileDraft.fromUser(CustomerUser user) {
    final profile = user.profile;
    return UserProfileDraft(
      gender: profile.gender,
      bodyShape: profile.bodyShape,
      skinTone: profile.skinTone,
      stylePreferencesText: profile.stylePreferences.join(', '),
      heightText: profile.measurements.height?.toString() ?? '',
      weightText: profile.measurements.weight?.toString() ?? '',
      bustText: profile.measurements.bust?.toString() ?? '',
      waistText: profile.measurements.waist?.toString() ?? '',
      hipsText: profile.measurements.hips?.toString() ?? '',
      shoulderText: profile.measurements.shoulder?.toString() ?? '',
    );
  }

  Map<String, dynamic> toPayload() {
    double? parse(String value) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) {
        return null;
      }
      return double.tryParse(trimmed);
    }

    return {
      if (gender.trim().isNotEmpty) 'gender': gender.trim(),
      if (bodyShape.trim().isNotEmpty) 'bodyShape': bodyShape.trim(),
      if (skinTone.trim().isNotEmpty) 'skinTone': skinTone.trim(),
      'stylePreferences': stylePreferencesText
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      if (parse(heightText) != null) 'height': parse(heightText),
      if (parse(weightText) != null) 'weight': parse(weightText),
      if (parse(bustText) != null) 'bust': parse(bustText),
      if (parse(waistText) != null) 'waist': parse(waistText),
      if (parse(hipsText) != null) 'hips': parse(hipsText),
      if (parse(shoulderText) != null) 'shoulder': parse(shoulderText),
    };
  }
}
