import 'package:flutter_test/flutter_test.dart';
import 'package:miroir_mobile/features/chat/data/chat_models.dart';

void main() {
  test('chat conversation parses counterpart and unread count', () {
    final conversation = ChatConversation.fromJson({
      'id': 'c1',
      'counterpart': {'id': 's1', 'name': 'Miroir Shop', 'logoUrl': 'logo'},
      'lastMessage': {'preview': 'Hello'},
      'unreadCount': 3,
    });
    expect(conversation.id, 'c1');
    expect(conversation.counterpart.name, 'Miroir Shop');
    expect(conversation.preview, 'Hello');
    expect(conversation.unreadCount, 3);
  });

  test('chat message parses immutable product context and images', () {
    final message = ChatMessage.fromJson({
      'id': 'm1', 'senderType': 'user', 'text': 'Is this available?',
      'createdAt': '2026-08-06T08:00:00.000Z',
      'images': [{'url': 'image'}],
      'context': {'type': 'product', 'productId': 'p1', 'name': 'Dress', 'price': 120000},
    });
    expect(message.context?.id, 'p1');
    expect(message.context?.title, 'Dress');
    expect(message.images.single.url, 'image');
  });
}
