class OwnerShop {
  const OwnerShop({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.slug,
    required this.description,
    required this.logoUrl,
    required this.coverUrl,
    required this.status,
  });

  final String id;
  final String ownerId;
  final String name;
  final String slug;
  final String description;
  final String logoUrl;
  final String coverUrl;
  final String status;

  factory OwnerShop.fromJson(Map<String, dynamic> json) {
    return OwnerShop(
      id: (json['id'] ?? '').toString(),
      ownerId: (json['ownerId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      logoUrl: (json['logoUrl'] ?? '').toString(),
      coverUrl: (json['coverUrl'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
    );
  }
}

class ShopProduct {
  const ShopProduct({
    required this.id,
    required this.shopId,
    required this.name,
    required this.category,
    required this.description,
    required this.colors,
    required this.sizes,
    required this.price,
    required this.gender,
    required this.availability,
    required this.imageUrl,
    required this.imagePublicId,
    required this.styleTags,
    required this.occasionTags,
    required this.material,
    required this.fitType,
    required this.status,
    required this.embeddingStale,
  });

  final String id;
  final String shopId;
  final String name;
  final String category;
  final String description;
  final List<String> colors;
  final List<String> sizes;
  final double price;
  final String gender;
  final String availability;
  final String imageUrl;
  final String imagePublicId;
  final List<String> styleTags;
  final List<String> occasionTags;
  final String material;
  final String fitType;
  final String status;
  final bool embeddingStale;

  factory ShopProduct.fromJson(Map<String, dynamic> json) {
    List<String> parseList(String key) {
      return (json[key] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList();
    }

    return ShopProduct(
      id: (json['id'] ?? '').toString(),
      shopId: (json['shopId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      colors: parseList('colors'),
      sizes: parseList('sizes'),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      gender: (json['gender'] ?? '').toString(),
      availability: (json['availability'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      imagePublicId: (json['imagePublicId'] ?? '').toString(),
      styleTags: parseList('styleTags'),
      occasionTags: parseList('occasionTags'),
      material: (json['material'] ?? '').toString(),
      fitType: (json['fitType'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      embeddingStale: json['embeddingStale'] == true,
    );
  }
}

class UploadedProductImage {
  const UploadedProductImage({
    required this.imageUrl,
    required this.imagePublicId,
  });

  final String imageUrl;
  final String imagePublicId;

  factory UploadedProductImage.fromJson(Map<String, dynamic> json) {
    return UploadedProductImage(
      imageUrl: (json['imageUrl'] ?? '').toString(),
      imagePublicId: (json['imagePublicId'] ?? '').toString(),
    );
  }
}

class ShopProductDraft {
  const ShopProductDraft({
    required this.name,
    required this.category,
    required this.description,
    required this.priceText,
    required this.gender,
    required this.availability,
    required this.status,
    required this.colorsText,
    required this.sizesText,
    required this.styleTagsText,
    required this.occasionTagsText,
    required this.material,
    required this.fitType,
  });

  final String name;
  final String category;
  final String description;
  final String priceText;
  final String gender;
  final String availability;
  final String status;
  final String colorsText;
  final String sizesText;
  final String styleTagsText;
  final String occasionTagsText;
  final String material;
  final String fitType;

  factory ShopProductDraft.fromProduct(ShopProduct product) {
    String joinValues(List<String> values) => values.join(', ');

    return ShopProductDraft(
      name: product.name,
      category: product.category,
      description: product.description,
      priceText: product.price.toStringAsFixed(0),
      gender: product.gender,
      availability: product.availability,
      status: product.status,
      colorsText: joinValues(product.colors),
      sizesText: joinValues(product.sizes),
      styleTagsText: joinValues(product.styleTags),
      occasionTagsText: joinValues(product.occasionTags),
      material: product.material,
      fitType: product.fitType,
    );
  }

  static List<String> parseList(String rawValue) {
    return rawValue
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  Map<String, dynamic> toPayload({
    String? imageUrl,
    String? imagePublicId,
  }) {
    final payload = <String, dynamic>{
      'name': name.trim(),
      'category': category.trim(),
      'description': description.trim(),
      'price': double.parse(priceText.trim()),
      'gender': gender.trim(),
      'availability': availability.trim(),
      'status': status.trim(),
      'colors': parseList(colorsText),
      'sizes': parseList(sizesText),
      'styleTags': parseList(styleTagsText),
      'occasionTags': parseList(occasionTagsText),
      'material': material.trim(),
      'fitType': fitType.trim(),
    };

    if ((imageUrl ?? '').trim().isNotEmpty) {
      payload['imageUrl'] = imageUrl!.trim();
    }
    if ((imagePublicId ?? '').trim().isNotEmpty) {
      payload['imagePublicId'] = imagePublicId!.trim();
    }

    return payload;
  }
}
