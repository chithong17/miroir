class StylistRequest {
  const StylistRequest({
    required this.prompt,
    this.userId,
    this.gender,
    this.skinTone,
    this.bodyShape,
    this.stylePreferences = const [],
    this.feedback,
    this.budgetMin,
    this.budgetMax,
    this.desiredOutfitCount = 5,
  });

  final String prompt;
  final String? userId;
  final String? gender;
  final String? skinTone;
  final String? bodyShape;
  final List<String> stylePreferences;
  final String? feedback;
  final double? budgetMin;
  final double? budgetMax;
  final int desiredOutfitCount;

  Map<String, dynamic> toJson() {
    final budget = <String, dynamic>{};
    if (budgetMin != null) {
      budget['min'] = budgetMin;
    }
    if (budgetMax != null) {
      budget['max'] = budgetMax;
    }

    final profile = <String, dynamic>{};
    if ((skinTone ?? '').trim().isNotEmpty) {
      profile['skinTone'] = skinTone!.trim();
    }
    if ((bodyShape ?? '').trim().isNotEmpty) {
      profile['bodyShape'] = bodyShape!.trim();
    }
    if (stylePreferences.isNotEmpty) {
      profile['stylePreferences'] = stylePreferences;
    }
    if ((feedback ?? '').trim().isNotEmpty) {
      profile['feedback'] = feedback!.trim();
    }

    final payload = <String, dynamic>{
      'prompt': prompt.trim(),
      'desiredOutfitCount': desiredOutfitCount,
    };

    if ((userId ?? '').trim().isNotEmpty) {
      payload['userId'] = userId!.trim();
    }
    if ((gender ?? '').trim().isNotEmpty) {
      payload['gender'] = gender!.trim();
    }
    if (budget.isNotEmpty) {
      payload['budget'] = budget;
    }
    if (profile.isNotEmpty) {
      payload['profile'] = profile;
    }

    return payload;
  }
}

class StylistResponse {
  const StylistResponse({
    required this.success,
    required this.noMatch,
    required this.message,
    required this.analysis,
    required this.outfits,
    required this.fitWarnings,
    required this.fashionTips,
    required this.retrieval,
  });

  final bool success;
  final bool noMatch;
  final String? message;
  final StylistAnalysis analysis;
  final List<StylistOutfit> outfits;
  final List<String> fitWarnings;
  final List<String> fashionTips;
  final StylistRetrieval retrieval;

  factory StylistResponse.fromJson(Map<String, dynamic> json) {
    return StylistResponse(
      success: json['success'] == true,
      noMatch: json['noMatch'] == true,
      message: json['message'] as String?,
      analysis: StylistAnalysis.fromJson(
        (json['analysis'] as Map<String, dynamic>?) ?? const {},
      ),
      outfits: (json['outfits'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StylistOutfit.fromJson)
          .toList(),
      fitWarnings: (json['fitWarnings'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      fashionTips: (json['fashionTips'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      retrieval: StylistRetrieval.fromJson(
        (json['retrieval'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class StylistAnalysis {
  const StylistAnalysis({
    required this.bodyShape,
    required this.skinTone,
    required this.styleMatch,
  });

  final String bodyShape;
  final String skinTone;
  final String styleMatch;

  factory StylistAnalysis.fromJson(Map<String, dynamic> json) {
    return StylistAnalysis(
      bodyShape: (json['bodyShape'] ?? '').toString(),
      skinTone: (json['skinTone'] ?? '').toString(),
      styleMatch: (json['styleMatch'] ?? '').toString(),
    );
  }
}

class StylistOutfit {
  const StylistOutfit({
    required this.id,
    required this.title,
    required this.score,
    required this.whyItMatches,
    required this.items,
    required this.fitWarnings,
    required this.fashionTips,
  });

  final String id;
  final String title;
  final int score;
  final String whyItMatches;
  final List<StylistOutfitItem> items;
  final List<String> fitWarnings;
  final List<String> fashionTips;

  factory StylistOutfit.fromJson(Map<String, dynamic> json) {
    return StylistOutfit(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      score: (json['score'] as num?)?.round() ?? 0,
      whyItMatches: (json['whyItMatches'] ?? '').toString(),
      items: (json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StylistOutfitItem.fromJson)
          .toList(),
      fitWarnings: (json['fitWarnings'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      fashionTips: (json['fashionTips'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
    );
  }
}

class StylistOutfitItem {
  const StylistOutfitItem({
    required this.reason,
    required this.product,
  });

  final String reason;
  final StylistProduct product;

  factory StylistOutfitItem.fromJson(Map<String, dynamic> json) {
    return StylistOutfitItem(
      reason: (json['reason'] ?? '').toString(),
      product: StylistProduct.fromJson(
        (json['product'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class StylistProduct {
  const StylistProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.imageUrl,
    required this.shopName,
  });

  final String id;
  final String name;
  final String category;
  final double price;
  final String imageUrl;
  final String shopName;

  factory StylistProduct.fromJson(Map<String, dynamic> json) {
    final shop = json['shop'] as Map<String, dynamic>?;

    return StylistProduct(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      imageUrl: (json['imageUrl'] ?? '').toString(),
      shopName: (shop?['name'] ?? '').toString(),
    );
  }
}

class StylistRetrieval {
  const StylistRetrieval({
    required this.productCount,
    required this.outfitCount,
    required this.fashionRuleCount,
  });

  final int productCount;
  final int outfitCount;
  final int fashionRuleCount;

  factory StylistRetrieval.fromJson(Map<String, dynamic> json) {
    return StylistRetrieval(
      productCount: (json['productCount'] as num?)?.toInt() ?? 0,
      outfitCount: (json['outfitCount'] as num?)?.toInt() ?? 0,
      fashionRuleCount: (json['fashionRuleCount'] as num?)?.toInt() ?? 0,
    );
  }
}
