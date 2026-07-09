import 'package:flutter_test/flutter_test.dart';
import 'package:miroir_mobile/features/account/data/owner_shop_models.dart';

void main() {
  test('shop product draft normalizes comma-separated payload fields', () {
    const draft = ShopProductDraft(
      name: 'Linen Shirt',
      category: 'tops',
      description: 'Lightweight summer shirt',
      priceText: '199000',
      gender: 'unisex',
      availability: 'in_stock',
      status: 'published',
      colorsText: 'white, beige,  ',
      sizesText: 'S, M, L',
      styleTagsText: 'minimal, smart casual',
      occasionTagsText: 'work, cafe',
      material: 'linen',
      fitType: 'relaxed',
    );

    final payload = draft.toPayload(
      imageUrl: 'https://example.com/product.jpg',
      imagePublicId: 'cloudinary-id',
    );

    expect(payload['price'], 199000);
    expect(payload['colors'], ['white', 'beige']);
    expect(payload['sizes'], ['S', 'M', 'L']);
    expect(payload['styleTags'], ['minimal', 'smart casual']);
    expect(payload['occasionTags'], ['work', 'cafe']);
    expect(payload['imageUrl'], 'https://example.com/product.jpg');
    expect(payload['imagePublicId'], 'cloudinary-id');
  });
}
