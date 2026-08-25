import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Send,
  Sparkles,
  Ticket,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  User,
  Zap,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SupportTicket } from '../../types';

export const AiSupportPage: React.FC = () => {
  const {
    aiChatMessages,
    sendAiChatMessage,
    tickets,
    createSupportTicket,
    user,
    addToast,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ai' | 'tickets'>('ai');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'Order Issue' | 'Provider API' | 'Billing' | 'DNS / Domain' | 'Other'>('Order Issue');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [ticketMessage, setTicketMessage] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages]);

  const quickPrompts = [
    'How do I point my custom domain DNS?',
    'Troubleshoot Provider #14 latency issue',
    'Recommend optimal profit margins for Instagram & TikTok',
    'How does auto-refill work on dropped followers?',
  ];

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim()) return;

    setInputMessage('');
    setIsSending(true);
    try {
      await sendAiChatMessage(textToSend);
    } catch (e) {
      // Handled in context
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      addToast('error', 'Please fill out all ticket fields.');
      return;
    }

    createSupportTicket(ticketSubject, ticketCategory, ticketPriority, ticketMessage);
    setNewTicketModal(false);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{t('support.title')}</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" />
              Auto Diagnostics v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t('support.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('support.tabAiChat')}</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tickets' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>{t('support.tabTickets')} ({tickets.length})</span>
            </button>
          </div>

          <button
            onClick={() => setNewTicketModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('support.openNewTicket')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI ASSISTANT CHAT */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Chat header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Nexus SMM Diagnostic Assistant</p>
                <p className="text-[10px] text-emerald-400 font-mono">Status: Diagnostic Engine Online (12ms)</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block">Instant 24/7 Diagnostics</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {aiChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-900 text-white shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <span
                    className={`block text-[10px] mt-2 font-mono ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-indigo-900 text-white flex items-center justify-center text-xs shrink-0">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>System is analyzing your request...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-semibold text-slate-500 shrink-0">Suggested:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about DNS setup, orders, margins, or provider troubleshooting..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Support Tickets</h3>
              <p className="text-xs text-slate-500">Track and respond to open technical queries</p>
            </div>
            <button
              onClick={() => setNewTicketModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              + Open Ticket
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{t.subject}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'open'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Category: {t.category} • Priority: {t.priority.toUpperCase()} • Created: {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW TICKET MODAL */}
      {newTicketModal && (
        <Modal
          isOpen={true}
          onClose={() => setNewTicketModal(false)}
          title="Open New Support Ticket"
          subtitle="Our technical support team 24/7"
        >
          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Orders stalled on FastSMMApi #14"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                >
                  <option value="Order Issue">Order Issue</option>
                  <option value="Provider API">Provider API</option>
                  <option value="Billing">Billing</option>
                  <option value="DNS / Domain">DNS / Domain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
              <textarea
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Please describe the issue, panel domain, order IDs, or error messages..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewTicketModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* TICKET DETAILS MODAL */}
      {selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket #${selectedTicket.id}: ${selectedTicket.subject}`}
          subtitle={`Category: ${selectedTicket.category} • Priority: ${selectedTicket.priority}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-semibold text-slate-900">Original Inquiry:</p>
              <p className="text-slate-700 leading-relaxed">{selectedTicket.message}</p>
              <span className="block text-[10px] text-slate-400 font-mono">
                Opened on {new Date(selectedTicket.createdAt).toLocaleString()}
              </span>
            </div>

            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="font-bold text-slate-900">Responses:</p>
                {selectedTicket.replies.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>{r.author} ({r.role})</span>
                      <span className="text-[10px] text-blue-600">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
