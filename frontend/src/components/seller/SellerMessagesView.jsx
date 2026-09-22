import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Image as ImageIcon,
  CheckCheck,
  User,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  X,
} from "lucide-react";
import { NeuCard, NeuSearch, NeuButton, NeuBadge } from "./NeuComponents.jsx";
import { listChatConversations, listChatMessages, sendChatMessage, markChatRead } from "../../api/chatApi.js";
import { connectChatSocket } from "../../api/chatSocket.js";

const CANNED_REPLIES = [
  "Chào bạn! Cửa hàng có thể hỗ trợ gì cho bạn hôm nay?",
  "Dạ sản phẩm này hiện vẫn còn sẵn đủ size và màu bạn nhé.",
  "Shop đã ghi nhận đơn hàng và đang tiến hành đóng gói ạ.",
  "Bạn vui lòng cho shop xin số đo để shop tư vấn size chuẩn nhất nhé!",
];

const getCustomer = (conversation) =>
  conversation?.counterpart || conversation?.customer || conversation?.participant || null;

const getCustomerName = (conversation) =>
  getCustomer(conversation)?.name || "Khách hàng";

const getLastMessagePreview = (conversation) =>
  conversation?.lastMessage?.preview || conversation?.lastMessage?.text || "Chưa có tin nhắn";

