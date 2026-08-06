import 'dart:async';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';
import '../data/chat_models.dart';
import '../data/chat_service.dart';

final customerChatUnread = ValueNotifier<int>(0);
final shopChatUnread = ValueNotifier<int>(0);
String? _pendingCustomerShopId;
String? _pendingCustomerOrderId;
ChatContextDraft? _pendingCustomerContext;

class ChatUnreadMonitor extends StatefulWidget {
  const ChatUnreadMonitor({super.key, required this.actorType});
  final String actorType;
  @override State<ChatUnreadMonitor> createState() => _ChatUnreadMonitorState();
}

class _ChatUnreadMonitorState extends State<ChatUnreadMonitor> {
  final _service = ChatService();
  ChatSocketGateway? _socket;
  StreamSubscription? _subscription;
  bool _started = false;
  @override void didChangeDependencies() { super.didChangeDependencies(); if (_started) return; _started = true; final session = AppSessionScope.of(context); final token = widget.actorType == 'shop' ? session.shopOwnerToken : session.authToken; if (token.isEmpty) return; Future<void> refresh() async { try { final result = await _service.conversations(actorType: widget.actorType, token: token); (widget.actorType == 'shop' ? shopChatUnread : customerChatUnread).value = result.totalUnread; } catch (_) {} } _socket = ChatSocketGateway(actorType: widget.actorType, token: token)..connect(); _subscription = _socket!.events.listen((_) => refresh()); refresh(); }
  @override void dispose() { _subscription?.cancel(); _socket?.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => const SizedBox.shrink();
}

Future<void> openCustomerChat(BuildContext context, {String? shopId, String? orderId, ChatContextDraft? contextDraft}) async {
  final session = AppSessionScope.of(context);
  if (session.authToken.isEmpty) {
    _pendingCustomerShopId = shopId;
    _pendingCustomerOrderId = orderId;
    _pendingCustomerContext = contextDraft;
    session.openLogin();
    return;
  }
  try {
    final conversation = await ChatService().open(actorType: 'user', token: session.authToken, shopId: shopId, orderId: orderId);
    if (!context.mounted) return;
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatConversationPage(actorType: 'user', token: session.authToken, conversation: conversation, pendingContext: contextDraft)));
  } catch (error) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(error).message)));
  }
}

Future<void> openShopOrderChat(BuildContext context, String orderId) async {
  final session = AppSessionScope.of(context);
  try {
    final conversation = await ChatService().open(actorType: 'shop', token: session.shopOwnerToken, orderId: orderId);
    if (!context.mounted) return;
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatConversationPage(actorType: 'shop', token: session.shopOwnerToken, conversation: conversation, pendingContext: ChatContextDraft(type: 'order', id: orderId, label: 'Order'))));
  } catch (error) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(error).message)));
  }
}

class ChatInboxPage extends StatefulWidget {
  const ChatInboxPage({super.key, this.actorType = 'user'});
  final String actorType;
  @override State<ChatInboxPage> createState() => _ChatInboxPageState();
}

class _ChatInboxPageState extends State<ChatInboxPage> with WidgetsBindingObserver {
  final _service = ChatService();
  List<ChatConversation> _items = [];
  String _error = '';
  bool _loading = true;
  ChatSocketGateway? _socket;
  StreamSubscription? _subscription;
  bool _started = false;
  String get _token { final session = AppSessionScope.of(context); return widget.actorType == 'shop' ? session.shopOwnerToken : session.authToken; }

