import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:miroir_mobile/features/try_on/presentation/controllers/try_on_controller.dart';
import 'package:miroir_mobile/shared/models/local_image_data.dart';

void main() {
  final image = LocalImageData(
    name: 'demo.jpg',
    bytes: Uint8List.fromList([1, 2, 3]),
  );

  test('try-on validation rejects missing model image', () {
    final controller = TryOnController();
    expect(
      controller.validateSelection(),
      'Please upload a full-body model image.',
    );
    controller.dispose();
  });

  test('try-on validation rejects upper/lower mode without garments', () {
    final controller = TryOnController();
    controller.setImage(TryOnImageSlot.model, image);
    controller.setTryOnType('upper_lower');

    expect(
      controller.validateSelection(),
      'Upper / Lower mode requires at least one garment image.',
    );
    controller.dispose();
  });
}
