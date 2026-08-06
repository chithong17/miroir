import { useCallback, useEffect, useRef, useState } from "react";
import { getUserMe, setUserToken } from "../api/userApi.js";
import { listMyShops, setShopToken } from "../api/shopApi.js";
import {
  listChatConversations, listChatMessages, markChatRead, sendChatMessage,
} from "../api/chatApi.js";
import { connectChatSocket } from "../api/chatSocket.js";
import { AppShell, Button, TopNav, formatMoney } from "../components/ui/index.jsx";

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const contextKey = (actorType, id) => `${actorType === "shop" ? "miroir_shop" : "miroir"}_chat_context_${id}`;

export default function ChatPage({ actorType, initialConversationId = "" }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [pendingContext, setPendingContext] = useState(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [notice, setNotice] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState("");
  const bottomRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  const releasePreview = (url) => {
    if (!url || !previewUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  const chooseImages = (event) => {
    images.forEach((item) => releasePreview(item.previewUrl));
    const selected = Array.from(event.target.files || []).slice(0, 3).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { file, previewUrl };
    });
    setImages(selected);
    event.target.value = "";
  };

  const removeSelectedImage = (index) => {
    setImages((current) => current.filter((item, itemIndex) => {
      if (itemIndex === index) releasePreview(item.previewUrl);
      return itemIndex !== index;
    }));
  };

  const loadInbox = useCallback(async () => {
    const result = await listChatConversations(actorType);
    setConversations(result.conversations || []);
    window.dispatchEvent(new CustomEvent("miroir:chat-unread", { detail: result.totalUnread || 0 }));
    if (!activeId && result.conversations?.[0]) setActiveId(result.conversations[0].id);
  }, [actorType, activeId]);

  const loadThread = useCallback(async (id) => {
    if (!id) return;
    const result = await listChatMessages(actorType, id);
    setMessages((current) => {
      const pending = current.filter((message) => message._optimistic && message.conversationId === id);
      return [...(result.messages || []), ...pending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    setNextBefore(result.nextCursor || null);
    await markChatRead(actorType, id);
    window.dispatchEvent(new Event("miroir:chat-updated"));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 0);
  }, [actorType]);

  useEffect(() => {
    if (actorType === "user") {
      getUserMe().then((result) => setUser(result.user)).catch(() => {
        sessionStorage.setItem("miroir_after_login", window.location.pathname);
        setUserToken(""); window.location.href = "/login";
      });
    } else {
      listMyShops().then((result) => setShop(result.shops?.[0] || null)).catch(() => {});
    }
    loadInbox().catch((error) => setNotice(error.response?.data?.message || "Không tải được hộp thư."));
  }, [actorType]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    const stored = sessionStorage.getItem(contextKey(actorType, activeId));
    if (stored) {
      try { setPendingContext(JSON.parse(stored)); } catch { setPendingContext(null); }
    } else setPendingContext(null);
    loadThread(activeId).catch((error) => setNotice(error.response?.data?.message || "Không tải được tin nhắn."));
    const base = actorType === "shop" ? "/shop/messages" : "/app/messages";
    window.history.replaceState({}, "", `${base}/${encodeURIComponent(activeId)}`);
  }, [activeId, actorType, loadThread]);

  useEffect(() => {
    const socket = connectChatSocket(actorType);
    const refresh = () => loadInbox().catch(() => {});
    socket.on("connect", () => { refresh(); if (activeId) loadThread(activeId).catch(() => {}); });
    socket.on("chat:message.created", ({ conversationId, message }) => {
      if (conversationId === activeId) {
        setMessages((current) => {
          const optimistic = current.find((item) => item._optimistic && item.clientMessageId === message.clientMessageId);
          if (optimistic) optimistic._outbox?.previewUrls?.forEach(releasePreview);
          if (current.some((item) => item.id === message.id) && !optimistic) return current;
          return [
            ...current.filter((item) => item.id !== message.id && item.id !== optimistic?.id),
            message,
          ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        markChatRead(actorType, conversationId).catch(() => {});
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }
      refresh();
    });
    socket.on("chat:conversation.updated", refresh);
    socket.on("chat:read", ({ conversationId, readerType, readThroughAt }) => {
      if (conversationId !== activeId) return;
      setConversations((current) => current.map((item) => item.id === conversationId
        ? { ...item, [`${readerType}LastReadAt`]: readThroughAt } : item));
    });
    socket.on("chat:unread.updated", ({ totalUnread }) => window.dispatchEvent(new CustomEvent("miroir:chat-unread", { detail: totalUnread })));
    const foreground = () => { if (document.visibilityState === "visible") { refresh(); if (activeId) loadThread(activeId).catch(() => {}); } };
    document.addEventListener("visibilitychange", foreground);
    return () => { document.removeEventListener("visibilitychange", foreground); socket.disconnect(); };
  }, [actorType, activeId, loadInbox, loadThread]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!lightboxUrl) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setLightboxUrl(""); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightboxUrl]);

  let storedConversation = null;
  try { storedConversation = JSON.parse(sessionStorage.getItem(`${actorType === "shop" ? "miroir_shop" : "miroir"}_chat_conversation_${activeId}`) || "null"); } catch { storedConversation = null; }
  const active = conversations.find((item) => item.id === activeId) || storedConversation;
  const counterpartReadAt = actorType === "user" ? active?.shopLastReadAt : active?.userLastReadAt;

  const deliverInBackground = async (outbox, optimisticId) => {
    setMessages((current) => current.map((message) => message.id === optimisticId ? { ...message, _status: "sending", _error: "" } : message));
    try {
      const result = await sendChatMessage(actorType, outbox.conversationId, {
        text: outbox.text,
        images: outbox.images,
        context: outbox.context,
        clientMessageId: outbox.clientMessageId,
      });
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId && message.id !== result.message.id),
        result.message,
      ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      outbox.previewUrls.forEach(releasePreview);
      loadInbox().catch(() => {});
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không gửi được tin nhắn.";
      setMessages((current) => current.map((message) => message.id === optimisticId ? { ...message, _status: "error", _error: errorMessage } : message));
    }
  };

  const send = (event) => {
    event.preventDefault();
    if (!activeId || (!text.trim() && !images.length && !pendingContext)) return;
    setNotice("");
    const clientMessageId = crypto.randomUUID();
    const optimisticId = `optimistic:${clientMessageId}`;
    const context = pendingContext;
    const outbox = {
      conversationId: activeId,
      text: text.trim(),
      images: images.map((item) => item.file),
      previewUrls: images.map((item) => item.previewUrl),
      context,
      clientMessageId,
    };
    const optimisticContext = context ? (context.type === "order"
      ? { type: "order", orderId: context.id, orderCode: "Đơn hàng đính kèm", itemCount: 0, total: 0, _optimistic: true }
      : { type: "product", productId: context.id, name: "Sản phẩm đính kèm", price: 0, _optimistic: true }) : null;
    const optimisticMessage = {
      id: optimisticId,
      conversationId: activeId,
      senderType: actorType,
      text: text.trim(),
      images: images.map((item) => ({ url: item.previewUrl, local: true })),
      context: optimisticContext,
      clientMessageId,
      createdAt: new Date().toISOString(),
      _optimistic: true,
      _status: "sending",
      _outbox: outbox,
    };
    setMessages((current) => [...current, optimisticMessage]);
    setText("");
    setImages([]);
    setPendingContext(null);
    sessionStorage.removeItem(contextKey(actorType, activeId));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    deliverInBackground(outbox, optimisticId);
  };

  const content = (
    <div className={`mx-auto grid max-w-[1440px] gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8 ${actorType === "user" ? "h-[calc(100dvh-6rem)]" : "h-[calc(100dvh-2rem)]"}`}>
      <aside className={`min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-glass ${activeId ? "hidden lg:flex" : "flex"}`}>
        <div className="border-b border-line p-5">
          {actorType === "user" ? <a href="/app" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink"><span aria-hidden="true">←</span> Quay lại</a> : null}
          <h1 className="text-2xl font-black">Tin nhắn</h1><p className="mt-1 text-sm text-muted">Trao đổi về sản phẩm và đơn hàng.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {conversations.map((item) => <button key={item.id} onClick={() => setActiveId(item.id)} className={`mb-1 flex w-full gap-3 rounded-2xl p-3 text-left ${item.id === activeId ? "bg-accentSoft" : "hover:bg-panel"}`}>
            <Avatar value={item.counterpart} />
            <span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate">{item.counterpart?.name || "Hội thoại"}</strong>{item.unreadCount ? <em className="not-italic rounded-full bg-mintDeep px-2 text-xs font-black text-white">{item.unreadCount}</em> : null}</span><span className="mt-1 block truncate text-sm text-muted">{item.lastMessage?.preview || "Bắt đầu trò chuyện"}</span></span>
          </button>)}
          {!conversations.length ? <p className="p-8 text-center text-sm text-muted">Chưa có cuộc trò chuyện nào.</p> : null}
        </div>
      </aside>
      <section className={`${!activeId ? "hidden lg:flex" : "flex"} min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-glass`}>
        {activeId ? <>
          <header className="flex items-center gap-3 border-b border-line p-4"><button className="rounded-full border border-line px-3 py-2 lg:hidden" onClick={() => setActiveId("")}>←</button><Avatar value={active?.counterpart} /><div><p className="font-black">{active?.counterpart?.name || "Hội thoại"}</p><p className="text-xs text-muted">Tin nhắn được lưu an toàn trên MIROIR</p></div></header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-panel/40 p-4 sm:p-6">
            {nextBefore ? <div className="mb-4 text-center"><Button variant="secondary" onClick={async () => { const result = await listChatMessages(actorType, activeId, { before: nextBefore }); setMessages((current) => [...(result.messages || []), ...current]); setNextBefore(result.nextCursor); }}>Tải tin cũ hơn</Button></div> : null}
            {messages.map((message, index) => <div key={message.id}>{index === 0 || !sameDay(messages[index - 1].createdAt, message.createdAt) ? <p className="my-4 text-center text-xs font-bold text-muted">{new Date(message.createdAt).toLocaleDateString("vi-VN")}</p> : null}<MessageBubble message={message} mine={message.senderType === actorType} actorType={actorType} read={Boolean(message.senderType === actorType && counterpartReadAt && new Date(counterpartReadAt) >= new Date(message.createdAt))} onRetry={() => deliverInBackground(message._outbox, message.id)} onOpenImage={setLightboxUrl} /></div>)}
            <div ref={bottomRef} />
          </div>
          <form className="border-t border-line p-4" onSubmit={send}>
            {pendingContext ? <PendingContext context={pendingContext} onRemove={() => setPendingContext(null)} /> : null}
            {images.length ? <div className="mb-3 flex flex-wrap gap-3">{images.map((item, index) => <div className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-line bg-panel" key={item.previewUrl}><button type="button" className="h-full w-full cursor-zoom-in" aria-label={`Xem ảnh ${index + 1}`} onClick={() => setLightboxUrl(item.previewUrl)}><img className="h-full w-full object-cover" src={item.previewUrl} alt={`Ảnh đã chọn ${index + 1}`} /></button><button type="button" aria-label={`Bỏ ảnh ${index + 1}`} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-sm font-black text-white shadow" onClick={() => removeSelectedImage(index)}>×</button></div>)}</div> : null}
            {notice ? <p className="mb-3 text-sm font-bold text-red-600">{notice}</p> : null}
            <div className="flex items-end gap-2"><label className="cursor-pointer rounded-full border border-line px-4 py-3 font-black">＋<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={chooseImages} /></label><textarea className="miroir-field min-h-12 flex-1 resize-none" maxLength={2000} placeholder="Nhập tin nhắn..." rows="1" value={text} onChange={(event) => setText(event.target.value)} /><Button type="submit">Gửi</Button></div>
          </form>
        </> : <div className="m-auto text-center text-muted">Chọn một cuộc trò chuyện.</div>}
      </section>
    </div>
  );

  const lightbox = lightboxUrl ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xem ảnh" onClick={() => setLightboxUrl("")}><button type="button" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-3xl text-white transition hover:bg-white/25" aria-label="Đóng ảnh" onClick={() => setLightboxUrl("")}>×</button><img className="max-h-[90dvh] max-w-[95vw] rounded-2xl object-contain shadow-2xl" src={lightboxUrl} alt="Ảnh phóng lớn" onClick={(event) => event.stopPropagation()} /></div> : null;

  if (actorType === "user") return <div className="h-dvh overflow-hidden"><AppShell nav={<TopNav user={user} onLogout={() => { setUserToken(""); window.location.href = "/"; }} />}>{content}</AppShell>{lightbox}</div>;
  return <div className="h-dvh overflow-hidden bg-white text-ink"><div className="h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)]"><ShopChatSidebar shop={shop} onLogout={() => { setShopToken(""); window.location.href = "/"; }} /><main className="min-h-0 min-w-0 overflow-hidden bg-panel/40">{content}</main></div>{lightbox}</div>;
}

function ShopChatSidebar({ shop, onLogout }) {
  const links = [
    { href: "/shop/messages", label: "Tin nhắn", active: true },
    { href: "/shop/dashboard?view=products", label: "Sản phẩm" },
    { href: "/shop/dashboard?view=orders", label: "Đơn hàng" },
    { href: "/shop/dashboard?view=analytics", label: "Phân tích" },
    { href: "/shop/dashboard?view=insights", label: "Khách hàng" },
    { href: "/shop/dashboard?view=shop", label: "Hồ sơ shop" },
  ];
  return <aside className="border-b border-line bg-white/90 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line p-5"><a href="/shop/dashboard" className="font-display text-2xl font-extrabold text-rose">MIROIR</a><p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Shop Owner</p></div>
      <div className="p-4"><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Shop hiện tại</p><p className="mt-2 truncate font-bold">{shop?.name || "Đang tải shop..."}</p><p className="mt-1 truncate text-sm text-muted">{shop ? `${shop.slug} / ${shop.status}` : ""}</p></div></div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:grid lg:gap-1 lg:overflow-visible">
        {links.map((item) => <a key={item.href} href={item.href} className={`shrink-0 rounded-lg px-4 py-3 text-sm font-semibold transition ${item.active ? "bg-mintDeep text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{item.label}</a>)}
      </nav>
      <div className="mt-auto border-t border-line p-4"><button type="button" onClick={onLogout} className="w-full rounded-lg bg-tertiarySoft px-4 py-3 text-left text-sm font-semibold text-ink">Đăng xuất</button></div>
    </div>
  </aside>;
}

function Avatar({ value }) { return <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accentSoft font-black text-mintDeep">{value?.logoUrl ? <img className="h-full w-full object-cover" src={value.logoUrl} alt="" /> : (value?.name || "?").slice(0, 1).toUpperCase()}</span>; }

function PendingContext({ context, onRemove }) { return <div className="mb-3 flex items-center justify-between rounded-2xl border border-mintDeep bg-accentSoft p-3"><div><p className="text-xs font-black uppercase text-mintDeep">Đính kèm {context.type === "order" ? "đơn hàng" : "sản phẩm"}</p><p className="text-sm font-bold">Thông tin sẽ được lấy trực tiếp từ hệ thống khi gửi.</p></div><button type="button" onClick={onRemove}>×</button></div>; }

function MessageBubble({ message, mine, actorType, read, onRetry, onOpenImage }) {
  return <div className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}><article className={`max-w-[85%] rounded-3xl p-3 sm:max-w-[68%] ${mine ? "bg-mintDeep text-white" : "border border-line bg-white text-ink"}`}>
    {message.context ? <ContextCard context={message.context} actorType={actorType} mine={mine} /> : null}
    {message.text ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
    {message.images?.length ? <div className="relative mt-2 grid grid-cols-2 gap-2">{message.images.map((item, index) => <button type="button" className="cursor-zoom-in overflow-hidden rounded-2xl" aria-label={`Xem ảnh chat ${index + 1}`} onClick={() => onOpenImage(item.url)} key={item.url}><img className={`max-h-64 w-full rounded-2xl object-cover transition hover:scale-[1.02] ${item.local && message._status === "sending" ? "opacity-70" : ""}`} src={item.url} alt={`Ảnh chat ${index + 1}`} /></button>)}</div> : null}
    {message._status === "error" ? <div className={`mt-2 flex items-center justify-end gap-2 text-xs font-bold ${mine ? "text-white" : "text-red-600"}`}><span>Gửi thất bại</span><button type="button" className={`rounded-full px-3 py-1 ${mine ? "bg-white text-mintDeep" : "bg-red-50 text-red-700"}`} onClick={onRetry}>Thử lại</button></div> : <p className={`mt-2 text-right text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>{new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}{message._status === "sending" ? " · Đang gửi..." : read ? " · Đã đọc" : ""}</p>}
  </article></div>;
}

function ContextCard({ context, actorType, mine }) {
  const href = context.type === "product"
    ? (actorType === "shop" ? `/shop/products/${encodeURIComponent(context.productId)}` : `/app/products/${encodeURIComponent(context.productId)}`)
    : (actorType === "shop" ? `/shop/dashboard?orderId=${encodeURIComponent(context.orderId)}` : `/app/orders/${encodeURIComponent(context.orderId)}`);
  const content = <>{context.imageUrl ? <img className="h-14 w-14 rounded-xl object-cover" src={context.imageUrl} alt="" /> : null}<span><strong className="block">{context.type === "product" ? context.name : context.orderCode}</strong><span className={`text-xs ${mine ? "text-white/75" : "text-muted"}`}>{context._optimistic ? "Đang đính kèm..." : context.type === "product" ? formatMoney(context.price) : `${context.itemCount} sản phẩm · ${formatMoney(context.total)}`}</span></span></>;
  const className = `mb-2 flex gap-3 rounded-2xl p-3 ${mine ? "bg-white/15" : "bg-panel"}`;
  return context._optimistic ? <div className={className}>{content}</div> : <a href={href} className={className}>{content}</a>;
}
