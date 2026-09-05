import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Headphones,
  CheckCheck,
  Lock,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Globe,
  CreditCard,
  Repeat,
  Radio,
} from 'lucide-react';

export const AiSupportPage: React.FC = () => {
  const { aiChatMessages, sendAiChatMessage, refreshData, user, language } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages]);

  // Polling định kỳ cập nhật tin nhắn mới từ Admin
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSending) return;

    if (!customText) setInputMessage('');
    setIsSending(true);
    try {
      await sendAiChatMessage(textToSend);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const quickTopics = [
    { label: 'Hỗ trợ trỏ DNS tên miền', icon: Globe, query: 'Chào admin, nhờ kiểm tra và hỗ trợ trỏ DNS tên miền riêng cho panel của mình.' },
    { label: 'Kiểm tra giao dịch nạp tiền', icon: CreditCard, query: 'Chào admin, nhờ kiểm tra giúp mình giao dịch nạp tiền vào tài khoản ví.' },
    { label: 'Gia hạn gói dịch vụ', icon: Repeat, query: 'Chào admin, mình cần tư vấn và gia hạn gói panel đang sử dụng.' },
    { label: 'Kết nối API nhà cung cấp', icon: Radio, query: 'Chào admin, nhờ hỗ trợ kiểm tra kết nối API với nhà cung cấp.' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Khung Chat Hỗ Trợ Khách Hàng Cao Cấp */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-130px)] min-h-[600px]">
        {/* Chat Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  {language === 'vi' ? 'Trung tâm hỗ trợ khách hàng' : 'Customer support center'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {language === 'vi' ? 'Trực tuyến 24/7' : 'Online 24/7'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                <span>{language === 'vi' ? 'Kênh giải đáp kỹ thuật & hỗ trợ dịch vụ trực tiếp' : 'Direct technical assistance and customer service'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === 'vi' ? 'Phản hồi nhanh' : 'Fast response'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
              title={language === 'vi' ? 'Làm mới tin nhắn' : 'Refresh messages'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Khung Hiển Thị Tin Nhắn */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
          {/* Welcome Banner */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 text-center space-y-1.5 shadow-2xs">
            <div className="w-9 h-9 mx-auto rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              {language === 'vi' ? `Xin chào ${user?.name || ''}, bạn cần hỗ trợ gì hôm nay?` : `Welcome ${user?.name || ''}, how can we help?`}
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {language === 'vi'
                ? 'Đội ngũ chuyên viên kỹ thuật luôn sẵn sàng tiếp nhận và giải quyết mọi yêu cầu về vận hành panel, nạp tiền và cấu hình hệ thống.'
                : 'Our technical support team is ready 24/7 to resolve inquiries regarding panels, billing, and DNS setup.'}
            </p>
          </div>

          {/* Danh Sách Tin Nhắn */}
          {aiChatMessages.map((msg) => {
            const isUser = msg.sender === 'user' || msg.senderRole === 'customer';
            const isAdmin = msg.sender === 'admin' || msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>

                {/* Nội Dung Tin Nhắn */}
                <div className="space-y-1 max-w-full">
                  <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 px-1 ${isUser ? 'justify-end' : ''}`}>
                    {isAdmin ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {msg.senderName || (language === 'vi' ? 'Hỗ trợ viên chính thức' : 'Official support agent')}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-600">{language === 'vi' ? 'Bạn' : 'You'}</span>
                    )}
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-blue-500/10 font-normal'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs font-normal'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {isUser && (
                      <div className="flex items-center justify-end gap-1 text-[9px] text-blue-100 mt-1 opacity-80">
                        <CheckCheck className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đã gửi' : 'Sent'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Gợi Ý Chủ Đề Nhanh */}
        <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
            {language === 'vi' ? 'Chủ đề nhanh:' : 'Quick topics:'}
          </span>
          {quickTopics.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(topic.query)}
                className="px-3 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-600 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Icon className="w-3 h-3 text-blue-600" />
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Khung Nhập Tin Nhắn */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3.5 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={language === 'vi' ? 'Nhập nội dung cần hỗ trợ (nhấn Enter để gửi)...' : 'Type your inquiry here (press Enter to send)...'}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') : (language === 'vi' ? 'Gửi tin nhắn' : 'Send message')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
