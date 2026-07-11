class CatalogShopContact {
  const CatalogShopContact({
    required this.address,
    required this.email,
    required this.phone,
  });

  final String address;
  final String email;
  final String phone;

  factory CatalogShopContact.fromJson(Map<String, dynamic> json) {
    return CatalogShopContact(
      address: (json['address'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
    );
  }
}

class CatalogShop {
  const CatalogShop({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.logoUrl,
    required this.coverUrl,
    required this.contact,
  });

  final String id;
  final String name;
  final String slug;
  final String description;
  final String logoUrl;
  final String coverUrl;
  final CatalogShopContact contact;

  factory CatalogShop.fromJson(Map<String, dynamic> json) {
    return CatalogShop(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      logoUrl: (json['logoUrl'] ?? '').toString(),
      coverUrl: (json['coverUrl'] ?? '').toString(),
      contact: CatalogShopContact.fromJson(
        (json['contact'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class CatalogProduct {
  const CatalogProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.gender,
    required this.price,
    required this.availability,
    required this.material,
    required this.fitType,
    required this.imageUrl,
    required this.colors,
    required this.sizes,
    required this.styleTags,
    required this.occasionTags,
    required this.shop,
    required this.premiumShopDetailsRequired,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final String gender;
  final double price;
  final String availability;
  final String material;
  final String fitType;
  final String imageUrl;
  final List<String> colors;
  final List<String> sizes;
  final List<String> styleTags;
  final List<String> occasionTags;
  final CatalogShop? shop;
  final bool premiumShopDetailsRequired;

  factory CatalogProduct.fromJson(Map<String, dynamic> json) {
    List<String> parseList(String key) {
      final raw = json[key];
      if (raw is List) {
        return raw.map((item) => item.toString()).toList();
      }
      return const [];
    }

    return CatalogProduct(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      gender: (json['gender'] ?? '').toString(),
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse((json['price'] ?? '0').toString()) ?? 0,
      availability: (json['availability'] ?? '').toString(),
      material: (json['material'] ?? '').toString(),
      fitType: (json['fitType'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      colors: parseList('colors'),
      sizes: parseList('sizes'),
      styleTags: parseList('styleTags'),
      occasionTags: parseList('occasionTags'),
      shop: json['shop'] is Map<String, dynamic>
          ? CatalogShop.fromJson(json['shop'] as Map<String, dynamic>)
          : null,
      premiumShopDetailsRequired: json['premiumShopDetailsRequired'] == true,
    );
  }
}

class CatalogOutfit {
  const CatalogOutfit({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.gender,
    required this.styleTags,
    required this.products,
  });

  final String id;
  final String title;
  final String description;
  final String imageUrl;
  final String gender;
  final List<String> styleTags;
  final List<CatalogProduct> products;

  factory CatalogOutfit.fromJson(Map<String, dynamic> json) {
    final rawProducts = json['products'];
    final rawTags = json['styleTags'];
    return CatalogOutfit(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      gender: (json['gender'] ?? '').toString(),
      styleTags: rawTags is List
          ? rawTags.map((item) => item.toString()).toList()
          : const [],
      products: rawProducts is List
          ? rawProducts
              .whereType<Map<String, dynamic>>()
              .map(CatalogProduct.fromJson)
              .toList()
          : const [],
    );
  }
}

class CatalogPagination {
  const CatalogPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  final int page;
  final int limit;
  final int total;
  final int totalPages;

  factory CatalogPagination.fromJson(Map<String, dynamic> json) {
    int parse(String key, int fallback) {
      final value = json[key];
      if (value is num) {
        return value.toInt();
      }
      return int.tryParse((value ?? '').toString()) ?? fallback;
    }

    return CatalogPagination(
      page: parse('page', 1),
      limit: parse('limit', 12),
      total: parse('total', 0),
      totalPages: parse('totalPages', 1),
    );
  }
}

class CatalogProductsResult {
  const CatalogProductsResult({
    required this.products,
    required this.pagination,
  });

  final List<CatalogProduct> products;
  final CatalogPagination pagination;

  factory CatalogProductsResult.fromJson(Map<String, dynamic> json) {
    final rawProducts = json['products'];
    return CatalogProductsResult(
      products: rawProducts is List
          ? rawProducts
              .whereType<Map<String, dynamic>>()
              .map(CatalogProduct.fromJson)
              .toList()
          : const [],
      pagination: CatalogPagination.fromJson(
        (json['pagination'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class CatalogOutfitsResult {
  const CatalogOutfitsResult({
    required this.outfits,
    required this.pagination,
  });

  final List<CatalogOutfit> outfits;
  final CatalogPagination pagination;

  factory CatalogOutfitsResult.fromJson(Map<String, dynamic> json) {
    final rawOutfits = json['outfits'];
    return CatalogOutfitsResult(
      outfits: rawOutfits is List
          ? rawOutfits
              .whereType<Map<String, dynamic>>()
              .map(CatalogOutfit.fromJson)
              .toList()
          : const [],
      pagination: CatalogPagination.fromJson(
        (json['pagination'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}
