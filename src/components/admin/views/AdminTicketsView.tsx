import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Send,
  User,
  ShieldCheck,
  Bot,
} from 'lucide-react';

export const AdminTicketsView: React.FC = () => {
  const { language, addToast } = useApp();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets?all=true&_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTickets(data.data);
        setSelectedTicket((prev: any) => {
          if (!prev) return data.data[0] || null;
          const found = data.data.find((t: any) => t.id === prev.id);
          return found || data.data[0] || null;
        });
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.id.toLowerCase().includes(q) ||
      (t.userName && t.userName.toLowerCase().includes(q)) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText.trim(),
          senderRole: 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        addToast('success', language === 'vi' ? 'Đã gửi phản hồi tới người dùng.' : 'Reply sent to user.');
        await loadTickets();
      } else {
        addToast('error', data.message || 'Failed to send reply');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[calc(100vh-140px)] min-h-[600px] flex flex-col animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">
              {language === 'vi' ? 'Hỗ trợ & trả lời người dùng' : 'Customer support & replies'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {language === 'vi'
                ? 'Xem tin nhắn và phản hồi trực tiếp cho người dùng'
                : 'Directly view and reply to users'}
            </p>
          </div>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title={language === 'vi' ? 'Làm mới danh sách' : 'Refresh'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Main Split Layout: Left User List / Right Chat & Reply */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Cột trái: Danh sách hội thoại người dùng (4 Cols) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60 overflow-hidden">
          {/* Ô tìm kiếm */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm theo tên, email...' : 'Search users...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Danh sách người dùng */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {language === 'vi' ? 'Không có tin nhắn nào.' : 'No messages found.'}
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const lastMsg = ticket.messages?.[ticket.messages.length - 1];

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-blue-600'
                        : 'hover:bg-slate-100/70 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {ticket.userName || `User #${ticket.userId}`}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(ticket.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.content}` : ticket.subject}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải: Xem hội thoại & Khung Reply (8 Cols) */}
        <div className="md:col-span-8 flex flex-col bg-white overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header của cuộc hội thoại */}
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {selectedTicket.userName} <span className="text-slate-400 font-normal">({selectedTicket.userEmail || `#${selectedTicket.userId}`})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    {selectedTicket.subject}
                  </p>
                </div>
              </div>

              {/* Lịch sử tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30">
                {selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isAdmin = msg.senderRole === 'admin';
                  const isAi = msg.senderRole === 'ai' || msg.isAiGenerated;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        {isAi ? (
                          <span className="font-bold text-purple-600 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Nexus AI Copilot
                          </span>
                        ) : isAdmin ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {msg.senderName} (Admin)
                          </span>
                        ) : (
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3" /> {msg.senderName}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                          isAi
                            ? 'bg-purple-50/80 border border-purple-200 text-purple-950 rounded-tl-xs'
                            : isAdmin
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Khung Reply người dùng */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập câu trả lời gửi cho người dùng...' : 'Reply to user...'}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') : (language === 'vi' ? 'Gửi' : 'Send')}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                {language === 'vi' ? 'Chọn một người dùng bên trái để trả lời' : 'Select a user to reply'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
