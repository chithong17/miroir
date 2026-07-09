import 'dart:typed_data';

class LocalImageData {
  const LocalImageData({
    required this.name,
    required this.bytes,
    this.mimeType,
  });

  final String name;
  final Uint8List bytes;
  final String? mimeType;
}