export default function SellerMessagesView({ shop, onNavigateOrder }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeConvo = conversations.find((c) => c.id === activeId);

  const loadInbox = async () => {
    try {
      const res = await listChatConversations("shop");
      const list = res.conversations || [];
      setConversations(list);
      if (!activeId && list[0]) {
        setActiveId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadThread = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await listChatMessages("shop", id);
      setMessages(res.messages || []);
      await markChatRead("shop", id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Failed to load thread:", err);
    } finally {
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId]);

  useEffect(() => {
    const socket = connectChatSocket("shop");
    socket.on("chat:message.created", ({ conversationId, message }) => {
      if (conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      loadInbox();
    });
    return () => socket.disconnect();
  }, [activeId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeId) return;
    const textToSend = inputText.trim();
    setInputText("");

    try {
      const res = await sendChatMessage("shop", activeId, {
        text: textToSend,
        clientMessageId: crypto.randomUUID(),
      });
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      loadInbox();
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = getCustomerName(c);
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesUnread = filterUnread ? (c.unreadCount || 0) > 0 : true;
    return matchesSearch && matchesUnread;
  });

  return (
    <div className="neu-card p-0 overflow-hidden h-[calc(100vh-140px)] min-h-[600px] flex flex-col lg:flex-row animate-in fade-in duration-300">
      {/* 1. Left Conversation List */}
      <div className="w-full lg:w-80 xl:w-96 border-r border-[#E2EBD5] flex flex-col bg-[#F9FAF4] shrink-0">
        <div className="p-4 border-b border-[#E2EBD5] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#1F2A2A]">Tin nhắn</h3>
            <button
              type="button"
              onClick={() => setFilterUnread(!filterUnread)}
              className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                filterUnread
                  ? "bg-[#6F8746] text-white shadow-sm"
                  : "neu-inset text-[#6E7D7C] hover:text-[#1F2A2A]"
              }`}
            >
              Chưa đọc
            </button>
          </div>

          <NeuSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Tìm tên khách hàng..."
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#96A5A4]">
              {search ? "Không tìm thấy cuộc trò chuyện." : "Chưa có tin nhắn nào."}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId;
              const customerName = getCustomerName(c);
              const lastMsg = getLastMessagePreview(c);

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 ${
                    isActive
                      ? "neu-btn-raised bg-white border border-[#B3D07E] shadow-md"
                      : "hover:bg-white/80"
                  }`}
                >
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#B3D07E]/30 to-[#68A7FF]/30 border border-[#B3D07E]/50 flex items-center justify-center font-bold text-sm text-[#6F8746] shrink-0 shadow-sm">
                    {customerName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-[#1F2A2A] truncate">
                        {customerName}
                      </p>
                      <span className="text-[10px] text-[#96A5A4] shrink-0">
                        {c.lastMessage?.createdAt
                          ? new Date(c.lastMessage.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E7D7C] truncate mt-0.5">
                      {lastMsg}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#FF8F8F] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Chat Thread */}
      <div className="flex-1 flex flex-col bg-[#F9FAF4] min-w-0">
        {activeConvo ? (
          <>
            {/* Thread Header */}
            <div className="p-4 px-6 border-b border-[#E2EBD5] bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#B3D07E]/40 to-[#6F8746]/30 border border-[#B3D07E]/60 flex items-center justify-center font-bold text-sm text-[#6F8746] shadow-sm">
                  {getCustomerName(activeConvo).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#1F2A2A]">
                    {getCustomerName(activeConvo)}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-[#7EDC9A] shadow-sm" />
                    <span className="text-[11px] text-[#6E7D7C]">Trực tuyến · Sẵn sàng hỗ trợ</span>
                  </div>
                </div>
              </div>

              {activeConvo.context?.orderId && (
                <button
                  type="button"
                  onClick={() => onNavigateOrder && onNavigateOrder(activeConvo.context.orderId)}
                  className="neu-btn-raised text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-[#6F8746]"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-[#68A7FF]" />
                  Đơn hàng liên quan
                </button>
              )}
            </div>

            {/* Message Bubble List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="text-center p-8 text-xs text-[#96A5A4]">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#96A5A4]">
                  Chưa có tin nhắn trong cuộc trò chuyện này. Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                messages.map((m) => {
                  const isShop = m.senderType === "shop" || m.sender?.role === "shop";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isShop ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isShop
                            ? "bg-gradient-to-r from-[#B3D07E] to-[#6F8746] text-white shadow-md rounded-tr-none"
                            : "neu-card text-[#1F2A2A] shadow-sm rounded-tl-none border border-[#E2EBD5]"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-[#96A5A4] mt-1 px-1">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Canned Replies Shortcuts */}
            <div className="px-4 py-2 bg-white/60 border-t border-[#E2EBD5] flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-[#96A5A4] shrink-0">Gợi ý nhanh:</span>
              {CANNED_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(reply)}
                  className="neu-inset text-[11px] px-3 py-1 rounded-full text-[#6E7D7C] hover:text-[#1F2A2A] whitespace-nowrap transition hover:bg-white"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-[#E2EBD5] flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập nội dung phản hồi khách hàng..."
                className="neu-input flex-1 px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="neu-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs"
              >
                <Send className="h-4 w-4" />
                <span>Gửi</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#96A5A4]">
            <MessageCircle className="h-12 w-12 text-[#B3D07E] mb-3 opacity-60" />
            <p className="text-sm font-bold text-[#1F2A2A]">Chọn một cuộc hội thoại</p>
            <p className="text-xs text-[#96A5A4] mt-1">
              Nhấp vào tin nhắn bên trái để bắt đầu hỗ trợ khách hàng
            </p>
          </div>
        )}
      </div>

      {/* 3. Right Customer Context Side Panel (Desktop only) */}
      {activeConvo && (
        <div className="hidden xl:flex w-72 border-l border-[#E2EBD5] bg-[#F9FAF4] flex-col p-5 space-y-5 shrink-0">
          <div className="space-y-3">
            <h5 className="font-bold text-xs text-[#1F241D]">Hồ sơ phong cách (Fit & Style)</h5>
            <div className="neu-inset p-3 rounded-xl text-xs space-y-1.5 text-[#6E756B]">
              <div className="flex justify-between">
                <span>Dáng người:</span>
                <span className="font-bold text-[#1F241D]">Quả lê (Pear)</span>
              </div>
              <div className="flex justify-between">
                <span>Tone da:</span>
                <span className="font-bold text-[#1F241D]">Ấm (Warm)</span>
              </div>
              <div className="flex justify-between">
                <span>Phong cách:</span>
                <span className="font-bold text-[#6F8746]">Công sở / Hiện đại</span>
              </div>
            </div>
          </div>

          <div className="neu-inset p-3.5 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#6E756B]">Mẹo chốt đơn</span>
            <p className="text-xs text-[#1F241D] leading-relaxed">
              Khách hàng này rất chuộng dáng quần ống suông và tone màu Be/Trắng. Bạn có thể gợi ý các mẫu blazer kết hợp cùng nhé!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
