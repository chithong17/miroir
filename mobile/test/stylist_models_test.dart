import 'package:flutter_test/flutter_test.dart';
import 'package:miroir_mobile/features/stylist/data/stylist_models.dart';

void main() {
  test('stylist request builds nested payload with budget and profile fields',
      () {
    const request = StylistRequest(
      prompt: 'Elegant dinner outfit',
      userId: 'user-1',
      gender: 'female',
      skinTone: 'warm',
      bodyShape: 'pear',
      stylePreferences: ['minimal', 'modern'],
      feedback: 'avoid oversized jackets',
      budgetMin: 200000,
      budgetMax: 800000,
    );

    final payload = request.toJson();

    expect(payload['prompt'], 'Elegant dinner outfit');
    expect(payload['userId'], 'user-1');
    expect(payload['gender'], 'female');
    expect(payload['desiredOutfitCount'], 5);
    expect(payload['budget'], {'min': 200000.0, 'max': 800000.0});
    expect(payload['profile'], {
      'skinTone': 'warm',
      'bodyShape': 'pear',
      'stylePreferences': ['minimal', 'modern'],
      'feedback': 'avoid oversized jackets',
    });
  });
}
