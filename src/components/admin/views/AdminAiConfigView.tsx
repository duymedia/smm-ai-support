import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { AiAutomationConfig } from '../../../types';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';
import {
  Save,
  Cpu,
  Zap,
  MessageSquareCode,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Gauge
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

  const activeRulesCount = [
    config.autoTicketReplyEnabled,
    config.autoDnsDiagnostic,
    config.autoMarginOptimizer,
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={language === 'vi' ? 'Cấu Hình Tự Động Hóa & Trợ Lý Vận Hành' : 'Automated Rules & Operations Engine'}
        description={
          language === 'vi'
            ? 'Tùy chỉnh công cụ phân tích tự động, chỉ dẫn kịch bản hỗ trợ, tự động chẩn đoán DNS và đề xuất biên lợi nhuận (margin).'
            : 'Configure background automated diagnostics, support response rules, DNS routing checks, and profit margin suggestions.'
        }
        badge={
          <Badge variant="brand" pulse>
            {config.geminiModel}
          </Badge>
        }
        actions={
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? (language === 'vi' ? 'Đang Lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Cấu Hình' : 'Save Settings')}
          </Button>
        }
      />

      {/* 4 StatCards Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'ĐỘNG CƠ AI' : 'NEURAL ENGINE'}
          value={config.geminiModel.replace('gemini-', '')}
          subtitle={language === 'vi' ? 'Mô hình suy luận thời gian thực' : 'Real-time inference model'}
          icon={<Cpu className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'HỆ SỐ NHIỆT ĐỘ' : 'TEMPERATURE'}
          value={config.temperature.toFixed(1)}
          subtitle={language === 'vi' ? 'Độ sáng tạo câu trả lời' : 'Response creativity index'}
          icon={<Sliders className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'GIỚI HẠN TOKEN/NGÀY' : 'DAILY TOKEN CAP'}
          value={(config.maxDailyAiTokens || 500000).toLocaleString()}
          subtitle={language === 'vi' ? 'Hạn mức token an toàn' : 'Daily safety token quota'}
          icon={<Gauge className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'QUY TẮC TỰ ĐỘNG' : 'ACTIVE RULES'}
          value={`${activeRulesCount} / 3`}
          subtitle={language === 'vi' ? 'Bộ quy tắc kích hoạt nền' : 'Background automated rules'}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
          highlight={activeRulesCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt & Engine Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            macChrome
            macTitle="AI_ENGINE // RUNTIME & PARAMETERS"
            macBadge={<Badge variant="purple" size="sm">Neural v2.5</Badge>}
            className="p-6 space-y-5"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                {language === 'vi' ? 'Động Cơ Vận Hành & Tham Số' : 'Engine & Operational Parameters'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {language === 'vi' ? 'Động Cơ Xử Lý Mặc Định' : 'Default Processing Engine'}
                </label>
                <select
                  value={config.geminiModel}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring font-mono font-medium transition-colors"
                >
                  <option value="gemini-2.5-flash">
                    {language === 'vi' ? 'Engine v2.5 Flash (Tốc độ cao & Tối ưu tải)' : 'Engine v2.5 Flash (High speed & Low latency)'}
                  </option>
                  <option value="gemini-2.5-pro">
                    {language === 'vi' ? 'Engine v2.5 Pro (Phân tích chuyên sâu & DNS phức tạp)' : 'Engine v2.5 Pro (Deep diagnostics & Complex DNS)'}
                  </option>
                  <option value="gemini-2.0-flash">
                    {language === 'vi' ? 'Engine v2.0 Standard (Tiêu chuẩn)' : 'Engine v2.0 Standard'}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    {language === 'vi' ? 'Hệ Số Phản Hồi (Temperature)' : 'Temperature Index'}
                  </label>
                  <span className="font-mono tabular-nums text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {config.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer mt-3 accent-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MessageSquareCode className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'vi' ? 'Chỉ Dẫn Kịch Bản Hỗ Trợ & Vận Hành' : 'System Operations & Support Instructions'}
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {config.systemPrompt.length} ký tự
                </span>
              </div>
              <textarea
                rows={6}
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono leading-relaxed focus-ring transition-colors"
                placeholder={language === 'vi' ? 'Nhập chỉ dẫn định hướng kịch bản hỗ trợ...' : 'Enter system instructions...'}
              />
              <p className="text-[11px] text-slate-500">
                {language === 'vi'
                  ? 'Chỉ dẫn này áp dụng trực tiếp cho khung chẩn đoán hỗ trợ kỹ thuật và phân tích vận hành panel.'
                  : 'These instructions apply directly to the technical diagnostic assistant and panel analytics.'}
              </p>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Automation Toggles & Telemetry */}
        <div className="space-y-6">
          <Card
            macChrome
            macTitle="RULE_ENGINE // AUTOMATION TRIPPERS"
            macBadge={<Badge variant="amber" size="sm">3 Rules</Badge>}
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                {language === 'vi' ? 'Kích Hoạt Tự Động Hóa' : 'Automation Rules'}
              </h2>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {language === 'vi' ? 'Tự Động Phản Hồi Ticket' : 'Auto Ticket Triage'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Hệ thống tự động tiếp nhận & xử lý ticket trong 5s' : 'Automatically triage and reply to requests'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoTicketReplyEnabled: !config.autoTicketReplyEnabled })}
                  className="cursor-pointer focus-ring rounded-full"
                >
                  {config.autoTicketReplyEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-300" />
                  )}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {language === 'vi' ? 'Chẩn Đoán DNS Tự Động' : 'Automated DNS Check'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Tự phát hiện lỗi trỏ IP Cloudflare / A-Record' : 'Detect domain IP routing and SSL errors'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoDnsDiagnostic: !config.autoDnsDiagnostic })}
                  className="cursor-pointer focus-ring rounded-full"
                >
                  {config.autoDnsDiagnostic ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-300" />
                  )}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {language === 'vi' ? 'Tối Ưu Margin Tự Động' : 'Smart Margin Adjuster'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Gợi ý tăng/giảm giá khi giá nguồn gốc thay đổi' : 'Suggest price adjustment when rates change'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoMarginOptimizer: !config.autoMarginOptimizer })}
                  className="cursor-pointer focus-ring rounded-full"
                >
                  {config.autoMarginOptimizer ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Telemetry Status Card */}
          <Card
            macChrome
            macTitle="TELEMETRY // ENGINE HEALTH"
            macBadge={<Badge variant="emerald" pulse size="sm">Online</Badge>}
            className="p-5 space-y-3"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  DNS Check Latency
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">~120ms</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Ticket Triage Speed
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">~450ms</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  Margin Rebalance
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">15m cycle</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
};
