class ChatCounterpart {
  const ChatCounterpart({required this.id, required this.name, required this.logoUrl});
  final String id;
  final String name;
  final String logoUrl;
  factory ChatCounterpart.fromJson(Map<String, dynamic> json) => ChatCounterpart(
        id: '${json['id'] ?? ''}',
        name: '${json['name'] ?? 'Conversation'}',
        logoUrl: '${json['logoUrl'] ?? ''}',
      );
}

class ChatConversation {
  const ChatConversation({
    required this.id,
    required this.counterpart,
    required this.preview,
    required this.unreadCount,
    required this.userLastReadAt,
    required this.shopLastReadAt,
  });
  final String id;
  final ChatCounterpart counterpart;
  final String preview;
  final int unreadCount;
  final DateTime? userLastReadAt;
  final DateTime? shopLastReadAt;
  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    final last = (json['lastMessage'] as Map?)?.cast<String, dynamic>() ?? const {};
    return ChatConversation(
      id: '${json['id'] ?? ''}',
      counterpart: ChatCounterpart.fromJson((json['counterpart'] as Map?)?.cast<String, dynamic>() ?? const {}),
      preview: '${last['preview'] ?? 'Start a conversation'}',
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      userLastReadAt: DateTime.tryParse('${json['userLastReadAt'] ?? ''}'),
      shopLastReadAt: DateTime.tryParse('${json['shopLastReadAt'] ?? ''}'),
    );
  }
}

class ChatContextDraft {
  const ChatContextDraft({required this.type, required this.id, required this.label});
  final String type;
  final String id;
  final String label;
}

class ChatMessageContext {
  const ChatMessageContext({required this.type, required this.id, required this.title, required this.imageUrl, required this.amount, required this.detail});
  final String type;
  final String id;
  final String title;
  final String imageUrl;
  final double amount;
  final String detail;
  factory ChatMessageContext.fromJson(Map<String, dynamic> json) {
    final type = '${json['type'] ?? ''}';
    return ChatMessageContext(
      type: type,
      id: '${type == 'order' ? json['orderId'] : json['productId'] ?? ''}',
      title: '${type == 'order' ? json['orderCode'] : json['name'] ?? ''}',
      imageUrl: '${json['imageUrl'] ?? ''}',
      amount: ((type == 'order' ? json['total'] : json['price']) as num?)?.toDouble() ?? 0,
      detail: type == 'order' ? '${json['itemCount'] ?? 0} items' : 'Product',
    );
  }
}

class ChatImage {
  const ChatImage({required this.url});
  final String url;
  factory ChatImage.fromJson(Map<String, dynamic> json) => ChatImage(url: '${json['url'] ?? ''}');
}

class ChatMessage {
  const ChatMessage({required this.id, required this.senderType, required this.text, required this.images, required this.context, required this.createdAt});
  final String id;
  final String senderType;
  final String text;
  final List<ChatImage> images;
  final ChatMessageContext? context;
  final DateTime createdAt;
  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: '${json['id'] ?? ''}',
        senderType: '${json['senderType'] ?? ''}',
        text: '${json['text'] ?? ''}',
        images: (json['images'] as List? ?? const []).whereType<Map>().map((e) => ChatImage.fromJson(e.cast<String, dynamic>())).toList(),
        context: json['context'] is Map ? ChatMessageContext.fromJson((json['context'] as Map).cast<String, dynamic>()) : null,
        createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}') ?? DateTime.now(),
      );
}

class ChatInboxResult {
  const ChatInboxResult({required this.conversations, required this.totalUnread});
  final List<ChatConversation> conversations;
  final int totalUnread;
}

class ChatMessagesResult {
  const ChatMessagesResult({required this.messages, required this.nextCursor});
  final List<ChatMessage> messages;
  final String? nextCursor;
}
