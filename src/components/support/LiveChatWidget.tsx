import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  Zap,
  Minimize2,
  RefreshCw,
  HelpCircle,
  CreditCard,
  Globe,
  PackageCheck,
} from 'lucide-react';

export const LiveChatWidget: React.FC = () => {
  const { siteConfig, user, language, aiChatMessages, sendAiChatMessage, formatMoney } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEnabled = siteConfig?.enableLiveChatWidget !== false;

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, aiChatMessages, isTyping]);

  if (!isEnabled) return null;

  const handleSend = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isTyping) return;

    setInputText('');
    setIsTyping(true);
    try {
      await sendAiChatMessage(message);
    } finally {
      setIsTyping(false);
    }
  };

  const QUICK_QUESTIONS = [
    {
      icon: CreditCard,
      label: language === 'vi' ? 'Cách nạp VietQR' : 'VietQR Deposit Guide',
      prompt: language === 'vi' ? 'Hướng dẫn nạp tiền tự động qua VietQR' : 'How to deposit funds via VietQR auto banking?',
    },
    {
      icon: Globe,
      label: language === 'vi' ? 'Trỏ Nameserver' : 'DNS & Nameserver Setup',
      prompt: language === 'vi' ? 'Làm sao để trỏ Nameservers cho Panel riêng của tôi?' : 'How do I point my custom domain nameservers to NexusSMM?',
    },
    {
      icon: PackageCheck,
      label: language === 'vi' ? 'Dùng thử 7 ngày' : '7-Day Free Trial',
      prompt: language === 'vi' ? 'Gói dùng thử 7 ngày miễn phí bao gồm những tính năng gì?' : 'What is included in the 7-day free trial?',
    },
    {
      icon: Zap,
      label: language === 'vi' ? 'Kết nối API SMM' : 'Provider API Sync',
      prompt: language === 'vi' ? 'Cách kết nối và đồng bộ API nhà cung cấp SMM' : 'How to connect and sync upstream SMM provider APIs?',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* OPENED CHAT MODAL */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 backdrop-blur-xs">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-indigo-700 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 leading-tight">
                  <h3 className="font-extrabold text-sm text-white">Nexus AI Support</h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider">
                    24/7
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>{language === 'vi' ? 'Trực tuyến sẵn sàng hỗ trợ' : 'Online & ready to help'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
            {aiChatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 font-mono ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2.5 text-slate-500 text-xs">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl text-slate-600 text-xs shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium text-slate-500 ml-1">
                    {language === 'vi' ? 'AI đang soạn phản hồi...' : 'AI is typing...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_QUESTIONS.map((q, idx) => {
              const Icon = q.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-[11px] font-semibold text-slate-700 hover:text-blue-700 shrink-0 transition-colors cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-blue-600" />
                  <span>{q.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'vi' ? 'Hỏi trợ lý AI 24/7...' : 'Ask AI Operations Assistant...'}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
          boxShadow: '0 8px 25px -4px var(--brand-shadow)'
        }}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-bold text-xs shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white"
        aria-label="Toggle Live Chat Widget"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-600 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-600" />
        </div>
        <span className="hidden sm:inline font-bold">
          {isOpen ? (language === 'vi' ? 'Thu nhỏ chat' : 'Minimize Chat') : (language === 'vi' ? 'Hỗ trợ AI 24/7' : 'AI Live Support')}
        </span>
      </button>
    </div>
  );
};

