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
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { PageHeader } from '../../ui/PageHeader';

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
    <div className="space-y-6">
      {/* 1. Page Header with Open-Design Standards */}
      <PageHeader
        title={language === 'vi' ? 'Hỗ Trợ & Trả Lời Khách Hàng' : 'Support Desk & User Tickets'}
        description={
          language === 'vi'
            ? 'Theo dõi luồng tin nhắn trực tiếp, phản hồi thắc mắc và kiểm soát can thiệp Nexus AI Copilot.'
            : 'Supervise incoming support inquiries, real-time ticket escalation, and AI Copilot co-pilot intervention.'
        }
        badge={
          <Badge variant="blue" pulse>
            {tickets.length} {language === 'vi' ? 'Cuộc hội thoại' : 'Threads'}
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadTickets}
            disabled={loading}
            title={language === 'vi' ? 'Làm mới danh sách' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{language === 'vi' ? 'Làm mới' : 'Sync'}</span>
          </Button>
        }
      />

      {/* 2. Main Ticket Console inside Mac Window Chrome Card */}
      <Card
        macChrome={true}
        macTitle="DESK_OPERATIONS // LIVE_TICKETS"
        macBadge={
          <Badge variant="emerald" pulse>
            AGENT CONNECTED
          </Badge>
        }
        className="h-[calc(100vh-230px)] min-h-[640px] flex flex-col p-0"
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full">
          {/* Cột trái: Danh sách hội thoại người dùng (4 Cols) */}
          <div className="md:col-span-4 border-r border-slate-200/80 flex flex-col bg-slate-50/50 overflow-hidden">
            {/* Ô tìm kiếm */}
            <div className="p-3.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={language === 'vi' ? 'Tìm theo tên, email, tiêu đề...' : 'Search threads...'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-full focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                      className={`p-4 transition-all cursor-pointer border-l-4 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-blue-600'
                          : 'hover:bg-slate-100/60 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {ticket.userName ? ticket.userName.slice(0, 1).toUpperCase() : 'U'}
                          </div>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {ticket.userName || `User #${ticket.userId}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono tabular-nums">
                          {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 pl-8">
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
                <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{selectedTicket.userName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({selectedTicket.userEmail || `#${selectedTicket.userId}`})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <Badge variant="blue" size="sm">
                    Ticket #{selectedTicket.id.slice(-6)}
                  </Badge>
                </div>

                {/* Lịch sử tin nhắn */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/20">
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
                            <Badge variant="purple" size="sm">
                              <Bot className="w-3 h-3 mr-1" />
                              Nexus AI Copilot
                            </Badge>
                          ) : isAdmin ? (
                            <Badge variant="emerald" size="sm">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {msg.senderName} (Admin)
                            </Badge>
                          ) : (
                            <Badge variant="slate" size="sm">
                              <User className="w-3 h-3 mr-1" />
                              {msg.senderName}
                            </Badge>
                          )}
                          <span>&bull;</span>
                          <span className="font-mono tabular-nums">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                            isAi
                              ? 'bg-purple-50/90 border border-purple-200/80 text-purple-950 rounded-tl-xs'
                              : isAdmin
                              ? 'bg-slate-950 text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
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
                <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-200/80 bg-white">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập câu trả lời gửi cho khách hàng...' : 'Reply to customer...'}
                      className="flex-1 px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-full text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sendingReply || !replyText.trim()}
                      loading={sendingReply}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>{language === 'vi' ? 'Gửi' : 'Send'}</span>
                    </Button>
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
      </Card>
    </div>
  );
};
