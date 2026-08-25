import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { AiAutomationConfig } from '../../../types';
import {
  Save,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Zap,
  MessageSquareCode,
  Settings
} from 'lucide-react';

export const AdminAiConfigView: React.FC = () => {
  const { language, addToast } = useApp();
  const [config, setConfig] = useState<AiAutomationConfig>({
    geminiModel: 'gemini-2.5-flash',
    systemPrompt: 'You are the Nexus SMM Master Operations Assistant. You diagnose DNS records, suggest pricing margins, analyze order failovers, and assist agency owners.',
    autoTicketReplyEnabled: true,
    autoDnsDiagnostic: true,
    autoMarginOptimizer: true,
    maxDailyAiTokens: 500000,
    temperature: 0.7,
  });
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/ai-config');
      const data = await res.json();
      if (data?.data) {
        setConfig(data.data);
      }
    } catch (e) {
      console.error('Failed to load automation config:', e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Cập nhật cấu hình tự động hóa thành công!' : 'Automation settings saved successfully!'));
      }
    } catch {
      addToast('error', language === 'vi' ? 'Lỗi khi lưu cấu hình' : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Cấu Hình Tự Động Hóa & Trợ Lý Vận Hành' : 'Automated Rules & Operations Engine'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Tùy chỉnh công cụ phân tích tự động, chỉ dẫn kịch bản hỗ trợ, tự động chẩn đoán DNS và đề xuất biên lợi nhuận (margin).'
              : 'Configure background automated diagnostics, support response rules, DNS routing checks, and profit margin suggestions.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          <span>{saving ? (language === 'vi' ? 'Đang Lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Cấu Hình' : 'Save Settings')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt & Engine */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>{language === 'vi' ? 'Động Cơ Vận Hành & Tham Số' : 'Engine & Operational Parameters'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{language === 'vi' ? 'Động Cơ Xử Lý Mặc Định' : 'Default Processing Engine'}</label>
                <select
                  value={config.geminiModel}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono font-medium transition-colors"
                >
                  <option value="gemini-2.5-flash">{language === 'vi' ? 'Engine v2.5 Flash (Tốc độ cao & Tối ưu tải)' : 'Engine v2.5 Flash (High speed & Low latency)'}</option>
                  <option value="gemini-2.5-pro">{language === 'vi' ? 'Engine v2.5 Pro (Phân tích chuyên sâu & DNS phức tạp)' : 'Engine v2.5 Pro (Deep diagnostics & Complex DNS)'}</option>
                  <option value="gemini-2.0-flash">{language === 'vi' ? 'Engine v2.0 Standard (Tiêu chuẩn)' : 'Engine v2.0 Standard'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'vi' ? `Hệ Số Phản Hồi (${config.temperature})` : `Response Parameter (${config.temperature})`}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer mt-2 accent-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquareCode className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'vi' ? 'Chỉ Dẫn Kịch Bản Hỗ Trợ & Vận Hành' : 'System Operations & Support Instructions'}</span>
              </label>
              <textarea
                rows={5}
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono leading-relaxed focus:outline-hidden focus:border-blue-500 transition-colors"
                placeholder={language === 'vi' ? 'Nhập chỉ dẫn định hướng kịch bản hỗ trợ...' : 'Enter system instructions...'}
              />
              <p className="text-[11px] text-slate-500">
                {language === 'vi'
                  ? 'Chỉ dẫn này áp dụng trực tiếp cho khung chẩn đoán hỗ trợ kỹ thuật và phân tích vận hành panel.'
                  : 'These instructions apply directly to the technical diagnostic assistant and panel analytics.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Automation Toggles */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{language === 'vi' ? 'Kích Hoạt Tự Động Hóa' : 'Automation Rules'}</span>
            </h2>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{language === 'vi' ? 'Tự Động Phản Hồi Ticket' : 'Auto Ticket Triage'}</p>
                  <p className="text-[11px] text-slate-500">{language === 'vi' ? 'Hệ thống tự động tiếp nhận & xử lý ticket trong 5 giây' : 'Automatically triage and reply to client requests'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoTicketReplyEnabled: !config.autoTicketReplyEnabled })}
                  className="cursor-pointer"
                >
                  {config.autoTicketReplyEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{language === 'vi' ? 'Chẩn Đoán DNS Tự Động' : 'Automated DNS Check'}</p>
                  <p className="text-[11px] text-slate-500">{language === 'vi' ? 'Tự phát hiện lỗi trỏ IP Cloudflare / A-Record' : 'Detect domain IP routing and SSL errors'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoDnsDiagnostic: !config.autoDnsDiagnostic })}
                  className="cursor-pointer"
                >
                  {config.autoDnsDiagnostic ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{language === 'vi' ? 'Tối Ưu Margin Tự Động' : 'Smart Margin Adjuster'}</p>
                  <p className="text-[11px] text-slate-500">{language === 'vi' ? 'Gợi ý tăng/giảm giá khi giá nhà cung cấp gốc thay đổi' : 'Suggest price adjustment when provider rates change'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoMarginOptimizer: !config.autoMarginOptimizer })}
                  className="cursor-pointer"
                >
                  {config.autoMarginOptimizer ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