  @override void didChangeDependencies() { super.didChangeDependencies(); if (!_started) { _started = true; WidgetsBinding.instance.addObserver(this); _connect(); _load(); if (widget.actorType == 'user' && _token.isNotEmpty && (_pendingCustomerShopId != null || _pendingCustomerOrderId != null)) { final shopId = _pendingCustomerShopId; final orderId = _pendingCustomerOrderId; final draft = _pendingCustomerContext; _pendingCustomerShopId = null; _pendingCustomerOrderId = null; _pendingCustomerContext = null; WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) openCustomerChat(context, shopId: shopId, orderId: orderId, contextDraft: draft); }); } } }
  void _connect() { if (_token.isEmpty) return; _socket = ChatSocketGateway(actorType: widget.actorType, token: _token)..connect(); _subscription = _socket!.events.listen((_) => _load(silent: true)); }
  Future<void> _load({bool silent = false}) async { if (_token.isEmpty) { if (mounted) setState(() => _loading = false); return; } if (!silent && mounted) setState(() => _loading = true); try { final result = await _service.conversations(actorType: widget.actorType, token: _token); if (widget.actorType == 'shop') { shopChatUnread.value = result.totalUnread; } else { customerChatUnread.value = result.totalUnread; } if (mounted) setState(() { _items = result.conversations; _error = ''; }); } catch (e) { if (mounted) setState(() => _error = ApiError.from(e).message); } if (mounted) setState(() => _loading = false); }
  @override void didChangeAppLifecycleState(AppLifecycleState state) { if (state == AppLifecycleState.resumed) { _socket?.connect(); _load(silent: true); } else if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) { _socket?.disconnect(); } }
  @override void dispose() { WidgetsBinding.instance.removeObserver(this); _subscription?.cancel(); _socket?.dispose(); super.dispose(); }

  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.actorType == 'shop' ? 'Shop messages' : 'Messages')),
    body: _loading ? const Center(child: CircularProgressIndicator()) : _token.isEmpty ? const Center(child: Text('Sign in to view messages.')) : _error.isNotEmpty ? Center(child: Text(_error)) : RefreshIndicator(
      onRefresh: _load,
      child: _items.isEmpty ? ListView(children: const [SizedBox(height: 220), Center(child: Text('No conversations yet.'))]) : ListView.separated(
        padding: const EdgeInsets.all(16), itemCount: _items.length, separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, index) { final item = _items[index]; return ListTile(
          tileColor: item.unreadCount > 0 ? AppColors.accentSoft : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: AppColors.line)),
          leading: CircleAvatar(backgroundImage: item.counterpart.logoUrl.isNotEmpty ? NetworkImage(item.counterpart.logoUrl) : null, child: item.counterpart.logoUrl.isEmpty ? Text(item.counterpart.name.isEmpty ? '?' : item.counterpart.name.substring(0, 1)) : null),
          title: Text(item.counterpart.name, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(item.preview, maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: item.unreadCount > 0 ? Badge(label: Text('${item.unreadCount}')) : null,
          onTap: () async { await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatConversationPage(actorType: widget.actorType, token: _token, conversation: item))); _load(silent: true); },
        ); },
      ),
    ),
  );
}

class ChatConversationPage extends StatefulWidget {
  const ChatConversationPage({super.key, required this.actorType, required this.token, required this.conversation, this.pendingContext});
  final String actorType;
  final String token;
  final ChatConversation conversation;
  final ChatContextDraft? pendingContext;
  @override State<ChatConversationPage> createState() => _ChatConversationPageState();
}

