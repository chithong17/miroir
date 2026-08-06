import 'dart:async';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import 'chat_models.dart';

class ChatService {
  ChatService({ApiClient? client}) : _client = client ?? ApiClient();
  final ApiClient _client;
  String _root(String actorType) => actorType == 'shop' ? '/shop-chat' : '/chat';

  Future<ChatInboxResult> conversations({required String actorType, required String token}) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>('${_root(actorType)}/conversations', options: _client.authorizedOptions(token));
      final json = response.data ?? const {};
      return ChatInboxResult(
        conversations: (json['conversations'] as List? ?? const []).whereType<Map>().map((e) => ChatConversation.fromJson(e.cast<String, dynamic>())).toList(),
        totalUnread: (json['totalUnread'] as num?)?.toInt() ?? 0,
      );
    } catch (error) { throw ApiError.from(error); }
  }

  Future<ChatConversation> open({required String actorType, required String token, String? shopId, String? orderId}) async {
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '${_root(actorType)}/conversations',
        data: {if (shopId != null) 'shopId': shopId, if (orderId != null) 'orderId': orderId},
        options: _client.authorizedOptions(token),
      );
      return ChatConversation.fromJson((response.data?['conversation'] as Map?)?.cast<String, dynamic>() ?? const {});
    } catch (error) { throw ApiError.from(error); }
  }

  Future<ChatMessagesResult> messages({required String actorType, required String token, required String conversationId, String? before}) async {
    try {
      final response = await _client.instance.get<Map<String, dynamic>>(
        '${_root(actorType)}/conversations/$conversationId/messages',
        queryParameters: {if (before != null) 'before': before},
        options: _client.authorizedOptions(token),
      );
      final json = response.data ?? const {};
      return ChatMessagesResult(
        messages: (json['messages'] as List? ?? const []).whereType<Map>().map((e) => ChatMessage.fromJson(e.cast<String, dynamic>())).toList(),
        nextCursor: json['nextCursor']?.toString(),
      );
    } catch (error) { throw ApiError.from(error); }
  }

  Future<ChatMessage> send({required String actorType, required String token, required String conversationId, required String clientMessageId, required String text, required List<XFile> images, ChatContextDraft? context}) async {
    final form = FormData();
    form.fields.add(MapEntry('clientMessageId', clientMessageId));
    if (text.trim().isNotEmpty) form.fields.add(MapEntry('text', text.trim()));
    if (context != null) {
      form.fields.add(MapEntry('contextType', context.type));
      form.fields.add(MapEntry('contextId', context.id));
    }
    for (final image in images.take(3)) {
      form.files.add(MapEntry('images', await MultipartFile.fromFile(image.path, filename: image.name)));
    }
    try {
      final response = await _client.instance.post<Map<String, dynamic>>(
        '${_root(actorType)}/conversations/$conversationId/messages', data: form,
        options: _client.authorizedOptions(token),
      );
      return ChatMessage.fromJson((response.data?['message'] as Map?)?.cast<String, dynamic>() ?? const {});
    } catch (error) { throw ApiError.from(error); }
  }

  Future<void> markRead({required String actorType, required String token, required String conversationId}) async {
    try {
      await _client.instance.patch('${_root(actorType)}/conversations/$conversationId/read', options: _client.authorizedOptions(token));
    } catch (error) { throw ApiError.from(error); }
  }
}

class ChatSocketGateway {
  ChatSocketGateway({required this.actorType, required this.token});
  final String actorType;
  final String token;
  io.Socket? _socket;
  final _events = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get events => _events.stream;

  void connect() {
    disconnect();
    const override = String.fromEnvironment('SOCKET_URL', defaultValue: '');
    final base = override.isNotEmpty ? override : AppConstants.defaultApiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    _socket = io.io('$base/chat', io.OptionBuilder().setTransports(['websocket', 'polling']).setAuth({'actorType': actorType, 'token': token}).enableReconnection().disableAutoConnect().build());
    for (final name in ['chat:message.created', 'chat:conversation.updated', 'chat:read', 'chat:unread.updated']) {
      _socket!.on(name, (data) => _events.add({'event': name, 'data': data}));
    }
    _socket!.connect();
  }

  void disconnect() { _socket?.dispose(); _socket = null; }
  Future<void> dispose() async { disconnect(); await _events.close(); }
}