class _ChatConversationPageState extends State<ChatConversationPage> with WidgetsBindingObserver {
  final _service = ChatService(); final _text = TextEditingController(); final _picker = ImagePicker(); final _scroll = ScrollController();
  List<ChatMessage> _messages = []; List<XFile> _images = []; ChatContextDraft? _context; String? _next; String _error = ''; String? _pendingClientMessageId; bool _sending = false; DateTime? _counterpartReadAt; ChatSocketGateway? _socket; StreamSubscription? _subscription;
  @override void initState() { super.initState(); _context = widget.pendingContext; _counterpartReadAt = widget.actorType == 'user' ? widget.conversation.shopLastReadAt : widget.conversation.userLastReadAt; WidgetsBinding.instance.addObserver(this); _socket = ChatSocketGateway(actorType: widget.actorType, token: widget.token)..connect(); _subscription = _socket!.events.listen((event) { final data = event['data']; if (data is! Map || data['conversationId'] != widget.conversation.id) return; if (event['event'] == 'chat:message.created') _load(); if (event['event'] == 'chat:read' && data['readerType'] != widget.actorType && mounted) setState(() => _counterpartReadAt = DateTime.tryParse('${data['readThroughAt'] ?? ''}')); }); _load(); }
  Future<void> _load({String? before}) async { try { final result = await _service.messages(actorType: widget.actorType, token: widget.token, conversationId: widget.conversation.id, before: before); if (!mounted) return; setState(() { _messages = before == null ? result.messages : [...result.messages, ..._messages]; _next = result.nextCursor; _error = ''; }); await _service.markRead(actorType: widget.actorType, token: widget.token, conversationId: widget.conversation.id); if (before == null) WidgetsBinding.instance.addPostFrameCallback((_) { if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent); }); } catch (e) { if (mounted) setState(() => _error = ApiError.from(e).message); } }
  Future<void> _pick() async { final picked = await _picker.pickMultiImage(imageQuality: 88); if (mounted) setState(() => _images = picked.take(3).toList()); }
  Future<void> _send() async { if (_text.text.trim().isEmpty && _images.isEmpty && _context == null) return; _pendingClientMessageId ??= '${DateTime.now().microsecondsSinceEpoch}-${identityHashCode(this)}'; setState(() { _sending = true; _error = ''; }); try { final message = await _service.send(actorType: widget.actorType, token: widget.token, conversationId: widget.conversation.id, clientMessageId: _pendingClientMessageId!, text: _text.text, images: _images, context: _context); if (!mounted) return; setState(() { if (!_messages.any((m) => m.id == message.id)) _messages.add(message); _text.clear(); _images = []; _context = null; _pendingClientMessageId = null; }); WidgetsBinding.instance.addPostFrameCallback((_) { if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 220), curve: Curves.easeOut); }); } catch (e) { if (mounted) setState(() => _error = ApiError.from(e).message); } if (mounted) setState(() => _sending = false); }
  @override void didChangeAppLifecycleState(AppLifecycleState state) { if (state == AppLifecycleState.resumed) { _socket?.connect(); _load(); } else if (state == AppLifecycleState.paused) { _socket?.disconnect(); } }
  @override void dispose() { WidgetsBinding.instance.removeObserver(this); _subscription?.cancel(); _socket?.dispose(); _text.dispose(); _scroll.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.conversation.counterpart.name)),
    body: Column(children: [
      if (_next != null) TextButton(onPressed: () => _load(before: _next), child: const Text('Load older messages')),
      Expanded(child: ListView.builder(controller: _scroll, padding: const EdgeInsets.all(16), itemCount: _messages.length, itemBuilder: (_, i) { final mine = _messages[i].senderType == widget.actorType; return _MessageBubble(message: _messages[i], mine: mine, read: mine && _counterpartReadAt != null && !_messages[i].createdAt.isAfter(_counterpartReadAt!)); })),
      if (_error.isNotEmpty) Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text(_error, style: const TextStyle(color: Colors.redAccent))),
      if (_context != null) ListTile(tileColor: AppColors.accentSoft, leading: const Icon(Icons.link), title: Text(_context!.label), subtitle: Text('Attached ${_context!.type}'), trailing: IconButton(onPressed: () => setState(() => _context = null), icon: const Icon(Icons.close))),
      if (_images.isNotEmpty) SizedBox(height: 44, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), children: _images.map((e) => Padding(padding: const EdgeInsets.only(right: 8), child: Chip(label: Text(e.name), onDeleted: () => setState(() => _images.remove(e))))).toList())),
      SafeArea(top: false, child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [IconButton(onPressed: _pick, icon: const Icon(Icons.add_photo_alternate_outlined)), Expanded(child: TextField(controller: _text, maxLength: 2000, minLines: 1, maxLines: 4, decoration: const InputDecoration(counterText: '', hintText: 'Message...'))), IconButton(onPressed: _sending ? null : _send, icon: _sending ? const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send_rounded))]))),
    ]),
  );
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.mine, required this.read}); final ChatMessage message; final bool mine; final bool read;
  @override Widget build(BuildContext context) => Align(alignment: mine ? Alignment.centerRight : Alignment.centerLeft, child: Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12), constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78), decoration: BoxDecoration(color: mine ? AppColors.mossDark : Colors.white, borderRadius: BorderRadius.circular(20), border: mine ? null : Border.all(color: AppColors.line)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [if (message.context != null) _ContextCard(context: message.context!, mine: mine), if (message.text.isNotEmpty) Text(message.text, style: TextStyle(color: mine ? Colors.white : AppColors.ink)), if (message.images.isNotEmpty) ...[const SizedBox(height: 8), Wrap(spacing: 6, runSpacing: 6, children: message.images.map((e) => ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(e.url, width: 130, height: 130, fit: BoxFit.cover))).toList())], const SizedBox(height: 4), Text('${TimeOfDay.fromDateTime(message.createdAt.toLocal()).format(context)}${read ? ' · Read' : ''}', style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : AppColors.muted))])));
}

class _ContextCard extends StatelessWidget { const _ContextCard({required this.context, required this.mine}); final ChatMessageContext context; final bool mine; @override Widget build(BuildContext contextWidget) => InkWell(onTap: () => showDialog<void>(context: contextWidget, builder: (_) => AlertDialog(title: Text(context.title), content: Text('${context.detail}\n${context.amount.toStringAsFixed(0)} VND'), actions: [TextButton(onPressed: () => Navigator.of(contextWidget, rootNavigator: true).pop(), child: const Text('Close'))])), borderRadius: BorderRadius.circular(14), child: Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: mine ? Colors.white12 : AppColors.accentSoft, borderRadius: BorderRadius.circular(14)), child: Row(mainAxisSize: MainAxisSize.min, children: [if (context.imageUrl.isNotEmpty) ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network(context.imageUrl, width: 48, height: 48, fit: BoxFit.cover)), const SizedBox(width: 8), Flexible(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(context.title, style: TextStyle(fontWeight: FontWeight.w800, color: mine ? Colors.white : AppColors.ink)), Text('${context.detail} · ${context.amount.toStringAsFixed(0)} VND', style: TextStyle(fontSize: 11, color: mine ? Colors.white70 : AppColors.muted))]))]))); }
